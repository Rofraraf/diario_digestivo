import type { TomaId } from '../types/medication'

export interface AlarmaConfig {
  tomaId: TomaId
  activada: boolean
  retrasoMinutos: number
}

export interface ConfigAlarmas {
  permiso: NotificationPermission | 'no_solicitado'
  alarmas: AlarmaConfig[]
}

export const TOMA_HORAS: Record<TomaId, { h: number; m: number }> = {
  manana:   { h: 8,  m: 0 },
  mediodia: { h: 14, m: 0 },
  noche:    { h: 22, m: 0 },
  extra:    { h: 12, m: 0 },
}

export const TOMA_LABELS: Record<TomaId, string> = {
  manana:   '☀️ Mañana',
  mediodia: '🌤️ Mediodía',
  noche:    '🌙 Noche',
  extra:    '⚡ Si precisa',
}

const LS_KEY = 'dd_alarmas_config'

export function loadAlarmasConfig(): ConfigAlarmas {
  try {
    const v = localStorage.getItem(LS_KEY)
    if (v) return JSON.parse(v)
  } catch { /* ignore */ }
  return {
    permiso: 'no_solicitado',
    alarmas: [
      { tomaId: 'manana',   activada: false, retrasoMinutos: 30 },
      { tomaId: 'mediodia', activada: false, retrasoMinutos: 30 },
      { tomaId: 'noche',    activada: false, retrasoMinutos: 30 },
      { tomaId: 'extra',    activada: false, retrasoMinutos: 60 },
    ]
  }
}

export function saveAlarmasConfig(cfg: ConfigAlarmas) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg))
}

export async function pedirPermiso(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  const result = await Notification.requestPermission()
  const cfg = loadAlarmasConfig()
  cfg.permiso = result
  localStorage.setItem(LS_KEY, JSON.stringify(cfg))
  return result
}

export async function comprobarTomasPendientes() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const cfg = loadAlarmasConfig()
  const alarmasActivas = cfg.alarmas.filter(a => a.activada)
  if (alarmasActivas.length === 0) return

  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  const { db } = await import('../db')
  const check = await db.medChecks.where('date').equals(today).first()
  const checks = check?.checks || {}
  const allMeds = await db.medicationDefs.toArray()
  const meds = allMeds.filter(m => !m.hidden)

  for (const alarma of alarmasActivas) {
    const base = TOMA_HORAS[alarma.tomaId]
    const horaAlarma = new Date()
    horaAlarma.setHours(base.h, base.m + alarma.retrasoMinutos, 0, 0)

    if (now < horaAlarma) continue

    const medsDeToma = meds.filter(m => m.tomas?.includes(alarma.tomaId))
    const pendientes = medsDeToma.filter(m => !checks[`${m.id}_${alarma.tomaId}`])
    if (pendientes.length === 0) continue

    const notifKey = `dd_notif_${today}_${alarma.tomaId}`
    if (localStorage.getItem(notifKey)) continue

    const nombres = pendientes
      .map(m => m.principioActivo || m.name.split(' ')[0])
      .join(', ')

    new Notification('💊 Medicación pendiente', {
      body: `${TOMA_LABELS[alarma.tomaId]}: ${nombres}`,
      icon: '/pwa-192x192.png',
      tag: `dd-med-${alarma.tomaId}`,
    })

    localStorage.setItem(notifKey, '1')
  }
}

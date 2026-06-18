import { useState, useEffect } from 'react'
import { Shield, Trash2, Info, Bell, BellOff, Check } from 'lucide-react'
import { deleteAllData } from '../../db'
import { Card, BigButton, ConfirmModal } from '../../components/UI'
import {
  loadAlarmasConfig, saveAlarmasConfig, pedirPermiso,
  comprobarTomasPendientes, TOMA_LABELS,
  type ConfigAlarmas, type AlarmaConfig
} from '../../lib/alarmas'
import type { TomaId } from '../../types/medication'

const RETRASO_OPTS = [
  { v: 15,  l: '15 min después' },
  { v: 30,  l: '30 min después' },
  { v: 45,  l: '45 min después' },
  { v: 60,  l: '1 hora después' },
  { v: 90,  l: '1 hora y media' },
  { v: 120, l: '2 horas después' },
]

const TOMA_HORAS_BASE: Record<TomaId, string> = {
  manana:   '8:00',
  mediodia: '14:00',
  noche:    '22:00',
  extra:    '—',
}

export default function SettingsPage() {
  const [confirmStep, setConfirmStep] = useState(0)
  const [deleted, setDeleted] = useState(false)
  const [alarmaCfg, setAlarmaCfg] = useState<ConfigAlarmas>(loadAlarmasConfig)
  const [solicitando, setSolicitando] = useState(false)
  const [toastAlarma, setToastAlarma] = useState('')

  // Registrar SW de alarmas al montar
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-alarmas.js', { scope: '/' })
        .catch(() => { /* sin SW extra, alarmas solo funcionan con la app abierta */ })
    }
    // Escuchar mensaje del SW para navegar a medicación
    navigator.serviceWorker?.addEventListener('message', (e) => {
      if (e.data?.type === 'DD_IR_A_MEDICACION') {
        window.location.hash = '#medication'
      }
    })
    // Comprobar pendientes al abrir ajustes
    comprobarTomasPendientes()
  }, [])

  async function handleDeleteAll() {
    await deleteAllData()
    setConfirmStep(0)
    setDeleted(true)
    setTimeout(() => setDeleted(false), 3000)
  }

  async function solicitarPermiso() {
    setSolicitando(true)
    const perm = await pedirPermiso()
    const nuevo = { ...alarmaCfg, permiso: perm }
    setAlarmaCfg(nuevo)
    saveAlarmasConfig(nuevo)
    setSolicitando(false)
    if (perm === 'granted') {
      setToastAlarma('✓ Notificaciones activadas')
      setTimeout(() => setToastAlarma(''), 2000)
    }
  }

  function toggleAlarma(tomaId: TomaId) {
    const nuevas = alarmaCfg.alarmas.map(a =>
      a.tomaId === tomaId ? { ...a, activada: !a.activada } : a
    )
    const nuevo = { ...alarmaCfg, alarmas: nuevas }
    setAlarmaCfg(nuevo)
    saveAlarmasConfig(nuevo)
    enviarAlSW(nuevo)
  }

  function cambiarRetraso(tomaId: TomaId, minutos: number) {
    const nuevas = alarmaCfg.alarmas.map(a =>
      a.tomaId === tomaId ? { ...a, retrasoMinutos: minutos } : a
    )
    const nuevo = { ...alarmaCfg, alarmas: nuevas }
    setAlarmaCfg(nuevo)
    saveAlarmasConfig(nuevo)
    enviarAlSW(nuevo)
  }

  function enviarAlSW(cfg: ConfigAlarmas) {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then(reg => {
      reg.active?.postMessage({
        type: 'DD_PROGRAMAR_ALARMAS',
        alarmas: cfg.alarmas.filter(a => a.activada),
        tomaHoras: { manana: { h: 8, m: 0 }, mediodia: { h: 14, m: 0 }, noche: { h: 22, m: 0 }, extra: { h: 12, m: 0 } }
      })
    })
  }

  const permisoOk = alarmaCfg.permiso === 'granted'
  const alarmasActivas = alarmaCfg.alarmas.filter(a => a.activada).length

  return (
    <div className="page-content px-4 pt-4">
      {/* Toast alarma */}
      {toastAlarma && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#2D6A4F] text-white rounded-xl px-5 py-3 text-[15px] font-semibold z-50 shadow-lg">
          {toastAlarma}
        </div>
      )}

      <h2 className="text-[22px] font-bold text-[#1A1A2E] mb-1">Ajustes</h2>
      <p className="text-[14px] text-[#6B7280] mb-5">Diario digestivo personal</p>

      {/* ── ALARMAS ─────────────────────────────────────────────────────── */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FFF9E6] flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-[#D97706]" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#1A1A2E]">Recordatorios de medicación</h3>
            {alarmasActivas > 0 && permisoOk && (
              <p className="text-[13px] text-[#2D6A4F] font-medium">{alarmasActivas} alarma{alarmasActivas > 1 ? 's' : ''} activa{alarmasActivas > 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

        {/* Permiso */}
        {!permisoOk ? (
          <div className="bg-[#FFF9E6] rounded-xl p-4 mb-4">
            <p className="text-[14px] text-[#92600A] mb-3">
              Para recibir avisos cuando no hayas marcado una toma, necesitas activar las notificaciones del móvil.
            </p>
            <BigButton onClick={solicitarPermiso} disabled={solicitando}>
              {solicitando ? 'Solicitando…' : '🔔 Activar notificaciones'}
            </BigButton>
            {alarmaCfg.permiso === 'denied' && (
              <p className="text-[13px] text-[#E76F51] mt-2 text-center">
                Notificaciones bloqueadas. Ve a Ajustes del móvil → Aplicaciones → Diario Digestivo → Notificaciones.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[#D8F3DC] rounded-xl px-3 py-2 mb-4">
            <Check size={16} className="text-[#2D6A4F]" />
            <p className="text-[13px] text-[#2D6A4F] font-semibold">Notificaciones activadas</p>
          </div>
        )}

        {/* Configuración por toma */}
        <div className="space-y-3">
          {alarmaCfg.alarmas.map((alarma: AlarmaConfig) => {
            const horaBase = TOMA_HORAS_BASE[alarma.tomaId]
            const horaAlarma = horaBase !== '—'
              ? (() => {
                  const [h, m] = horaBase.split(':').map(Number)
                  const total = h * 60 + m + alarma.retrasoMinutos
                  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
                })()
              : null

            return (
              <div key={alarma.tomaId}
                className={`rounded-xl border-2 p-3 transition-all ${
                  alarma.activada && permisoOk
                    ? 'border-[#2D6A4F] bg-[#F0FDF4]'
                    : 'border-[#E5E7EB] bg-white'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-semibold text-[#1A1A2E]">
                      {TOMA_LABELS[alarma.tomaId]}
                    </p>
                    {horaBase !== '—' && (
                      <p className="text-[12px] text-[#9CA3AF]">
                        Toma a las {horaBase}
                        {alarma.activada && horaAlarma && (
                          <span className="text-[#2D6A4F] font-medium"> · Aviso a las {horaAlarma}</span>
                        )}
                      </p>
                    )}
                    {alarma.tomaId === 'extra' && (
                      <p className="text-[12px] text-[#9CA3AF]">Sin hora fija</p>
                    )}
                  </div>
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => permisoOk && toggleAlarma(alarma.tomaId)}
                    disabled={!permisoOk}
                    className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                      alarma.activada && permisoOk ? 'bg-[#2D6A4F]' : 'bg-[#E5E7EB]'
                    } ${!permisoOk ? 'opacity-40' : ''}`}
                  >
                    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      alarma.activada && permisoOk ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Selector de retraso — solo si activada y permiso ok */}
                {alarma.activada && permisoOk && (
                  <div className="mt-3 pt-3 border-t border-[#D8F3DC]">
                    <p className="text-[13px] text-[#6B7280] mb-2">Avisar si no se ha tomado…</p>
                    <div className="flex flex-wrap gap-2">
                      {RETRASO_OPTS.map(opt => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => cambiarRetraso(alarma.tomaId, opt.v)}
                          className={`rounded-lg px-3 py-1.5 text-[13px] font-medium border transition-all ${
                            alarma.retrasoMinutos === opt.v
                              ? 'bg-[#2D6A4F] text-white border-transparent'
                              : 'bg-white text-[#374151] border-[#E5E7EB]'
                          }`}
                        >
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-[12px] text-[#9CA3AF] mt-3 leading-relaxed">
          El aviso solo aparece si la app está instalada como PWA y las notificaciones del móvil están activadas. No se mandan datos a ningún servidor.
        </p>
      </Card>

      {/* ── PRIVACIDAD ──────────────────────────────────────────────────── */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-[#2D6A4F]" />
          </div>
          <h3 className="text-[17px] font-bold text-[#1A1A2E]">Privacidad</h3>
        </div>
        <div className="space-y-3 text-[15px] text-[#374151] leading-relaxed">
          <p>Todos los datos se guardan <strong>únicamente en este dispositivo</strong>. No hay servidores, no hay cuenta, no hay sincronización en la nube.</p>
          <p>Nadie más tiene acceso a tu diario. Si borras la app o los datos del navegador, se pierden.</p>
          <p>Usa la opción de <strong>exportar backup</strong> (en la pantalla de exportación) para guardar una copia.</p>
        </div>
      </Card>

      {/* ── AVISO MEDICO ────────────────────────────────────────────────── */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#FFF9E6] flex items-center justify-center flex-shrink-0">
            <Info size={20} className="text-[#D97706]" />
          </div>
          <h3 className="text-[17px] font-bold text-[#1A1A2E]">Aviso médico importante</h3>
        </div>
        <div className="space-y-3 text-[15px] text-[#374151] leading-relaxed">
          <p>Esta aplicación es una <strong>herramienta de registro personal</strong> y no un dispositivo médico.</p>
          <p>Los análisis y patrones mostrados son <strong>observaciones orientativas</strong>. No constituyen diagnóstico médico.</p>
          <p>Si tienes enfermedades cardiovasculares, diabetes u otras condiciones crónicas, <strong>cualquier cambio en síntomas debe consultarse con el médico</strong> antes de modificar dieta o medicación.</p>
          <p>Ante cualquier síntoma preocupante o nuevo, <strong>acude siempre a tu médico o urgencias</strong>.</p>
        </div>
      </Card>

      {/* ── ALMACENAMIENTO ──────────────────────────────────────────────── */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
            <BellOff size={20} className="text-[#3B82F6]" />
          </div>
          <h3 className="text-[17px] font-bold text-[#1A1A2E]">Almacenamiento local</h3>
        </div>
        <p className="text-[14px] text-[#6B7280]">
          Los datos se guardan en IndexedDB del navegador. No se necesita conexión a internet para usar la app (excepto para buscar medicamentos en el vademécum).
        </p>
      </Card>

      {/* ── BORRAR DATOS ────────────────────────────────────────────────── */}
      <Card className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#FEE9E3] flex items-center justify-center flex-shrink-0">
            <Trash2 size={20} className="text-[#E76F51]" />
          </div>
          <h3 className="text-[17px] font-bold text-[#1A1A2E]">Borrar todos los datos</h3>
        </div>

        {deleted ? (
          <div className="flex items-center gap-2 text-[#2D6A4F] font-semibold">
            <Check size={18} /> Datos borrados correctamente
          </div>
        ) : (
          <>
            <p className="text-[14px] text-[#6B7280] mb-3">
              Elimina todos los registros de forma permanente. Esta acción no se puede deshacer.
            </p>
            {confirmStep === 0 && (
              <BigButton variant="danger" onClick={() => setConfirmStep(1)}>
                Borrar todos los datos
              </BigButton>
            )}
            {confirmStep === 1 && (
              <ConfirmModal
                title="¿Borrar todos los datos?"
                message="Se eliminarán todos los registros de comidas, síntomas, baño, medicación e historial. No se puede deshacer."
                onConfirm={handleDeleteAll}
                onCancel={() => setConfirmStep(0)}
                danger
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}

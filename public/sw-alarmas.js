// Service Worker adicional para alarmas de medicación
// Se registra desde main.tsx junto al SW de Workbox

const CHANNEL = 'dd-alarmas'

// Recibe mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'DD_PROGRAMAR_ALARMAS') {
    programar(event.data.alarmas, event.data.tomaHoras)
  }
})

// Almacena los timeouts activos
const timeouts = []

function programar(alarmas, tomaHoras) {
  // Limpia timeouts anteriores
  timeouts.forEach(t => clearTimeout(t))
  timeouts.length = 0

  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  for (const alarma of alarmas) {
    const base = tomaHoras[alarma.tomaId]
    if (!base) continue

    const horaAlarma = new Date()
    horaAlarma.setHours(base.h, base.m + alarma.retrasoMinutos, 0, 0)

    let msHasta = horaAlarma - now
    // Si ya pasó hoy, no programar hasta mañana
    if (msHasta < 0) continue

    const t = setTimeout(() => {
      lanzarNotificacion(alarma.tomaId, today)
    }, msHasta)

    timeouts.push(t)
  }
}

async function lanzarNotificacion(tomaId, date) {
  const tomaLabels = {
    manana: '☀️ Mañana', mediodia: '🌤️ Mediodía',
    noche: '🌙 Noche', extra: '⚡ Si precisa'
  }

  await self.registration.showNotification('💊 Medicación pendiente', {
    body: `Recuerda marcar la toma de ${tomaLabels[tomaId] || tomaId}`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `dd-med-${tomaId}-${date}`,
    renotify: false,
    requireInteraction: true,
    actions: [
      { action: 'abrir', title: 'Ver medicación' },
      { action: 'ok',    title: 'Ya la tomé' },
    ]
  })
}

// Al pulsar la notificación: abre la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'abrir' || event.action === '') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length > 0) {
          clients[0].focus()
          clients[0].postMessage({ type: 'DD_IR_A_MEDICACION' })
        } else {
          self.clients.openWindow('/')
        }
      })
    )
  }
})

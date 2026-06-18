import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { comprobarTomasPendientes } from './lib/alarmas'

// Comprobar tomas pendientes al abrir la app (fallback sin SW)
setTimeout(() => {
  comprobarTomasPendientes()
}, 2000) // espera 2s a que IndexedDB esté lista

// Registrar SW de alarmas adicional
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw-alarmas.js', { scope: '/' })
    .catch(() => { /* SW de alarmas no disponible, funciona con app abierta */ })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

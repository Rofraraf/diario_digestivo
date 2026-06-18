import { useState, useEffect } from 'react'
import { seedIfEmpty } from './db'
import BottomNav, { type NavPage } from './components/BottomNav'
import TodayPage from './pages/Today/TodayPage'
import LogHubPage from './pages/LogHub/LogHubPage'
import MealLogPage from './pages/MealLog/MealLogPage'
import SymptomLogPage from './pages/SymptomLog/SymptomLogPage'
import BathroomLogPage from './pages/BathroomLog/BathroomLogPage'
import MedicationLogPage from './pages/MedicationLog/MedicationLogPage'
import HistoryPage from './pages/History/HistoryPage'
import PatternsPage from './pages/Patterns/PatternsPage'
import CatalogPage from './pages/Catalog/CatalogPage'
import ExportPage from './pages/Export/ExportPage'
import SettingsPage from './pages/Settings/SettingsPage'

type AppPage =
  | 'today' | 'log' | 'history' | 'patterns' | 'settings'
  | 'meal' | 'symptom' | 'bathroom' | 'medication' | 'catalog' | 'export'

const PAGE_TO_NAV: Record<AppPage, NavPage> = {
  today: 'today',
  log: 'log',
  meal: 'log',
  symptom: 'log',
  bathroom: 'log',
  medication: 'log',
  catalog: 'log',
  history: 'history',
  patterns: 'patterns',
  export: 'settings',
  settings: 'settings',
}

const PAGE_TITLES: Partial<Record<AppPage, string>> = {
  meal: 'Registrar comida',
  symptom: 'Registrar sintoma',
  bathroom: 'Registrar bano',
  medication: 'Registrar medicacion',
  catalog: 'Catalogo',
  export: 'Exportar',
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
      <button type="button" onClick={onBack} className="p-1 text-[#2D6A4F] min-w-[40px] min-h-[40px] flex items-center">
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h1 className="text-[20px] font-bold text-[#1A1A2E]">{title}</h1>
    </div>
  )
}

const ROOT_PAGES: AppPage[] = ['today', 'log', 'history', 'patterns', 'settings']

export default function App() {
  const [page, setPage] = useState<AppPage>('today')
  const [navPage, setNavPage] = useState<NavPage>('today')
  const [pageParams, setPageParams] = useState<Record<string, unknown>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seedIfEmpty().then(() => setReady(true))
  }, [])

  function navigateTo(target: string, params?: Record<string, unknown>) {
    setPage(target as AppPage)
    setNavPage(PAGE_TO_NAV[target as AppPage] || 'today')
    setPageParams(params || {})
  }

  function handleNavChange(nav: NavPage) {
    setNavPage(nav)
    setPage(nav)
    setPageParams({})
  }

  function goBack() {
    const parentNav = PAGE_TO_NAV[page] || 'today'
    setPage(parentNav)
    setNavPage(parentNav)
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAF8]">
        <div className="text-center">
          <div className="text-5xl mb-3">🌿</div>
          <p className="text-[20px] font-bold text-[#2D6A4F]">Diario Digestivo</p>
          <p className="text-[15px] text-[#9CA3AF] mt-1">Cargando...</p>
        </div>
      </div>
    )
  }

  const isSubPage = !ROOT_PAGES.includes(page)

  return (
    <div className="min-h-screen bg-[#FAFAF8] max-w-lg mx-auto relative">
      <div style={{ height: 'env(safe-area-inset-top, 0px)' }} className="bg-[#FAFAF8]" />

      {isSubPage && <PageHeader title={PAGE_TITLES[page] || ''} onBack={goBack} />}

      {page === 'today' && <TodayPage onNavigate={navigateTo} />}
      {page === 'log' && <LogHubPage onNavigate={navigateTo} />}
      {page === 'meal' && <MealLogPage onNavigate={navigateTo} params={pageParams} />}
      {page === 'symptom' && <SymptomLogPage onNavigate={navigateTo} />}
      {page === 'bathroom' && <BathroomLogPage onNavigate={navigateTo} />}
      {page === 'medication' && <MedicationLogPage onNavigate={navigateTo} />}
      {page === 'history' && <HistoryPage />}
      {page === 'patterns' && <PatternsPage />}
      {page === 'catalog' && (
        <>
          <PageHeader title="Catalogo" onBack={goBack} />
          <CatalogPage />
        </>
      )}
      {page === 'export' && (
        <>
          <PageHeader title="Exportar" onBack={goBack} />
          <ExportPage />
        </>
      )}
      {page === 'settings' && (
        <div className="page-content px-4 pt-4">
          <h2 className="text-[22px] font-bold text-[#1A1A2E] mb-5">Configuracion</h2>
          <div className="space-y-3 mb-5">
            {[
              { id: 'export', label: 'Exportar e importar', desc: 'PDF, CSV y copias de seguridad' },
              { id: 'catalog', label: 'Gestionar catalogo', desc: 'Alimentos, sintomas y medicacion' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className="w-full text-left bg-white rounded-2xl p-4 border border-[#F0F0EE] shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"
              >
                <div>
                  <p className="text-[16px] font-semibold text-[#1A1A2E]">{item.label}</p>
                  <p className="text-[13px] text-[#9CA3AF]">{item.desc}</p>
                </div>
                <span className="text-[#2D6A4F] text-[20px]">chevron</span>
              </button>
            ))}
          </div>
          <SettingsPage />
        </div>
      )}

      <BottomNav current={navPage} onChange={handleNavChange} />
    </div>
  )
}

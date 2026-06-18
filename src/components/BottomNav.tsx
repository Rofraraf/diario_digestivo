import { Home, PlusCircle, Clock, BarChart2, Settings } from 'lucide-react'

export type NavPage = 'today' | 'log' | 'history' | 'patterns' | 'settings'

interface BottomNavProps {
  current: NavPage
  onChange: (page: NavPage) => void
}

const navItems: { id: NavPage; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
  { id: 'today',    icon: Home,       label: 'Hoy' },
  { id: 'log',      icon: PlusCircle, label: 'Registrar' },
  { id: 'history',  icon: Clock,      label: 'Historial' },
  { id: 'patterns', icon: BarChart2,  label: 'Patrones' },
  { id: 'settings', icon: Settings,   label: 'Ajustes' },
]

export default function BottomNav({ current, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const active = current === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95 min-h-[60px] ${
                active ? 'text-[#2D6A4F]' : 'text-[#9CA3AF]'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={active ? 26 : 24} />
              <span className={`text-[11px] font-${active ? 'bold' : 'medium'}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

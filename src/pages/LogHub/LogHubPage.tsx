import { Utensils, Thermometer, Wind, Pill, BookOpen } from 'lucide-react'
import { Card } from '../../components/UI'

interface LogHubPageProps {
  onNavigate: (page: string) => void
}

const LOG_ACTIONS = [
  {
    id: 'meal',
    icon: Utensils,
    title: 'Registrar comida',
    desc: 'Desayuno, almuerzo, cena y más',
    color: '#2D6A4F',
    bg: '#F0FDF4',
  },
  {
    id: 'symptom',
    icon: Thermometer,
    title: 'Registrar síntoma',
    desc: 'Dolor, hinchazón, gases, náuseas...',
    color: '#E76F51',
    bg: '#FFF5F3',
  },
  {
    id: 'bathroom',
    icon: Wind,
    title: 'Registrar baño',
    desc: 'Escala Bristol y deposiciones',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 'medication',
    icon: Pill,
    title: 'Registrar medicación',
    desc: 'Medicamentos y su efecto',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    id: 'catalog',
    icon: BookOpen,
    title: 'Gestionar catálogo',
    desc: 'Alimentos, síntomas y medicación',
    color: '#6B7280',
    bg: '#F9FAFB',
  },
]

export default function LogHubPage({ onNavigate }: LogHubPageProps) {
  return (
    <div className="page-content px-4 pt-4">
      <h2 className="text-[22px] font-bold text-[#1A1A2E] mb-1">Registrar</h2>
      <p className="text-[14px] text-[#6B7280] mb-5">¿Qué quieres anotar?</p>
      <div className="space-y-3">
        {LOG_ACTIONS.map(action => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onNavigate(action.id)}
              className="w-full text-left active:scale-[0.98] transition-all"
            >
              <Card className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: action.bg }}
                >
                  <Icon size={24} style={{ color: action.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[17px] font-semibold text-[#1A1A2E]">{action.title}</p>
                  <p className="text-[14px] text-[#9CA3AF]">{action.desc}</p>
                </div>
                <span style={{ color: action.color }} className="text-[20px]">›</span>
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  )
}

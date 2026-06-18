import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Utensils, Thermometer, Wind, Pill, ChevronRight, RefreshCw, Star } from 'lucide-react'
import { db, computeDayColor, getOrCreateFactors } from '../../db'
import { Card, DayBadge, BigButton, SelectRow, TextArea } from '../../components/UI'
import type { MealEntry, SymptomEntry, BathroomEntry, MedicationEntry, DailyFactors } from '../../types'
import { MEAL_TYPE_LABELS } from '../../constants/catalogs'

interface TodayPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void
}

export default function TodayPage({ onNavigate }: TodayPageProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [meals, setMeals] = useState<MealEntry[]>([])
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([])
  const [bathroom, setBathroom] = useState<BathroomEntry[]>([])
  const [medications, setMedications] = useState<MedicationEntry[]>([])
  const [factors, setFactors] = useState<DailyFactors | null>(null)
  const [showFactors, setShowFactors] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [m, s, b, med] = await Promise.all([
      db.meals.where('date').equals(today).toArray(),
      db.symptoms.where('date').equals(today).toArray(),
      db.bathroom.where('date').equals(today).toArray(),
      db.medications.where('date').equals(today).toArray(),
    ])
    setMeals(m)
    setSymptoms(s)
    setBathroom(b)
    setMedications(med)
    const f = await getOrCreateFactors(today)
    setFactors(f)
  }

  const dayColor = computeDayColor(symptoms)

  const colorBorders: Record<string, string> = {
    green: 'border-l-4 border-l-[#2D6A4F]',
    yellow: 'border-l-4 border-l-[#E9C46A]',
    red: 'border-l-4 border-l-[#E76F51]',
    gray: '',
  }

  async function saveFactors(updated: DailyFactors) {
    setFactors(updated)
    if (updated.id) {
      await db.dailyFactors.put(updated)
    }
  }

  return (
    <div className="page-content px-4 pt-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[14px] text-[#6B7280] font-medium capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
          <h1 className="text-[28px] font-bold text-[#1A1A2E] leading-tight">Mi día</h1>
        </div>
        <DayBadge color={dayColor} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <SummaryCard
          icon={<Utensils size={20} />}
          label="Comidas"
          count={meals.length}
          color="green"
          detail={meals.length > 0 ? meals.map(m => MEAL_TYPE_LABELS[m.type]).join(', ') : 'Sin registros'}
          borderClass={meals.length > 0 ? colorBorders.green : ''}
        />
        <SummaryCard
          icon={<Thermometer size={20} />}
          label="Síntomas"
          count={symptoms.length}
          color={symptoms.length > 0 ? (dayColor === 'red' ? 'red' : dayColor === 'yellow' ? 'yellow' : 'green') : 'gray'}
          detail={symptoms.length > 0 ? symptoms.flatMap(s => s.symptomNames).slice(0, 2).join(', ') : 'Sin síntomas'}
          borderClass={symptoms.length > 0 ? colorBorders[dayColor] : ''}
        />
        <SummaryCard
          icon={<Wind size={20} />}
          label="Baño"
          count={bathroom.length}
          color={bathroom.length > 0 ? 'green' : 'gray'}
          detail={bathroom.length > 0
            ? bathroom.map(b => b.went ? `Tipo ${b.bristolType || '?'}` : 'Sin deposición').join(', ')
            : 'Sin registros'}
          borderClass={bathroom.length > 0 ? colorBorders.green : ''}
        />
        <SummaryCard
          icon={<Pill size={20} />}
          label="Medicación"
          count={medications.length}
          color={medications.length > 0 ? 'green' : 'gray'}
          detail={medications.length > 0 ? medications.map(m => m.medicationName).slice(0, 2).join(', ') : 'Sin registros'}
          borderClass={medications.length > 0 ? colorBorders.green : ''}
        />
      </div>

      {/* Quick action buttons */}
      <div className="space-y-3 mb-5">
        <BigButton
          icon={<Utensils size={20} />}
          onClick={() => onNavigate('meal')}
          variant="primary"
        >
          Registrar comida
        </BigButton>
        <div className="grid grid-cols-2 gap-3">
          <BigButton
            icon={<Thermometer size={18} />}
            onClick={() => onNavigate('symptom')}
            variant="secondary"
          >
            Síntoma
          </BigButton>
          <BigButton
            icon={<Wind size={18} />}
            onClick={() => onNavigate('bathroom')}
            variant="secondary"
          >
            Baño
          </BigButton>
        </div>
        <BigButton
          icon={<Pill size={18} />}
          onClick={() => onNavigate('medication')}
          variant="ghost"
        >
          Registrar medicación
        </BigButton>
      </div>

      {/* Repeat last meal */}
      {meals.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
              <RefreshCw size={18} className="text-[#2D6A4F]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#1A1A2E]">Repetir última comida</p>
              <p className="text-[13px] text-[#6B7280] truncate">
                {MEAL_TYPE_LABELS[meals[meals.length-1].type]} — {meals[meals.length-1].items.length} alimentos
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('meal', { repeatFrom: meals[meals.length-1].id })}
              className="text-[#2D6A4F] p-2"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </Card>
      )}

      {/* Favorite meals shortcut */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Star size={16} className="text-[#E9C46A]" fill="#E9C46A" />
          <span className="text-[15px] font-semibold text-[#1A1A2E]">Acceso rápido a historial</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('history')}
          className="flex items-center justify-between w-full text-[15px] text-[#2D6A4F] font-medium"
        >
          Ver historial y calendario
          <ChevronRight size={18} />
        </button>
      </Card>

      {/* Daily factors */}
      <Card className="mb-4">
        <button
          type="button"
          onClick={() => setShowFactors(v => !v)}
          className="flex items-center justify-between w-full"
        >
          <span className="text-[16px] font-semibold text-[#1A1A2E]">Factores del día</span>
          <span className="text-[13px] text-[#6B7280]">{showFactors ? 'Cerrar' : 'Editar'}</span>
        </button>

        {factors && (
          <div className="mt-1 text-[13px] text-[#6B7280]">
            {factors.stress && <span className="mr-2">Estrés: {factors.stress}</span>}
            {factors.sleep && <span className="mr-2">Sueño: {factors.sleep}</span>}
            {factors.water && <span>Agua: {factors.water}</span>}
          </div>
        )}

        {showFactors && factors && (
          <div className="mt-4 space-y-2">
            <SelectRow
              label="Nivel de estrés"
              options={[
                { value: 'bajo', label: 'Bajo' },
                { value: 'medio', label: 'Medio' },
                { value: 'alto', label: 'Alto' },
              ]}
              value={factors.stress || ''}
              onChange={v => saveFactors({ ...factors, stress: v as DailyFactors['stress'] })}
            />
            <SelectRow
              label="Calidad del sueño"
              options={[
                { value: 'bien', label: 'Bien' },
                { value: 'regular', label: 'Regular' },
                { value: 'mal', label: 'Mal' },
              ]}
              value={factors.sleep || ''}
              onChange={v => saveFactors({ ...factors, sleep: v as DailyFactors['sleep'] })}
            />
            <SelectRow
              label="Agua bebida"
              options={[
                { value: 'poca', label: 'Poca' },
                { value: 'normal', label: 'Normal' },
                { value: 'mucha', label: 'Mucha' },
              ]}
              value={factors.water || ''}
              onChange={v => saveFactors({ ...factors, water: v as DailyFactors['water'] })}
            />
            <SelectRow
              label="Actividad física"
              options={[
                { value: 'nada', label: 'Nada' },
                { value: 'paseo', label: 'Paseo' },
                { value: 'normal', label: 'Normal' },
                { value: 'alta', label: 'Alta' },
              ]}
              value={factors.activity || ''}
              onChange={v => saveFactors({ ...factors, activity: v as DailyFactors['activity'] })}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => saveFactors({ ...factors, ateQuick: !factors.ateQuick })}
                className={`flex-1 rounded-xl py-3 text-[14px] font-medium border transition-all ${
                  factors.ateQuick
                    ? 'bg-[#2D6A4F] text-white border-transparent'
                    : 'bg-white text-[#374151] border-[#E5E7EB]'
                }`}
              >
                Comió rápido
              </button>
              <button
                type="button"
                onClick={() => saveFactors({ ...factors, ateOut: !factors.ateOut })}
                className={`flex-1 rounded-xl py-3 text-[14px] font-medium border transition-all ${
                  factors.ateOut
                    ? 'bg-[#2D6A4F] text-white border-transparent'
                    : 'bg-white text-[#374151] border-[#E5E7EB]'
                }`}
              >
                Fuera de casa
              </button>
            </div>
            <TextArea
              label="Notas del día"
              value={factors.notes || ''}
              onChange={v => saveFactors({ ...factors, notes: v })}
              placeholder="Anotaciones adicionales..."
              rows={2}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────
interface SummaryCardProps {
  icon: React.ReactNode
  label: string
  count: number
  color: string
  detail: string
  borderClass: string
}

function SummaryCard({ icon, label, count, color: _color, detail, borderClass }: SummaryCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-3 shadow-sm border border-[#F0F0EE] ${borderClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[#2D6A4F]">{icon}</span>
        <span className="text-[13px] font-semibold text-[#374151]">{label}</span>
      </div>
      <p className="text-[22px] font-bold text-[#1A1A2E]">{count}</p>
      <p className="text-[12px] text-[#9CA3AF] line-clamp-2 mt-0.5">{detail}</p>
    </div>
  )
}

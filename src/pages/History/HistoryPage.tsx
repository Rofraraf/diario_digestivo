import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Trash2, Utensils, Thermometer, Wind, Pill } from 'lucide-react'
import { db, computeDayColor } from '../../db'
import { Card, ConfirmModal } from '../../components/UI'
import type { MealEntry, SymptomEntry, BathroomEntry, MedicationEntry, DailyFactors } from '../../types'
import { MEAL_TYPE_LABELS, BRISTOL_DESCRIPTIONS } from '../../constants/catalogs'

type DayColorMap = Record<string, 'green' | 'yellow' | 'red' | 'gray'>

export default function HistoryPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [dayColors, setDayColors] = useState<DayColorMap>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [meals, setMeals] = useState<MealEntry[]>([])
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([])
  const [bathroom, setBathroom] = useState<BathroomEntry[]>([])
  const [medications, setMedications] = useState<MedicationEntry[]>([])
  const [factors, setFactors] = useState<DailyFactors | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number } | null>(null)

  useEffect(() => {
    loadMonthColors()
  }, [currentMonth])

  async function loadMonthColors() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const monthSymptoms = await db.symptoms.where('date').between(start, end, true, true).toArray()
    const map: DayColorMap = {}
    // Group by date
    const byDate: Record<string, SymptomEntry[]> = {}
    monthSymptoms.forEach(s => {
      if (!byDate[s.date]) byDate[s.date] = []
      byDate[s.date].push(s)
    })
    // For days with data but no symptoms, mark green
    const allLogs = await db.meals.where('date').between(start, end, true, true).toArray()
    allLogs.forEach(m => {
      if (!map[m.date]) map[m.date] = 'gray'
    })
    Object.entries(byDate).forEach(([date, syms]) => {
      map[date] = computeDayColor(syms)
    })
    // Days with meals but no symptoms = green
    Object.keys(map).forEach(date => {
      if (!byDate[date]) map[date] = 'green'
    })
    setDayColors(map)
  }

  async function loadDayDetail(date: string) {
    const [m, s, b, med, f] = await Promise.all([
      db.meals.where('date').equals(date).toArray(),
      db.symptoms.where('date').equals(date).toArray(),
      db.bathroom.where('date').equals(date).toArray(),
      db.medications.where('date').equals(date).toArray(),
      db.dailyFactors.where('date').equals(date).first(),
    ])
    setMeals(m)
    setSymptoms(s)
    setBathroom(b)
    setMedications(med)
    setFactors(f || null)
    setSelectedDate(date)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const { type, id } = deleteTarget
    if (type === 'meal') await db.meals.delete(id)
    else if (type === 'symptom') await db.symptoms.delete(id)
    else if (type === 'bathroom') await db.bathroom.delete(id)
    else if (type === 'medication') await db.medications.delete(id)
    setDeleteTarget(null)
    if (selectedDate) loadDayDetail(selectedDate)
    loadMonthColors()
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startPad = (getDay(startOfMonth(currentMonth)) + 6) % 7 // Monday-first

  const colorClasses: Record<string, string> = {
    green:  'bg-[#D1FAE5] text-[#065F46]',
    yellow: 'bg-[#FEF3C7] text-[#92400E]',
    red:    'bg-[#FEE2E2] text-[#991B1B]',
    gray:   'bg-[#F3F4F6] text-[#6B7280]',
  }

  return (
    <div className="page-content px-4 pt-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))} className="p-2">
          <ChevronLeft size={24} className="text-[#2D6A4F]" />
        </button>
        <h2 className="text-[20px] font-bold text-[#1A1A2E] capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h2>
        <button type="button" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))} className="p-2">
          <ChevronRight size={24} className="text-[#2D6A4F]" />
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
          <div key={d} className="text-center text-[12px] font-semibold text-[#9CA3AF] py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-5">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const color = dayColors[dateStr]
          const isSelected = selectedDate === dateStr
          const isCurrentDay = isToday(day)
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => loadDayDetail(dateStr)}
              className={`aspect-square flex items-center justify-center rounded-xl text-[15px] font-medium transition-all active:scale-95 ${
                isSelected
                  ? 'ring-2 ring-[#2D6A4F] ring-offset-1'
                  : ''
              } ${color ? colorClasses[color] : 'text-[#374151]'} ${
                isCurrentDay ? 'font-bold' : ''
              } ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}`}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap mb-5 text-[13px]">
        {[
          { color: 'green', label: 'Buen día' },
          { color: 'yellow', label: 'Molestias moderadas' },
          { color: 'red', label: 'Molestias fuertes' },
          { color: 'gray', label: 'Sin datos' },
        ].map(({ color, label }) => (
          <div key={color} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
            <span className="text-[#6B7280]">{label}</span>
          </div>
        ))}
      </div>

      {/* Day detail */}
      {selectedDate && (
        <div>
          <h3 className="text-[18px] font-bold text-[#1A1A2E] mb-3 capitalize">
            {format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: es })}
          </h3>

          {/* Meals */}
          {meals.length > 0 && (
            <Card className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Utensils size={16} className="text-[#2D6A4F]" />
                <span className="text-[15px] font-semibold text-[#374151]">Comidas ({meals.length})</span>
              </div>
              {meals.map(meal => (
                <div key={meal.id} className="py-2 border-t border-[#F3F4F6] first:border-t-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-[#1A1A2E]">{MEAL_TYPE_LABELS[meal.type]}</p>
                      <p className="text-[13px] text-[#6B7280]">{meal.items.map(i => i.foodName).join(', ')}</p>
                      {meal.condimentNames?.length > 0 && (
                        <p className="text-[12px] text-[#9CA3AF]">Condimentos: {meal.condimentNames.join(', ')}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'meal', id: meal.id! })}
                      className="p-2 text-[#E76F51]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Symptoms */}
          {symptoms.length > 0 && (
            <Card className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer size={16} className="text-[#E76F51]" />
                <span className="text-[15px] font-semibold text-[#374151]">Síntomas ({symptoms.length})</span>
              </div>
              {symptoms.map(symptom => (
                <div key={symptom.id} className="py-2 border-t border-[#F3F4F6] first:border-t-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-[#1A1A2E]">{symptom.symptomNames.join(', ')}</p>
                      <p className="text-[13px] text-[#6B7280]">Intensidad: {symptom.intensity}/5 {symptom.duration && `· ${symptom.duration}`}</p>
                      {symptom.veryBadDay && <span className="text-[12px] font-semibold text-[#991B1B] bg-[#FEE2E2] px-2 py-0.5 rounded-full">Día muy malo</span>}
                    </div>
                    <button type="button" onClick={() => setDeleteTarget({ type: 'symptom', id: symptom.id! })} className="p-2 text-[#E76F51]">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Bathroom */}
          {bathroom.length > 0 && (
            <Card className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Wind size={16} className="text-[#3B82F6]" />
                <span className="text-[15px] font-semibold text-[#374151]">Baño ({bathroom.length})</span>
              </div>
              {bathroom.map(entry => (
                <div key={entry.id} className="py-2 border-t border-[#F3F4F6] first:border-t-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {entry.went ? (
                        <>
                          <p className="text-[15px] font-medium text-[#1A1A2E]">{entry.bristolType ? BRISTOL_DESCRIPTIONS[entry.bristolType] : 'Fue al baño'}</p>
                          <p className="text-[13px] text-[#6B7280]">Esfuerzo: {entry.effort || 'no registrado'}</p>
                        </>
                      ) : (
                        <p className="text-[15px] font-medium text-[#6B7280]">No fue al baño</p>
                      )}
                    </div>
                    <button type="button" onClick={() => setDeleteTarget({ type: 'bathroom', id: entry.id! })} className="p-2 text-[#E76F51]">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Medications */}
          {medications.length > 0 && (
            <Card className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Pill size={16} className="text-[#8B5CF6]" />
                <span className="text-[15px] font-semibold text-[#374151]">Medicación ({medications.length})</span>
              </div>
              {medications.map(med => (
                <div key={med.id} className="py-2 border-t border-[#F3F4F6] first:border-t-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-[#1A1A2E]">{med.medicationName}</p>
                      <p className="text-[13px] text-[#6B7280]">{med.dose && `${med.dose} · `}Con comida: {med.withFood ? 'Sí' : med.withFood === false ? 'No' : 'N/D'}</p>
                    </div>
                    <button type="button" onClick={() => setDeleteTarget({ type: 'medication', id: med.id! })} className="p-2 text-[#E76F51]">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Factors */}
          {factors && (
            <Card className="mb-3">
              <span className="text-[15px] font-semibold text-[#374151] block mb-2">Factores del día</span>
              <div className="flex flex-wrap gap-2">
                {factors.stress && <span className="text-[13px] bg-[#F3F4F6] rounded-full px-3 py-1">Estrés: {factors.stress}</span>}
                {factors.sleep && <span className="text-[13px] bg-[#F3F4F6] rounded-full px-3 py-1">Sueño: {factors.sleep}</span>}
                {factors.water && <span className="text-[13px] bg-[#F3F4F6] rounded-full px-3 py-1">Agua: {factors.water}</span>}
                {factors.activity && <span className="text-[13px] bg-[#F3F4F6] rounded-full px-3 py-1">Actividad: {factors.activity}</span>}
                {factors.ateQuick && <span className="text-[13px] bg-[#FEF3C7] rounded-full px-3 py-1">Comió rápido</span>}
                {factors.ateOut && <span className="text-[13px] bg-[#FEF3C7] rounded-full px-3 py-1">Fuera de casa</span>}
                {factors.notes && <p className="text-[13px] text-[#6B7280] w-full mt-1">{factors.notes}</p>}
              </div>
            </Card>
          )}

          {meals.length === 0 && symptoms.length === 0 && bathroom.length === 0 && medications.length === 0 && !factors && (
            <div className="text-center py-8 text-[#9CA3AF]">
              <p className="text-[16px]">Sin registros para este día</p>
            </div>
          )}
        </div>
      )}

      {/* Confirm delete */}
      {deleteTarget && (
        <ConfirmModal
          title="Eliminar registro"
          message="¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { BarChart2, AlertCircle, Info } from 'lucide-react'
import { db, computeDayColor } from '../../db'
import { Card } from '../../components/UI'
import type { BathroomEntry } from '../../types'

interface PatternData {
  foodsBeforeSymptoms: { name: string; count: number }[]
  condimentsBeforeSymptoms: { name: string; count: number }[]
  bristolLowWithSymptoms: number
  onligolWithImprovement: number
  onligolTotal: number
  weeklyStats: { week: string; avgIntensity: number; green: number; yellow: number; red: number }[]
  topSymptoms: { name: string; count: number }[]
  totalDays: number
  daysWithData: number
}

function PatternCard({ title, children, type = 'info' }: {
  title: string
  children: React.ReactNode
  type?: 'info' | 'warning' | 'observation'
}) {
  const styles = {
    info:        'bg-[#EFF6FF] border-[#BFDBFE]',
    warning:     'bg-[#FFFBEB] border-[#FDE68A]',
    observation: 'bg-[#F0FDF4] border-[#A7F3D0]',
  }
  const icons = {
    info:        <Info size={16} className="text-[#3B82F6] flex-shrink-0 mt-0.5" />,
    warning:     <AlertCircle size={16} className="text-[#D97706] flex-shrink-0 mt-0.5" />,
    observation: <BarChart2 size={16} className="text-[#2D6A4F] flex-shrink-0 mt-0.5" />,
  }
  return (
    <div className={`rounded-2xl p-4 border ${styles[type]} mb-3`}>
      <div className="flex gap-2 mb-2">
        {icons[type]}
        <span className="text-[14px] font-semibold text-[#1A1A2E]">{title}</span>
      </div>
      <div className="text-[14px] text-[#374151] leading-relaxed">{children}</div>
    </div>
  )
}

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<PatternData | null>(null)
  const [loading, setLoading] = useState(true)
  const [daysRange, setDaysRange] = useState(30)

  useEffect(() => {
    analyzePatterns()
  }, [daysRange])

  async function analyzePatterns() {
    setLoading(true)
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const startDate = format(subDays(new Date(), daysRange), 'yyyy-MM-dd')

    const [meals, symptoms, bathroom, medications] = await Promise.all([
      db.meals.where('date').between(startDate, endDate, true, true).toArray(),
      db.symptoms.where('date').between(startDate, endDate, true, true).toArray(),
      db.bathroom.where('date').between(startDate, endDate, true, true).toArray(),
      db.medications.where('date').between(startDate, endDate, true, true).toArray(),
    ])

    // 1. Foods in 0-6h before symptoms with intensity >= 3
    const severeSymptoms = symptoms.filter(s => s.intensity >= 3)
    const foodCounts: Record<string, number> = {}
    const condimentCounts: Record<string, number> = {}

    severeSymptoms.forEach(symptom => {
      const sixHoursBefore = symptom.datetime - 6 * 60 * 60 * 1000
      const relevantMeals = meals.filter(m =>
        m.createdAt >= sixHoursBefore && m.createdAt <= symptom.datetime
      )
      relevantMeals.forEach(meal => {
        meal.items.forEach(item => {
          foodCounts[item.foodName] = (foodCounts[item.foodName] || 0) + 1
        })
        meal.condimentNames?.forEach(name => {
          condimentCounts[name] = (condimentCounts[name] || 0) + 1
        })
      })
    })

    const foodsBeforeSymptoms = Object.entries(foodCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    const condimentsBeforeSymptoms = Object.entries(condimentCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    // 2. Days with Bristol 1-2 and bloating/hardness
    const bloatingSymptomNames = ['Hinchazón', 'Barriga dura', 'Gases']
    let bristolLowWithSymptoms = 0
    const bathroomByDate: Record<string, BathroomEntry[]> = {}
    bathroom.forEach(b => {
      if (!bathroomByDate[b.date]) bathroomByDate[b.date] = []
      bathroomByDate[b.date].push(b)
    })
    Object.entries(bathroomByDate).forEach(([date, entries]) => {
      const hasBristolLow = entries.some(e => e.went && e.bristolType && e.bristolType <= 2)
      const daySymptoms = symptoms.filter(s => s.date === date)
      const hasBloating = daySymptoms.some(s =>
        s.symptomNames.some(n => bloatingSymptomNames.includes(n))
      )
      if (hasBristolLow && hasBloating) bristolLowWithSymptoms++
    })

    // 3. Onligol improvement
    const onligolMeds = medications.filter(m =>
      m.medicationName.toLowerCase().includes('onligol')
    )
    const onligolWithImprovement = onligolMeds.filter(m =>
      m.improvement === 'si' || m.improvement === 'parcial'
    ).length

    // 4. Weekly stats (last 4 weeks)
    const weeklyStats = []
    for (let w = 0; w < 4; w++) {
      const weekEnd = subDays(new Date(), w * 7)
      const weekStart = subDays(weekEnd, 6)
      const ws = format(weekStart, 'yyyy-MM-dd')
      const we = format(weekEnd, 'yyyy-MM-dd')
      const weekSymptoms = symptoms.filter(s => s.date >= ws && s.date <= we)
      const avgIntensity = weekSymptoms.length > 0
        ? Math.round(weekSymptoms.reduce((sum, s) => sum + s.intensity, 0) / weekSymptoms.length * 10) / 10
        : 0
      let green = 0, yellow = 0, red = 0
      // Check 7 days
      for (let d = 0; d < 7; d++) {
        const date = format(subDays(weekEnd, d), 'yyyy-MM-dd')
        const daySym = symptoms.filter(s => s.date === date)
        const color = computeDayColor(daySym)
        if (color === 'green') green++
        else if (color === 'yellow') yellow++
        else if (color === 'red') red++
      }
      weeklyStats.unshift({ week: `Sem. ${format(weekStart, 'd/M')}`, avgIntensity, green, yellow, red })
    }

    // 5. Top symptoms
    const symptomCounts: Record<string, number> = {}
    symptoms.forEach(s => {
      s.symptomNames.forEach(n => {
        symptomCounts[n] = (symptomCounts[n] || 0) + 1
      })
    })
    const topSymptoms = Object.entries(symptomCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    // Count days with data
    const allDates = new Set([
      ...meals.map(m => m.date),
      ...symptoms.map(s => s.date),
      ...bathroom.map(b => b.date),
    ])

    setPatterns({
      foodsBeforeSymptoms,
      condimentsBeforeSymptoms,
      bristolLowWithSymptoms,
      onligolWithImprovement,
      onligolTotal: onligolMeds.length,
      weeklyStats,
      topSymptoms,
      totalDays: daysRange,
      daysWithData: allDates.size,
    })
    setLoading(false)
  }

  const hasSufficientData = patterns && patterns.daysWithData >= 5

  return (
    <div className="page-content px-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[22px] font-bold text-[#1A1A2E]">Posibles patrones</h2>
      </div>
      <p className="text-[13px] text-[#6B7280] mb-4">
        Este análisis muestra observaciones a partir de tus registros. No es un diagnóstico médico.
      </p>

      {/* Range selector */}
      <div className="flex gap-2 mb-4">
        {[14, 30, 60, 90].map(days => (
          <button
            key={days}
            type="button"
            onClick={() => setDaysRange(days)}
            className={`flex-1 rounded-xl py-2 text-[14px] font-medium border transition-all ${
              daysRange === days
                ? 'bg-[#2D6A4F] text-white border-transparent'
                : 'bg-white text-[#374151] border-[#E5E7EB]'
            }`}
          >
            {days}d
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-[#9CA3AF]">
          <p>Analizando datos...</p>
        </div>
      )}

      {!loading && !hasSufficientData && (
        <PatternCard title="No hay datos suficientes" type="info">
          <p>Se necesitan al menos 5 días con registros para mostrar patrones. Sigue registrando tus comidas y síntomas diariamente.</p>
          <p className="mt-1 font-medium">Días registrados: {patterns?.daysWithData || 0} de {daysRange}</p>
        </PatternCard>
      )}

      {!loading && hasSufficientData && patterns && (
        <>
          {/* Disclaimer */}
          <div className="bg-[#F9FAFB] rounded-xl p-3 mb-4 border border-[#E5E7EB]">
            <p className="text-[12px] text-[#6B7280] leading-relaxed">
              ⚕️ Estos resultados no son diagnóstico. Son datos útiles para comentar con el médico.
            </p>
          </div>

          {/* Weekly evolution */}
          <Card className="mb-4">
            <h3 className="text-[16px] font-bold text-[#1A1A2E] mb-3">Evolución semanal</h3>
            {patterns.weeklyStats.map(week => (
              <div key={week.week} className="mb-3">
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="font-medium text-[#374151]">{week.week}</span>
                  <span className="text-[#6B7280]">Intensidad media: {week.avgIntensity}/5</span>
                </div>
                <div className="flex gap-1 h-6">
                  {week.green > 0 && (
                    <div style={{ flex: week.green }} className="bg-[#D1FAE5] rounded-l-full flex items-center justify-center text-[11px] font-bold text-[#065F46]">
                      {week.green > 1 ? week.green : ''}
                    </div>
                  )}
                  {week.yellow > 0 && (
                    <div style={{ flex: week.yellow }} className="bg-[#FEF3C7] flex items-center justify-center text-[11px] font-bold text-[#92400E]">
                      {week.yellow > 1 ? week.yellow : ''}
                    </div>
                  )}
                  {week.red > 0 && (
                    <div style={{ flex: week.red }} className="bg-[#FEE2E2] rounded-r-full flex items-center justify-center text-[11px] font-bold text-[#991B1B]">
                      {week.red > 1 ? week.red : ''}
                    </div>
                  )}
                  {week.green === 0 && week.yellow === 0 && week.red === 0 && (
                    <div className="flex-1 bg-[#F3F4F6] rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </Card>

          {/* Top symptoms */}
          {patterns.topSymptoms.length > 0 && (
            <Card className="mb-4">
              <h3 className="text-[16px] font-bold text-[#1A1A2E] mb-3">Síntomas más frecuentes</h3>
              {patterns.topSymptoms.map(({ name, count }) => (
                <div key={name} className="flex items-center gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-[14px] mb-1">
                      <span className="font-medium text-[#374151]">{name}</span>
                      <span className="text-[#6B7280]">{count}x</span>
                    </div>
                    <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E76F51] rounded-full"
                        style={{ width: `${Math.min(100, (count / patterns.topSymptoms[0].count) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Foods before symptoms */}
          {patterns.foodsBeforeSymptoms.length > 0 && (
            <PatternCard title="Posible asociación: alimentos y síntomas" type="observation">
              <p className="mb-2">Los siguientes alimentos aparecen con mayor frecuencia en las 6 horas antes de síntomas de intensidad 3 o mayor:</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {patterns.foodsBeforeSymptoms.map(({ name, count }) => (
                  <span key={name} className="bg-white border border-[#A7F3D0] rounded-full px-3 py-1 text-[13px] font-medium text-[#1A1A2E]">
                    {name} ({count}x)
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-[#6B7280] italic">Dato útil para comentar con el médico. No implica que sean la causa.</p>
            </PatternCard>
          )}

          {/* Condiments before symptoms */}
          {patterns.condimentsBeforeSymptoms.length > 0 && (
            <PatternCard title="Posible asociación: condimentos y síntomas" type="observation">
              <p className="mb-2">Condimentos presentes antes de síntomas importantes:</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {patterns.condimentsBeforeSymptoms.map(({ name, count }) => (
                  <span key={name} className="bg-white border border-[#A7F3D0] rounded-full px-3 py-1 text-[13px] font-medium">
                    {name} ({count}x)
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-[#6B7280] italic">Patrón observado. No es diagnóstico.</p>
            </PatternCard>
          )}

          {/* Bristol low with bloating */}
          {patterns.bristolLowWithSymptoms > 0 && (
            <PatternCard title="Patrón observado: heces duras y molestias" type="warning">
              <p>En {patterns.bristolLowWithSymptoms} ocasión(es) se registraron heces de tipo 1 o 2 (duras) junto con síntomas como hinchazón o barriga dura.</p>
              <p className="mt-1 text-[12px] text-[#6B7280] italic">Dato útil para comentar con el médico.</p>
            </PatternCard>
          )}

          {/* Onligol improvement */}
          {patterns.onligolTotal > 0 && (
            <PatternCard title="Registro de Onligol" type="info">
              <p>Se registraron {patterns.onligolTotal} tomas de Onligol en este período.</p>
              {patterns.onligolWithImprovement > 0 && (
                <p className="mt-1">En {patterns.onligolWithImprovement} de ellas se registró mejoría posterior (completa o parcial).</p>
              )}
              <p className="mt-1 text-[12px] text-[#6B7280] italic">Dato útil para comentar con el médico.</p>
            </PatternCard>
          )}

          <div className="bg-[#F3F4F6] rounded-xl p-4 text-center">
            <p className="text-[13px] text-[#6B7280]">
              Análisis basado en {patterns.daysWithData} días con datos (últimos {daysRange} días)
            </p>
          </div>
        </>
      )}
    </div>
  )
}

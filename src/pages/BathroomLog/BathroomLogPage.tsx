import { useState } from 'react'
import { format } from 'date-fns'
import { Check } from 'lucide-react'
import { db } from '../../db'
import { BigButton, Card, TextArea, DateTimeInput, SelectRow } from '../../components/UI'
import type { BathroomEntry } from '../../types'
import { BRISTOL_DESCRIPTIONS } from '../../constants/catalogs'

interface BathroomLogPageProps {
  onNavigate: (page: string) => void
}

function ToggleYesNo({ label, value, onChange }: { label: string; value: boolean | undefined; onChange: (v: boolean) => void }) {
  return (
    <div className="mb-3">
      <span className="block text-[15px] font-semibold text-[#374151] mb-2">{label}</span>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 rounded-xl py-3 text-[15px] font-semibold border-2 transition-all ${
            value === true ? 'bg-[#2D6A4F] text-white border-transparent' : 'bg-white text-[#374151] border-[#E5E7EB]'
          }`}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 rounded-xl py-3 text-[15px] font-semibold border-2 transition-all ${
            value === false ? 'bg-[#374151] text-white border-transparent' : 'bg-white text-[#374151] border-[#E5E7EB]'
          }`}
        >
          No
        </button>
      </div>
    </div>
  )
}

export default function BathroomLogPage({ onNavigate }: BathroomLogPageProps) {
  const [went, setWent] = useState<boolean | undefined>(undefined)
  const [bristolType, setBristolType] = useState<number | undefined>(undefined)
  const [effort, setEffort] = useState<BathroomEntry['effort']>('poco')
  const [incomplete, setIncomplete] = useState<boolean | undefined>(undefined)
  const [gasBefore, setGasBefore] = useState<boolean | undefined>(undefined)
  const [gasAfter, setGasAfter] = useState<boolean | undefined>(undefined)
  const [painBefore, setPainBefore] = useState<boolean | undefined>(undefined)
  const [painAfter, setPainAfter] = useState<boolean | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [datetime, setDatetime] = useState(Date.now())
  const [saved, setSaved] = useState(false)

  async function saveBathroom() {
    if (went === undefined) return
    const date = format(new Date(datetime), 'yyyy-MM-dd')
    await db.bathroom.add({
      date,
      datetime,
      went,
      bristolType: went ? bristolType as BathroomEntry['bristolType'] : undefined,
      effort: went ? effort : undefined,
      incomplete: went ? incomplete : undefined,
      gasBefore,
      gasAfter,
      painBefore,
      painAfter,
      notes,
    } as BathroomEntry)
    setSaved(true)
  }

  if (saved) {
    return (
      <div className="page-content px-4 pt-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-[#D1FAE5] flex items-center justify-center mb-4">
          <Check size={40} className="text-[#2D6A4F]" />
        </div>
        <h2 className="text-[24px] font-bold text-[#1A1A2E] mb-2">Registro guardado</h2>
        <p className="text-[15px] text-[#6B7280] text-center mb-8">Visita al baño registrada correctamente</p>
        <div className="w-full space-y-3">
          <BigButton onClick={() => { setSaved(false); setWent(undefined); setBristolType(undefined); setNotes('') }}>
            Registrar otra visita
          </BigButton>
          <BigButton variant="secondary" onClick={() => onNavigate('today')}>
            Volver al inicio
          </BigButton>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content px-4 pt-4">
      <h2 className="text-[22px] font-bold text-[#1A1A2E] mb-4">Registrar baño</h2>

      <Card className="mb-4">
        <DateTimeInput label="Fecha y hora" value={datetime} onChange={setDatetime} />
      </Card>

      <Card className="mb-4">
        <ToggleYesNo label="¿Ha ido al baño?" value={went} onChange={setWent} />
      </Card>

      {went && (
        <>
          {/* Bristol scale */}
          <Card className="mb-4">
            <span className="block text-[15px] font-semibold text-[#374151] mb-3">Escala de Bristol</span>
            <div className="space-y-2">
              {([1, 2, 3, 4, 5, 6, 7] as const).map(type => {
                const isGood = type === 3 || type === 4
                const isBad = type === 1 || type === 2 || type === 6 || type === 7
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBristolType(type)}
                    className={`w-full text-left rounded-xl px-4 py-3 border-2 text-[15px] font-medium transition-all active:scale-[0.98] ${
                      bristolType === type
                        ? 'bg-[#2D6A4F] text-white border-transparent'
                        : 'bg-white text-[#374151] border-[#E5E7EB]'
                    }`}
                  >
                    <span className="mr-2">{isGood ? '🟢' : isBad ? '🔴' : '🟡'}</span>
                    {BRISTOL_DESCRIPTIONS[type]}
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="mb-4">
            <SelectRow
              label="Esfuerzo necesario"
              options={[
                { value: 'ninguno', label: 'Ninguno' },
                { value: 'poco', label: 'Poco' },
                { value: 'bastante', label: 'Bastante' },
                { value: 'mucho', label: 'Mucho' },
              ]}
              value={effort || ''}
              onChange={v => setEffort(v as BathroomEntry['effort'])}
            />
          </Card>

          <Card className="mb-4 space-y-3">
            <ToggleYesNo label="¿Sensación de no terminar?" value={incomplete} onChange={setIncomplete} />
          </Card>
        </>
      )}

      <Card className="mb-4 space-y-3">
        <ToggleYesNo label="¿Gases antes?" value={gasBefore} onChange={setGasBefore} />
        <ToggleYesNo label="¿Gases después?" value={gasAfter} onChange={setGasAfter} />
        <ToggleYesNo label="¿Dolor o malestar antes?" value={painBefore} onChange={setPainBefore} />
        <ToggleYesNo label="¿Dolor o malestar después?" value={painAfter} onChange={setPainAfter} />
      </Card>

      <TextArea label="Notas" value={notes} onChange={setNotes} placeholder="Observaciones adicionales..." rows={2} />

      <BigButton onClick={saveBathroom} disabled={went === undefined}>
        Guardar registro
      </BigButton>
    </div>
  )
}

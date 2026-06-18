import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Check, AlertTriangle, Plus } from 'lucide-react'
import { db } from '../../db'
import { BigButton, Card, TextArea, IntensitySlider, DateTimeInput, TextInput, Modal } from '../../components/UI'
import type { SymptomDef, SymptomEntry } from '../../types'

interface SymptomLogPageProps {
  onNavigate: (page: string) => void
}

export default function SymptomLogPage({ onNavigate }: SymptomLogPageProps) {
  const [symptomDefs, setSymptomDefs] = useState<SymptomDef[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [intensity, setIntensity] = useState(2)
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [datetime, setDatetime] = useState(Date.now())
  const [veryBadDay, setVeryBadDay] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showAddSymptom, setShowAddSymptom] = useState(false)
  const [newSymptomName, setNewSymptomName] = useState('')

  useEffect(() => {
    loadSymptoms()
  }, [])

  async function loadSymptoms() {
    const all = await db.symptomDefs.toArray()
    setSymptomDefs(all.filter(d => !d.hidden).sort((a, b) => b.useCount - a.useCount))
  }

  function toggleSymptom(id: number) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function addNewSymptom() {
    if (!newSymptomName.trim()) return
    const id = await db.symptomDefs.add({ name: newSymptomName.trim(), hidden: false, useCount: 0 } as SymptomDef)
    setSymptomDefs(prev => [...prev, { id, name: newSymptomName.trim(), hidden: false, useCount: 0 }])
    setSelectedIds(prev => [...prev, id])
    setNewSymptomName('')
    setShowAddSymptom(false)
  }

  async function saveSymptom() {
    if (selectedIds.length === 0 && !veryBadDay) return
    const selected = symptomDefs.filter(s => selectedIds.includes(s.id!))
    const date = format(new Date(datetime), 'yyyy-MM-dd')
    await db.symptoms.add({
      date,
      datetime,
      symptomIds: selectedIds,
      symptomNames: selected.map(s => s.name),
      intensity,
      duration,
      notes,
      veryBadDay,
    } as SymptomEntry)
    // Update use counts
    await Promise.all(
      selectedIds.map(id => db.symptomDefs.where('id').equals(id).modify(s => { s.useCount++ }))
    )
    setSaved(true)
  }

  if (saved) {
    return (
      <div className="page-content px-4 pt-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-[#D1FAE5] flex items-center justify-center mb-4">
          <Check size={40} className="text-[#2D6A4F]" />
        </div>
        <h2 className="text-[24px] font-bold text-[#1A1A2E] mb-2">Síntoma guardado</h2>
        <p className="text-[15px] text-[#6B7280] text-center mb-8">
          {selectedIds.length > 0
            ? `${selectedIds.length} síntoma(s) registrado(s)`
            : 'Día muy malo marcado'}
        </p>
        <div className="w-full space-y-3">
          <BigButton onClick={() => { setSaved(false); setSelectedIds([]); setIntensity(2); setNotes(''); setDuration(''); setVeryBadDay(false) }}>
            Registrar otro síntoma
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
      <h2 className="text-[22px] font-bold text-[#1A1A2E] mb-1">Registrar síntoma</h2>
      <p className="text-[14px] text-[#6B7280] mb-4">Selecciona todos los que estés notando ahora</p>

      {/* Symptom grid */}
      <div className="flex flex-wrap gap-2 mb-5">
        {symptomDefs.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggleSymptom(s.id!)}
            className={`rounded-full px-4 py-2 text-[15px] font-medium border transition-all active:scale-95 ${
              selectedIds.includes(s.id!)
                ? 'bg-[#E76F51] text-white border-transparent'
                : 'bg-white text-[#374151] border-[#E5E7EB]'
            }`}
          >
            {s.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowAddSymptom(true)}
          className="rounded-full px-4 py-2 text-[15px] font-medium border border-dashed border-[#E76F51] text-[#E76F51] bg-[#FFF5F3] flex items-center gap-1"
        >
          <Plus size={14} />Nuevo
        </button>
      </div>

      {/* Intensity */}
      <Card className="mb-4">
        <IntensitySlider value={intensity} onChange={setIntensity} />
      </Card>

      {/* Duration */}
      <Card className="mb-4">
        <label className="block text-[15px] font-semibold text-[#374151] mb-2">Duración aproximada</label>
        <div className="flex flex-wrap gap-2">
          {['Menos de 30 min', '30 min - 1 hora', '1 - 3 horas', 'Más de 3 horas', 'Todo el día'].map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`rounded-xl px-4 py-2 text-[14px] font-medium border transition-all active:scale-95 ${
                duration === d
                  ? 'bg-[#374151] text-white border-transparent'
                  : 'bg-white text-[#374151] border-[#E5E7EB]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Card>

      {/* Datetime */}
      <Card className="mb-4">
        <DateTimeInput label="Fecha y hora" value={datetime} onChange={setDatetime} />
      </Card>

      {/* Notes */}
      <TextArea label="Notas" value={notes} onChange={setNotes} placeholder="Describe cómo te sientes..." rows={3} />

      {/* Very bad day */}
      <button
        type="button"
        onClick={() => setVeryBadDay(v => !v)}
        className={`w-full flex items-center gap-3 rounded-2xl p-4 mb-5 border-2 transition-all ${
          veryBadDay
            ? 'bg-[#FEE2E2] border-[#E76F51] text-[#991B1B]'
            : 'bg-white border-[#E5E7EB] text-[#6B7280]'
        }`}
      >
        <AlertTriangle size={22} />
        <span className="text-[16px] font-semibold">Marcar como día muy malo</span>
      </button>

      <BigButton
        onClick={saveSymptom}
        disabled={selectedIds.length === 0 && !veryBadDay}
        variant={intensity >= 4 ? 'danger' : 'primary'}
      >
        Guardar síntoma
      </BigButton>

      {/* Warning note */}
      <p className="text-[12px] text-[#9CA3AF] text-center mt-3 px-4">
        Este registro no sustituye la consulta médica
      </p>

      {/* Modal: Add symptom */}
      {showAddSymptom && (
        <Modal title="Añadir síntoma" onClose={() => setShowAddSymptom(false)}>
          <TextInput
            label="Nombre del síntoma"
            value={newSymptomName}
            onChange={setNewSymptomName}
            placeholder="Ej: Ardor al tragar..."
          />
          <BigButton onClick={addNewSymptom} disabled={!newSymptomName.trim()}>
            Añadir síntoma
          </BigButton>
        </Modal>
      )}
    </div>
  )
}

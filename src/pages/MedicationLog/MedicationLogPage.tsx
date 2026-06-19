import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Check, Plus, Search, X, Edit2, Trash2 } from 'lucide-react'
import { db, getOrCreateMedCheck } from '../../db'
import { BigButton, Card, Label, Modal, TextInput } from '../../components/UI'
import type { MedicationDef, DailyMedCheck, TomaId } from '../../types/medication'

interface Props {
  onNavigate: (page: string) => void
}

const TOMAS: { id: TomaId; label: string; icon: string; hora: string }[] = [
  { id: 'manana',   label: 'Mañana',    icon: '☀️',  hora: '8:00'  },
  { id: 'mediodia', label: 'Mediodía',  icon: '🌤️', hora: '14:00' },
  { id: 'noche',    label: 'Noche',     icon: '🌙',  hora: '22:00' },
  { id: 'extra',    label: 'Si precisa',icon: '⚡',  hora: ''      },
]

const today = () => format(new Date(), 'yyyy-MM-dd')

// ─── Búsqueda CIMA via Worker proxy ──────────────────────────────────────────
interface CIMAResult {
  nombre: string
  principioActivo?: string
  dosis?: string
  forma?: string
}

async function buscarCIMA(query: string): Promise<CIMAResult[]> {
  if (query.length < 3) return []
  try {
    // Worker en /api/cima hace la llamada real a cima.aemps.es (sin CORS)
    const r = await fetch(`/api/cima?nombre=${encodeURIComponent(query)}&estado=1&pagina=1`)
    if (!r.ok) return []
    const data = await r.json()
    return (data.resultados || []).slice(0, 10).map((m: Record<string, unknown>) => ({
      nombre: m.nombre as string,
      principioActivo: (m.principioActivo as { nombre?: string }[])?.[0]?.nombre,
      dosis: m.dosis as string | undefined,
      forma: (m.formaFarmaceutica as { nombre?: string })?.nombre,
    }))
  } catch {
    return []
  }
}

// ─── Buscador ────────────────────────────────────────────────────────────────
function BuscadorCIMA({ onSelect }: { onSelect: (m: CIMAResult) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CIMAResult[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.length < 3) { setResults([]); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      const res = await buscarCIMA(query)
      setResults(res)
      setLoading(false)
    }, 400)
  }, [query])

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-xl px-3 py-2">
        <Search size={18} className="text-[#9CA3AF] flex-shrink-0" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar medicamento o principio activo..."
          className="flex-1 bg-transparent outline-none text-[16px] text-[#1A1A2E]"
          autoFocus
        />
        {loading && <span className="text-[13px] text-[#9CA3AF]">Buscando…</span>}
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]) }}>
            <X size={18} className="text-[#9CA3AF]" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-[#E5E7EB] rounded-xl mt-1 shadow-lg overflow-hidden">
          {results.map((med, i) => (
            <button key={i} type="button"
              onClick={() => { onSelect(med); setQuery(''); setResults([]) }}
              className="w-full text-left px-4 py-3 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB]">
              <p className="text-[14px] font-semibold text-[#1A1A2E] leading-tight">{med.nombre}</p>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                {[med.principioActivo, med.dosis, med.forma].filter(Boolean).join(' · ')}
              </p>
            </button>
          ))}
        </div>
      )}

      {query.length >= 3 && !loading && results.length === 0 && (
        <div className="absolute z-10 w-full bg-white border border-[#E5E7EB] rounded-xl mt-1 px-4 py-3 shadow-lg">
          <p className="text-[14px] text-[#9CA3AF]">Sin resultados. Puedes añadirlo manualmente abajo.</p>
        </div>
      )}
    </div>
  )
}

// ─── Modal añadir/editar medicamento ─────────────────────────────────────────
function ModalMedicamento({
  med, onSave, onClose
}: {
  med?: MedicationDef
  onSave: (m: Omit<MedicationDef, 'id'>) => void
  onClose: () => void
}) {
  const [nombre, setNombre] = useState(med?.name || '')
  const [principioActivo, setPrincipio] = useState(med?.principioActivo || '')
  const [dosis, setDosis] = useState(med?.dosis || '')
  const [notas, setNotas] = useState(med?.notas || '')
  const [tomas, setTomas] = useState<TomaId[]>(med?.tomas || [])

  const toggleToma = (id: TomaId) =>
    setTomas(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const handleCIMASelect = (m: CIMAResult) => {
    setNombre(m.nombre)
    if (m.principioActivo) setPrincipio(m.principioActivo)
    if (m.dosis) setDosis(m.dosis)
  }

  const canSave = nombre.trim() && tomas.length > 0

  return (
    <Modal title={med ? 'Editar medicamento' : 'Añadir medicamento'} onClose={onClose}>
      <div className="space-y-4">
        {/* Búsqueda CIMA solo en modo añadir */}
        {!med && (
          <div>
            <Label>Buscar en vademécum AEMPS</Label>
            <p className="text-[12px] text-[#9CA3AF] mb-2">+15.000 medicamentos autorizados en España</p>
            <BuscadorCIMA onSelect={handleCIMASelect} />
          </div>
        )}

        <TextInput label="Nombre del medicamento *" value={nombre} onChange={setNombre}
          placeholder="Ej: Metformina CINFA 850 mg" />

        <TextInput label="Principio activo" value={principioActivo} onChange={setPrincipio}
          placeholder="Ej: Metformina" />

        <TextInput label="Dosis / Presentación" value={dosis} onChange={setDosis}
          placeholder="Ej: 1 comprimido, 850 mg" />

        <div>
          <Label>¿En qué toma(s)? <span className="text-[#E76F51]">*</span></Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {TOMAS.map(t => (
              <button key={t.id} type="button" onClick={() => toggleToma(t.id)}
                className={`flex items-center gap-2 rounded-xl p-3 border-2 text-left transition-all ${
                  tomas.includes(t.id)
                    ? 'bg-[#2D6A4F] text-white border-transparent'
                    : 'bg-white text-[#374151] border-[#E5E7EB]'
                }`}>
                <span className="text-xl">{t.icon}</span>
                <div>
                  <p className="text-[15px] font-semibold">{t.label}</p>
                  {t.hora && <p className={`text-[11px] ${tomas.includes(t.id) ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{t.hora}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <TextInput label="Notas (opcional)" value={notas} onChange={setNotas}
          placeholder="Ej: Con comida, en ayunas..." />

        <BigButton onClick={() => canSave && onSave({
          name: nombre.trim(), principioActivo, dosis, notas,
          tomas, hidden: false, useCount: med?.useCount || 0
        })} disabled={!canSave}>
          {med ? 'Guardar cambios' : 'Añadir medicamento'}
        </BigButton>
      </div>
    </Modal>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MedicationLogPage({ onNavigate }: Props) {
  const [view, setView] = useState<'pauta' | 'config'>('pauta')
  const [meds, setMeds] = useState<MedicationDef[]>([])
  const [check, setCheck] = useState<DailyMedCheck>({ date: today(), checks: {} })
  const [modal, setModal] = useState<'nuevo' | MedicationDef | null>(null)
  const [confirmDel, setConfirmDel] = useState<number | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [allDefs, ch] = await Promise.all([
      db.medicationDefs.toArray(),
      getOrCreateMedCheck(today()),
    ])
    setMeds(allDefs.filter(m => !m.hidden))
    setCheck(ch)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 1500) }

  // ── Pauta: marcar/desmarcar ────────────────────────────────────────────────
  async function toggleCheck(medId: number, tomaId: TomaId) {
    const key = `${medId}_${tomaId}`
    const nuevo = { ...check.checks, [key]: !check.checks[key] }
    const updated = { ...check, checks: nuevo }
    setCheck(updated)
    // Siempre pasar id para que Dexie actualice en lugar de insertar
    if (updated.id) {
      await db.medChecks.update(updated.id, { checks: nuevo })
    } else {
      const id = await db.medChecks.put(updated)
      setCheck({ ...updated, id })
    }

    // También registra en medications para el historial
    if (!check.checks[key]) {
      const med = meds.find(m => m.id === medId)
      if (med) {
        await db.medications.add({
          date: today(), datetime: Date.now(),
          medicationId: medId, medicationName: med.name,
          tomaId, dose: med.dosis,
        })
      }
      showToast('✓ Tomada')
    }
  }

  // ── Config: guardar nuevo / editar ────────────────────────────────────────
  async function guardarMed(data: Omit<MedicationDef, 'id'>) {
    if (modal && modal !== 'nuevo') {
      // editar
      await db.medicationDefs.put({ ...modal, ...data })
    } else {
      await db.medicationDefs.add(data as MedicationDef)
    }
    setModal(null)
    await loadData()
    showToast('Medicamento guardado ✓')
  }

  async function eliminarMed(id: number) {
    await db.medicationDefs.delete(id)
    setConfirmDel(null)
    await loadData()
  }

  // ── Cálculo progreso ──────────────────────────────────────────────────────
  const tomasConMeds = TOMAS.map(t => ({
    ...t, meds: meds.filter(m => m.tomas?.includes(t.id))
  })).filter(t => t.meds.length > 0)

  const total = tomasConMeds.reduce((a, t) => a + t.meds.length, 0)
  const tomadas = tomasConMeds.reduce((a, t) =>
    a + t.meds.filter(m => check.checks[`${m.id}_${t.id}`]).length, 0)
  const pct = total > 0 ? Math.round((tomadas / total) * 100) : 0

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-content px-4 pt-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#2D6A4F] text-white rounded-xl px-5 py-3 text-[15px] font-semibold z-50 shadow-lg">
          {toast}
        </div>
      )}

      {/* Modales */}
      {modal && (
        <ModalMedicamento
          med={modal === 'nuevo' ? undefined : modal}
          onSave={guardarMed}
          onClose={() => setModal(null)}
        />
      )}

      {confirmDel !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <p className="text-[17px] font-bold text-[#1A1A2E] mb-2">¿Eliminar medicamento?</p>
            <p className="text-[14px] text-[#6B7280] mb-5">Se borrará de tu pauta. Los registros pasados no cambian.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmDel(null)}
                className="flex-1 rounded-xl py-3 text-[15px] font-semibold bg-[#F3F4F6] text-[#374151]">
                Cancelar
              </button>
              <button type="button" onClick={() => eliminarMed(confirmDel)}
                className="flex-1 rounded-xl py-3 text-[15px] font-semibold bg-[#E76F51] text-white">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-[#F3F4F6] rounded-xl p-1">
        {(['pauta', 'config'] as const).map(v => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-2 text-[15px] font-semibold transition-all ${
              view === v ? 'bg-white text-[#2D6A4F] shadow-sm' : 'text-[#6B7280]'
            }`}>
            {v === 'pauta' ? '💊 Mi pauta' : '⚙️ Gestionar'}
          </button>
        ))}
      </div>

      {/* ── Vista: Pauta diaria ─────────────────────────────────────────── */}
      {view === 'pauta' && (
        <>
          {meds.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-[40px] mb-3">💊</p>
              <p className="text-[17px] font-bold text-[#1A1A2E] mb-2">Sin medicamentos configurados</p>
              <p className="text-[14px] text-[#9CA3AF] mb-5">Añade tus medicamentos habituales para ver aquí tu pauta diaria</p>
              <BigButton onClick={() => setView('config')}>Configurar mis medicamentos</BigButton>
            </Card>
          ) : (
            <>
              {/* Barra de progreso */}
              <Card className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[15px] font-semibold text-[#1A1A2E]">
                    {tomadas}/{total} tomas completadas hoy
                  </p>
                  <span className={`text-[15px] font-bold ${pct === 100 ? 'text-[#2D6A4F]' : 'text-[#374151]'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      background: pct === 100 ? '#2D6A4F' : '#E9C46A'
                    }}
                  />
                </div>
                {pct === 100 && (
                  <div className="mt-3">
                    <p className="text-[13px] text-[#2D6A4F] font-semibold text-center mb-2">
                      ✓ Toda la medicación tomada hoy 🎉
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('today')}
                      className="w-full text-center text-[14px] text-[#2D6A4F] font-semibold py-2"
                    >
                      Volver al inicio →
                    </button>
                  </div>
                )}
              </Card>

              {/* Secciones por toma */}
              {tomasConMeds.map(toma => {
                const todasOk = toma.meds.every(m => check.checks[`${m.id}_${toma.id}`])
                return (
                  <div key={toma.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[22px]">{toma.icon}</span>
                      <h3 className="text-[17px] font-bold text-[#1A1A2E]">{toma.label}</h3>
                      {toma.hora && <span className="text-[13px] text-[#9CA3AF]">{toma.hora}</span>}
                      {todasOk && (
                        <span className="ml-auto text-[13px] text-[#2D6A4F] font-semibold">
                          <Check size={14} className="inline mr-1" />Completo
                        </span>
                      )}
                    </div>

                    {toma.meds.map(med => {
                      const key = `${med.id}_${toma.id}`
                      const tomada = !!check.checks[key]
                      return (
                        <button key={med.id!} type="button"
                          onClick={() => toggleCheck(med.id!, toma.id)}
                          className={`w-full flex items-center gap-4 rounded-2xl p-4 mb-2 border-2 transition-all active:scale-[0.98] text-left ${
                            tomada
                              ? 'bg-[#D8F3DC] border-[#2D6A4F]'
                              : 'bg-white border-[#E5E7EB]'
                          }`}>
                          {/* Checkbox grande */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                            tomada
                              ? 'bg-[#2D6A4F] border-[#2D6A4F]'
                              : 'bg-[#F3F4F6] border-[#E5E7EB]'
                          }`}>
                            {tomada && <Check size={20} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[15px] font-bold leading-tight ${
                              tomada ? 'text-[#2D6A4F] line-through decoration-[#2D6A4F]/50' : 'text-[#1A1A2E]'
                            }`}>
                              {med.name.length > 42 ? med.name.slice(0, 42) + '…' : med.name}
                            </p>
                            {med.principioActivo && (
                              <p className="text-[12px] text-[#9CA3AF] mt-0.5">{med.principioActivo}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {med.dosis && (
                                <span className="text-[12px] text-[#6B7280] bg-[#F3F4F6] rounded-full px-2 py-0.5">{med.dosis}</span>
                              )}
                              {med.notas && (
                                <span className="text-[12px] text-[#6B7280] italic">{med.notas}</span>
                              )}
                            </div>
                          </div>
                          <span className={`text-[13px] font-semibold flex-shrink-0 ${tomada ? 'text-[#2D6A4F]' : 'text-[#9CA3AF]'}`}>
                            {tomada ? 'Tomada' : 'Pendiente'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </>
      )}

      {/* ── Vista: Configurar ───────────────────────────────────────────── */}
      {view === 'config' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] text-[#9CA3AF]">
              Búsqueda con datos del vademécum oficial AEMPS
            </p>
            <button type="button" onClick={() => setModal('nuevo')}
              className="flex items-center gap-1 bg-[#2D6A4F] text-white rounded-xl px-4 py-2 text-[14px] font-semibold">
              <Plus size={16} /> Añadir
            </button>
          </div>

          {meds.length === 0 && (
            <Card className="text-center py-6">
              <p className="text-[14px] text-[#9CA3AF]">Pulsa "Añadir" para configurar tus medicamentos habituales</p>
            </Card>
          )}

          {TOMAS.map(toma => {
            const medsEnToma = meds.filter(m => m.tomas?.includes(toma.id))
            if (medsEnToma.length === 0) return null
            return (
              <div key={toma.id} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[18px]">{toma.icon}</span>
                  <h3 className="text-[15px] font-bold text-[#374151]">{toma.label}</h3>
                  {toma.hora && <span className="text-[13px] text-[#9CA3AF]">{toma.hora}</span>}
                </div>
                {medsEnToma.map(med => (
                  <Card key={med.id} className="mb-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[#1A1A2E] leading-tight">
                          {med.name.length > 48 ? med.name.slice(0, 48) + '…' : med.name}
                        </p>
                        {med.principioActivo && (
                          <p className="text-[12px] text-[#9CA3AF] mt-0.5">{med.principioActivo}</p>
                        )}
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {med.dosis && <span className="text-[11px] bg-[#F3F4F6] text-[#6B7280] rounded-full px-2 py-0.5">{med.dosis}</span>}
                          {med.notas && <span className="text-[11px] text-[#9CA3AF] italic">{med.notas}</span>}
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {med.tomas?.map(t => {
                            const tObj = TOMAS.find(x => x.id === t)
                            return (
                              <span key={t} className="text-[11px] bg-[#D8F3DC] text-[#2D6A4F] rounded-full px-2 py-0.5 font-medium">
                                {tObj?.icon} {tObj?.label}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button type="button" onClick={() => setModal(med)}
                          className="w-9 h-9 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
                          <Edit2 size={15} className="text-[#374151]" />
                        </button>
                        <button type="button" onClick={() => setConfirmDel(med.id!)}
                          className="w-9 h-9 bg-[#FEE9E3] rounded-lg flex items-center justify-center">
                          <Trash2 size={15} className="text-[#E76F51]" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

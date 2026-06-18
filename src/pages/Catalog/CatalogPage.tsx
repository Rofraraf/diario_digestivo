import { useState, useEffect } from 'react'
import { Star, EyeOff, Trash2, Edit2, Check } from 'lucide-react'
import { db } from '../../db'
import { Card, ConfirmModal } from '../../components/UI'
import type { FoodItem, Condiment, SymptomDef, MedicationDef } from '../../types'

type CatalogTab = 'alimentos' | 'condimentos' | 'sintomas' | 'medicacion'

export default function CatalogPage() {
  const [tab, setTab] = useState<CatalogTab>('alimentos')
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [condiments, setCondiments] = useState<Condiment[]>([])
  const [symptoms, setSymptoms] = useState<SymptomDef[]>([])
  const [medications, setMedications] = useState<MedicationDef[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [showHidden, setShowHidden] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [f, c, s, m] = await Promise.all([
      db.foods.orderBy('useCount').reverse().toArray(),
      db.condiments.orderBy('useCount').reverse().toArray(),
      db.symptomDefs.orderBy('useCount').reverse().toArray(),
      db.medicationDefs.orderBy('useCount').reverse().toArray(),
    ])
    setFoods(f)
    setCondiments(c)
    setSymptoms(s)
    setMedications(m)
  }

  function getTable() {
    switch (tab) {
      case 'alimentos': return db.foods
      case 'condimentos': return db.condiments
      case 'sintomas': return db.symptomDefs
      case 'medicacion': return db.medicationDefs
    }
  }

  function getItems() {
    let items: (FoodItem | Condiment | SymptomDef | MedicationDef)[]
    switch (tab) {
      case 'alimentos': items = foods; break
      case 'condimentos': items = condiments; break
      case 'sintomas': items = symptoms; break
      case 'medicacion': items = medications; break
    }
    if (!showHidden) items = items.filter(i => !i.hidden)
    return items
  }

  async function toggleFavorite(id: number, current: boolean) {
    const t = getTable() as typeof db.foods
    await t.update(id, { favorite: !current } as Partial<FoodItem>)
    loadAll()
  }

  async function toggleHidden(id: number, current: boolean) {
    const t = getTable() as typeof db.foods
    await (t as unknown as typeof db.foods).update(id, { hidden: !current } as Partial<FoodItem>)
    loadAll()
  }

  async function saveEdit(id: number) {
    const t = getTable() as typeof db.foods
    await (t as unknown as typeof db.foods).update(id, { name: editingName } as Partial<FoodItem>)
    setEditingId(null)
    loadAll()
  }

  async function deleteItem(id: number) {
    const t = getTable() as typeof db.foods
    await (t as unknown as typeof db.foods).delete(id)
    setDeleteTarget(null)
    loadAll()
  }

  const tabs: { id: CatalogTab; label: string }[] = [
    { id: 'alimentos', label: 'Alimentos' },
    { id: 'condimentos', label: 'Condimentos' },
    { id: 'sintomas', label: 'Síntomas' },
    { id: 'medicacion', label: 'Medicación' },
  ]

  const items = getItems()
  const hasFavorites = 'favorite' in (items[0] || {})

  return (
    <div className="page-content px-4 pt-4">
      <h2 className="text-[22px] font-bold text-[#1A1A2E] mb-4">Catálogo</h2>

      {/* Tab selector */}
      <div className="flex gap-1 mb-4 bg-[#F3F4F6] rounded-2xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition-all ${
              tab === t.id ? 'bg-white text-[#1A1A2E] shadow-sm' : 'text-[#6B7280]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Show hidden toggle */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] text-[#6B7280]">{items.length} elementos</span>
        <button
          type="button"
          onClick={() => setShowHidden(v => !v)}
          className={`text-[13px] font-medium px-3 py-1 rounded-full border transition-all ${
            showHidden ? 'bg-[#374151] text-white border-transparent' : 'bg-white text-[#374151] border-[#E5E7EB]'
          }`}
        >
          {showHidden ? 'Ocultar archivados' : 'Ver archivados'}
        </button>
      </div>

      {/* Items list */}
      <Card className="divide-y divide-[#F3F4F6]">
        {items.length === 0 && (
          <p className="text-[#9CA3AF] text-center py-4 text-[15px]">No hay elementos</p>
        )}
        {items.map(item => (
          <div key={item.id} className={`flex items-center gap-3 py-3 ${item.hidden ? 'opacity-50' : ''}`}>
            {editingId === item.id ? (
              <>
                <input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="flex-1 border border-[#2D6A4F] rounded-lg px-3 py-1.5 text-[15px] focus:outline-none"
                  autoFocus
                />
                <button type="button" onClick={() => saveEdit(item.id!)} className="text-[#2D6A4F] p-1"><Check size={18} /></button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-[15px] font-medium text-[#1A1A2E]">{item.name}</span>
                  <span className="text-[12px] text-[#9CA3AF] ml-2">({item.useCount}x)</span>
                  {'category' in item && (
                    <p className="text-[12px] text-[#9CA3AF]">{(item as FoodItem).category}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {hasFavorites && (
                    <button
                      type="button"
                      onClick={() => toggleFavorite(item.id!, (item as FoodItem).favorite)}
                      className="p-2"
                    >
                      <Star
                        size={16}
                        className={(item as FoodItem).favorite ? 'text-[#E9C46A]' : 'text-[#D1D5DB]'}
                        fill={(item as FoodItem).favorite ? '#E9C46A' : 'none'}
                      />
                    </button>
                  )}
                  <button type="button" onClick={() => { setEditingId(item.id!); setEditingName(item.name) }} className="p-2 text-[#6B7280]">
                    <Edit2 size={16} />
                  </button>
                  <button type="button" onClick={() => toggleHidden(item.id!, item.hidden)} className="p-2 text-[#6B7280]">
                    <EyeOff size={16} className={item.hidden ? 'text-[#2D6A4F]' : ''} />
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(item.id!)} className="p-2 text-[#E76F51]">
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </Card>

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar elemento"
          message="¿Eliminar este elemento del catálogo? Los registros existentes no se verán afectados."
          onConfirm={() => deleteItem(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  )
}

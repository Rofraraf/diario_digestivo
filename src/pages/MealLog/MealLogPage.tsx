import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Star, Check, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { db } from '../../db'
import { BigButton, Card, Label, Modal, TextArea, TextInput, SelectRow, ToggleChip } from '../../components/UI'
import type { FoodItem, MealType, MealItem, MealEntry, Condiment } from '../../types'
import { FOOD_CATEGORIES, MEAL_TYPE_LABELS } from '../../constants/catalogs'

interface MealLogPageProps {
  onNavigate: (page: string) => void
  params?: Record<string, unknown>
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'desayuno', label: 'Desayuno' },
  { value: 'media_manana', label: 'Media mañana' },
  { value: 'almuerzo', label: 'Almuerzo' },
  { value: 'merienda', label: 'Merienda' },
  { value: 'cena', label: 'Cena' },
  { value: 'picoteo', label: 'Picoteo / Otro' },
]

// Guess meal type by hour
function guessMealType(): MealType {
  const h = new Date().getHours()
  if (h < 10) return 'desayuno'
  if (h < 12) return 'media_manana'
  if (h < 16) return 'almuerzo'
  if (h < 19) return 'merienda'
  if (h < 23) return 'cena'
  return 'picoteo'
}

export default function MealLogPage({ onNavigate, params }: MealLogPageProps) {
  const [step, setStep] = useState<'type' | 'foods' | 'condiments' | 'done'>('type')
  const [mealType, setMealType] = useState<MealType>(guessMealType())
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [condiments, setCondiments] = useState<Condiment[]>([])
  const [selectedItems, setSelectedItems] = useState<MealItem[]>([])
  const [selectedCondimentIds, setSelectedCondimentIds] = useState<number[]>([])
  const [activeCategory, setActiveCategory] = useState(FOOD_CATEGORIES[0])
  const [mealNotes, setMealNotes] = useState('')
  const [showAddFood, setShowAddFood] = useState(false)
  const [showAddCondiment, setShowAddCondiment] = useState(false)
  const [editingItem, setEditingItem] = useState<MealItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [newFoodName, setNewFoodName] = useState('')
  const [newFoodCategory, setNewFoodCategory] = useState(FOOD_CATEGORIES[0])
  const [newCondimentName, setNewCondimentName] = useState('')

  useEffect(() => {
    loadCatalog()
    if (params?.repeatFrom) {
      loadRepeat(params.repeatFrom as number)
    }
  }, [])

  async function loadCatalog() {
    const [f, c] = await Promise.all([
      db.foods.where('hidden').equals(0).sortBy('useCount'),
      db.condiments.where('hidden').equals(0).sortBy('useCount'),
    ])
    // Sort: favorites first, then by useCount desc
    const sortedFoods = [...f].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1
      if (!a.favorite && b.favorite) return 1
      return b.useCount - a.useCount
    })
    const sortedCondiments = [...c].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1
      if (!a.favorite && b.favorite) return 1
      return b.useCount - a.useCount
    })
    setFoods(sortedFoods)
    setCondiments(sortedCondiments)
  }

  async function loadRepeat(id: number) {
    const meal = await db.meals.get(id)
    if (meal) {
      setMealType(meal.type)
      setSelectedItems(meal.items)
      setSelectedCondimentIds(meal.condimentIds || [])
      setStep('foods')
    }
  }

  const categoryFoods = foods.filter(f => f.category === activeCategory)

  function toggleFood(food: FoodItem) {
    const existing = selectedItems.find(i => i.foodId === food.id)
    if (existing) {
      setEditingItem(existing)
    } else {
      const newItem: MealItem = {
        foodId: food.id!,
        foodName: food.name,
        quantity: 'normal',
        preparation: 'otro',
      }
      setSelectedItems(prev => [...prev, newItem])
    }
  }

  function removeItem(foodId: number) {
    setSelectedItems(prev => prev.filter(i => i.foodId !== foodId))
  }

  function updateItem(updated: MealItem) {
    setSelectedItems(prev => prev.map(i => i.foodId === updated.foodId ? updated : i))
    setEditingItem(null)
  }

  async function toggleFavorite(food: FoodItem) {
    await db.foods.update(food.id!, { favorite: !food.favorite })
    setFoods(prev => prev.map(f => f.id === food.id ? { ...f, favorite: !f.favorite } : f))
  }

  async function addNewFood() {
    if (!newFoodName.trim()) return
    const id = await db.foods.add({
      name: newFoodName.trim(),
      category: newFoodCategory,
      favorite: false,
      hidden: false,
      useCount: 0,
    } as FoodItem)
    const newFood: FoodItem = { id, name: newFoodName.trim(), category: newFoodCategory, favorite: false, hidden: false, useCount: 0 }
    setFoods(prev => [...prev, newFood])
    setActiveCategory(newFoodCategory)
    toggleFood(newFood)
    setNewFoodName('')
    setShowAddFood(false)
  }

  async function addNewCondiment() {
    if (!newCondimentName.trim()) return
    const id = await db.condiments.add({
      name: newCondimentName.trim(),
      favorite: false,
      hidden: false,
      useCount: 0,
    } as Condiment)
    const newCondiment: Condiment = { id, name: newCondimentName.trim(), favorite: false, hidden: false, useCount: 0 }
    setCondiments(prev => [...prev, newCondiment])
    setSelectedCondimentIds(prev => [...prev, id])
    setNewCondimentName('')
    setShowAddCondiment(false)
  }

  async function saveMeal() {
    if (selectedItems.length === 0) return
    setSaving(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    const selectedCondiments = condiments.filter(c => selectedCondimentIds.includes(c.id!))
    await db.meals.add({
      date: today,
      type: mealType,
      items: selectedItems,
      condimentIds: selectedCondimentIds,
      condimentNames: selectedCondiments.map(c => c.name),
      notes: mealNotes,
      createdAt: Date.now(),
    } as MealEntry)
    // Update use counts
    await Promise.all([
      ...selectedItems.map(item => db.foods.where('id').equals(item.foodId).modify(f => { f.useCount++ })),
      ...selectedCondimentIds.map(id => db.condiments.where('id').equals(id).modify(c => { c.useCount++ }))
    ])
    setSaving(false)
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="page-content px-4 pt-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-[#D1FAE5] flex items-center justify-center mb-4">
          <Check size={40} className="text-[#2D6A4F]" />
        </div>
        <h2 className="text-[24px] font-bold text-[#1A1A2E] mb-2">Comida guardada</h2>
        <p className="text-[16px] text-[#6B7280] text-center mb-8">
          {MEAL_TYPE_LABELS[mealType]} registrada con {selectedItems.length} alimentos
        </p>
        <div className="w-full space-y-3">
          <BigButton onClick={() => { setStep('type'); setSelectedItems([]); setSelectedCondimentIds([]); setMealNotes('') }}>
            Registrar otra comida
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
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        {step !== 'type' && (
          <button type="button" onClick={() => setStep(step === 'foods' ? 'type' : 'foods')} className="p-1">
            <ChevronLeft size={24} className="text-[#2D6A4F]" />
          </button>
        )}
        <div className="flex gap-2 flex-1">
          {(['type', 'foods', 'condiments'] as const).map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                s === step ? 'bg-[#2D6A4F]' :
                (['type', 'foods', 'condiments'].indexOf(step) > i) ? 'bg-[#52B788]' : 'bg-[#E5E7EB]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: Meal type */}
      {step === 'type' && (
        <>
          <h2 className="text-[22px] font-bold text-[#1A1A2E] mb-4">¿Qué comida es?</h2>
          <div className="space-y-2">
            {MEAL_TYPES.map(mt => (
              <button
                key={mt.value}
                type="button"
                onClick={() => { setMealType(mt.value); setStep('foods') }}
                className={`w-full flex items-center justify-between rounded-2xl px-5 py-4 text-[18px] font-semibold border-2 transition-all active:scale-95 ${
                  mealType === mt.value
                    ? 'bg-[#2D6A4F] text-white border-transparent'
                    : 'bg-white text-[#1A1A2E] border-[#E5E7EB]'
                }`}
              >
                {mt.label}
                <ChevronRight size={20} />
              </button>
            ))}
          </div>
        </>
      )}

      {/* STEP 2: Foods */}
      {step === 'foods' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[22px] font-bold text-[#1A1A2E]">Alimentos</h2>
            <span className="text-[14px] text-[#6B7280]">{selectedItems.length} seleccionados</span>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-4 px-4">
            {FOOD_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-[14px] font-medium border transition-all ${
                  activeCategory === cat
                    ? 'bg-[#2D6A4F] text-white border-transparent'
                    : 'bg-white text-[#374151] border-[#E5E7EB]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Food grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {categoryFoods.map(food => {
              const isSelected = selectedItems.some(i => i.foodId === food.id)
              return (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => toggleFood(food)}
                  onContextMenu={(e) => { e.preventDefault(); toggleFavorite(food) }}
                  className={`relative rounded-xl p-3 text-left border-2 transition-all active:scale-95 min-h-[64px] ${
                    isSelected
                      ? 'bg-[#2D6A4F] text-white border-transparent'
                      : 'bg-white text-[#374151] border-[#E5E7EB]'
                  }`}
                >
                  {food.favorite && (
                    <Star size={12} className="absolute top-2 right-2" fill="currentColor"
                      style={{ color: isSelected ? '#FFF' : '#E9C46A' }} />
                  )}
                  <span className="text-[14px] font-medium leading-tight">{food.name}</span>
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setShowAddFood(true)}
              className="rounded-xl p-3 border-2 border-dashed border-[#D1FAE5] bg-[#F0FDF4] text-[#2D6A4F] flex items-center justify-center gap-1 min-h-[64px] text-[14px] font-medium"
            >
              <Plus size={16} />
              Nuevo
            </button>
          </div>

          {/* Selected items summary */}
          {selectedItems.length > 0 && (
            <Card className="mb-4">
              <Label>Alimentos añadidos</Label>
              <div className="space-y-2">
                {selectedItems.map(item => (
                  <div key={item.foodId} className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="flex-1 text-left"
                    >
                      <span className="text-[15px] font-medium text-[#1A1A2E]">{item.foodName}</span>
                      <span className="text-[13px] text-[#6B7280] ml-2">{item.quantity} · {item.preparation}</span>
                    </button>
                    <button type="button" onClick={() => removeItem(item.foodId)} className="p-2 text-[#E76F51]">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <TextArea label="Notas" value={mealNotes} onChange={setMealNotes} placeholder="Observaciones..." rows={2} />

          <BigButton
            onClick={() => setStep('condiments')}
            disabled={selectedItems.length === 0}
          >
            Continuar → Condimentos
          </BigButton>
        </>
      )}

      {/* STEP 3: Condiments */}
      {step === 'condiments' && (
        <>
          <h2 className="text-[22px] font-bold text-[#1A1A2E] mb-2">¿Llevaba condimentos o salsas?</h2>
          <p className="text-[15px] text-[#6B7280] mb-4">Selecciona todos los que apliquen</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {condiments.map(c => (
              <ToggleChip
                key={c.id}
                label={c.name}
                selected={selectedCondimentIds.includes(c.id!)}
                onToggle={() => {
                  setSelectedCondimentIds(prev =>
                    prev.includes(c.id!) ? prev.filter(id => id !== c.id) : [...prev, c.id!]
                  )
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => setShowAddCondiment(true)}
              className="rounded-full px-4 py-2 text-[15px] font-medium border border-dashed border-[#2D6A4F] text-[#2D6A4F] bg-[#F0FDF4] flex items-center gap-1"
            >
              <Plus size={14} />Nuevo
            </button>
          </div>

          <div className="space-y-3">
            <BigButton onClick={saveMeal} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar comida'}
            </BigButton>
            <BigButton variant="ghost" onClick={() => setSelectedCondimentIds([])}>
              Sin condimentos
            </BigButton>
          </div>
        </>
      )}

      {/* Modal: Edit food item */}
      {editingItem && (
        <Modal title={editingItem.foodName} onClose={() => setEditingItem(null)}>
          <EditItemModal
            item={editingItem}
            onSave={updateItem}
            onClose={() => setEditingItem(null)}
          />
        </Modal>
      )}

      {/* Modal: Add new food */}
      {showAddFood && (
        <Modal title="Añadir nuevo alimento" onClose={() => setShowAddFood(false)}>
          <TextInput
            label="Nombre del alimento"
            value={newFoodName}
            onChange={setNewFoodName}
            placeholder="Ej: Quinoa, Kéfir..."
          />
          <SelectRow
            label="Categoría"
            options={FOOD_CATEGORIES.map(c => ({ value: c, label: c }))}
            value={newFoodCategory}
            onChange={setNewFoodCategory}
          />
          <BigButton onClick={addNewFood} disabled={!newFoodName.trim()}>
            Añadir alimento
          </BigButton>
        </Modal>
      )}

      {/* Modal: Add new condiment */}
      {showAddCondiment && (
        <Modal title="Añadir nuevo condimento" onClose={() => setShowAddCondiment(false)}>
          <TextInput
            label="Nombre del condimento"
            value={newCondimentName}
            onChange={setNewCondimentName}
            placeholder="Ej: Curry, Hierbas provenzales..."
          />
          <BigButton onClick={addNewCondiment} disabled={!newCondimentName.trim()}>
            Añadir condimento
          </BigButton>
        </Modal>
      )}
    </div>
  )
}

// ─── Edit item details modal ──────────────────────────────────────────────────
function EditItemModal({ item, onSave, onClose }: {
  item: MealItem
  onSave: (item: MealItem) => void
  onClose: () => void
}) {
  const [quantity, setQuantity] = useState<MealItem['quantity']>(item.quantity)
  const [preparation, setPreparation] = useState<MealItem['preparation']>(item.preparation)
  const [notes, setNotes] = useState(item.notes || '')
  return (
    <>
      <SelectRow
        label="Cantidad"
        options={[
          { value: 'poco', label: 'Poco' },
          { value: 'normal', label: 'Normal' },
          { value: 'mucho', label: 'Mucho' },
        ]}
        value={quantity}
        onChange={v => setQuantity(v as MealItem['quantity'])}
      />
      <SelectRow
        label="Preparación"
        options={[
          { value: 'crudo', label: 'Crudo' },
          { value: 'hervido', label: 'Hervido' },
          { value: 'guisado', label: 'Guisado' },
          { value: 'frito', label: 'Frito' },
          { value: 'plancha', label: 'Plancha' },
          { value: 'horno', label: 'Horno' },
          { value: 'otro', label: 'Otro' },
        ]}
        value={preparation}
        onChange={v => setPreparation(v as MealItem['preparation'])}
      />
      <TextArea label="Notas" value={notes} onChange={setNotes} placeholder="Opcional..." rows={2} />
      <div className="flex gap-3 mt-2">
        <BigButton variant="ghost" onClick={onClose}>Cancelar</BigButton>
        <BigButton onClick={() => onSave({ ...item, quantity, preparation, notes })}>Guardar</BigButton>
      </div>
    </>
  )
}

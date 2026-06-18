// ─── Catalog types ───────────────────────────────────────────────────────────
export interface FoodItem {
  id?: number
  name: string
  category: string
  favorite: boolean
  hidden: boolean
  useCount: number
}

export interface Condiment {
  id?: number
  name: string
  favorite: boolean
  hidden: boolean
  useCount: number
}

export interface SymptomDef {
  id?: number
  name: string
  hidden: boolean
  useCount: number
}

export interface MedicationDef {
  id?: number
  name: string
  hidden: boolean
  useCount: number
}

// ─── Log entry types ──────────────────────────────────────────────────────────
export interface MealItem {
  foodId: number
  foodName: string
  quantity: 'poco' | 'normal' | 'mucho'
  preparation: 'crudo' | 'hervido' | 'guisado' | 'frito' | 'plancha' | 'horno' | 'otro'
  notes?: string
}

export interface MealEntry {
  id?: number
  date: string          // YYYY-MM-DD
  type: MealType
  items: MealItem[]
  condimentIds: number[]
  condimentNames: string[]
  notes?: string
  createdAt: number     // timestamp
}

export type MealType = 'desayuno' | 'media_manana' | 'almuerzo' | 'merienda' | 'cena' | 'picoteo'

export interface SymptomEntry {
  id?: number
  date: string
  datetime: number      // timestamp
  symptomIds: number[]
  symptomNames: string[]
  intensity: number     // 0-5
  duration?: string
  notes?: string
  veryBadDay?: boolean
}

export interface BathroomEntry {
  id?: number
  date: string
  datetime: number
  went: boolean
  bristolType?: 1 | 2 | 3 | 4 | 5 | 6 | 7
  effort?: 'ninguno' | 'poco' | 'bastante' | 'mucho'
  incomplete?: boolean
  gasBefore?: boolean
  gasAfter?: boolean
  painBefore?: boolean
  painAfter?: boolean
  notes?: string
}

export interface MedicationEntry {
  id?: number
  date: string
  datetime: number
  medicationId: number
  medicationName: string
  dose?: string
  withFood?: boolean
  improvement?: 'no_valorada' | 'si' | 'parcial' | 'no'
  notes?: string
}

export interface DailyFactors {
  id?: number
  date: string          // unique
  stress?: 'bajo' | 'medio' | 'alto'
  sleep?: 'bien' | 'regular' | 'mal'
  water?: 'poca' | 'normal' | 'mucha'
  activity?: 'nada' | 'paseo' | 'normal' | 'alta'
  ateQuick?: boolean
  ateOut?: boolean
  notes?: string
}

// ─── Day summary ──────────────────────────────────────────────────────────────
export type DayColor = 'green' | 'yellow' | 'red' | 'gray'

export interface DaySummary {
  date: string
  color: DayColor
  meals: MealEntry[]
  symptoms: SymptomEntry[]
  bathroom: BathroomEntry[]
  medications: MedicationEntry[]
  factors?: DailyFactors
}

// ─── Export ───────────────────────────────────────────────────────────────────
export interface ExportOptions {
  alias: string
  startDate: string
  endDate: string
  includeMeals: boolean
  includeSymptoms: boolean
  includeBathroom: boolean
  includeMedication: boolean
  includeFactors: boolean
  includePatterns: boolean
}

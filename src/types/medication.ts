// Tomas del día
export type TomaId = 'manana' | 'mediodia' | 'noche' | 'extra'

export interface MedicationDef {
  id?: number
  name: string           // nombre completo CIMA o manual
  principioActivo?: string
  dosis?: string         // "850 mg", "1 comprimido"
  tomas: TomaId[]        // en qué tomas se toma
  notas?: string         // "con comida", "en ayunas"
  hidden: boolean
  useCount: number
}

export interface MedicationEntry {
  id?: number
  date: string           // YYYY-MM-DD
  datetime: number
  medicationId: number
  medicationName: string
  tomaId: TomaId
  dose?: string
  withFood?: boolean
  improvement?: 'no_valorada' | 'si' | 'parcial' | 'no'
  notes?: string
}

// Checklist diario: qué tomas han sido marcadas como tomadas
// Se guarda en una tabla separada, una fila por fecha
export interface DailyMedCheck {
  id?: number
  date: string           // YYYY-MM-DD
  checks: Record<string, boolean>  // key: `${medId}_${tomaId}`
}

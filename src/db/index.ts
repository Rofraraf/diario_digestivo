import Dexie, { type Table } from 'dexie'
import type {
  FoodItem, Condiment, SymptomDef,
  MealEntry, SymptomEntry, BathroomEntry, DailyFactors
} from '../types'
import type { MedicationDef, MedicationEntry, DailyMedCheck } from '../types/medication'
import {
  INITIAL_FOODS, INITIAL_CONDIMENTS, INITIAL_SYMPTOMS, INITIAL_MEDICATIONS
} from '../constants/catalogs'

export class DiarioDigestivoDB extends Dexie {
  foods!: Table<FoodItem, number>
  condiments!: Table<Condiment, number>
  symptomDefs!: Table<SymptomDef, number>
  medicationDefs!: Table<MedicationDef, number>
  meals!: Table<MealEntry, number>
  symptoms!: Table<SymptomEntry, number>
  bathroom!: Table<BathroomEntry, number>
  medications!: Table<MedicationEntry, number>
  dailyFactors!: Table<DailyFactors, number>
  medChecks!: Table<DailyMedCheck, number>

  constructor() {
    super('DiarioDigestivo')

    this.version(1).stores({
      foods:         '++id, name, category, favorite, hidden, useCount',
      condiments:    '++id, name, favorite, hidden, useCount',
      symptomDefs:   '++id, name, hidden, useCount',
      medicationDefs:'++id, name, hidden, useCount',
      meals:         '++id, date, type, createdAt',
      symptoms:      '++id, date, datetime',
      bathroom:      '++id, date, datetime',
      medications:   '++id, date, datetime, medicationId',
      dailyFactors:  '++id, &date',
    })

    // v2: añade tabla medChecks y campos nuevos en medicationDefs
    this.version(2).stores({
      foods:         '++id, name, category, favorite, hidden, useCount',
      condiments:    '++id, name, favorite, hidden, useCount',
      symptomDefs:   '++id, name, hidden, useCount',
      medicationDefs:'++id, name, hidden, useCount',
      meals:         '++id, date, type, createdAt',
      symptoms:      '++id, date, datetime',
      bathroom:      '++id, date, datetime',
      medications:   '++id, date, datetime, medicationId, tomaId',
      dailyFactors:  '++id, &date',
      medChecks:     '++id, &date',
    }).upgrade(async tx => {
      // Migra medicationDefs existentes: añade tomas: ['manana'] por defecto
      await tx.table('medicationDefs').toCollection().modify((med: MedicationDef) => {
        if (!med.tomas) med.tomas = ['manana']
      })
    })
  }
}

export const db = new DiarioDigestivoDB()

export async function seedIfEmpty() {
  const foodCount = await db.foods.count()
  if (foodCount === 0) {
    await db.foods.bulkAdd(INITIAL_FOODS as FoodItem[])
    await db.condiments.bulkAdd(INITIAL_CONDIMENTS as Condiment[])
    await db.symptomDefs.bulkAdd(INITIAL_SYMPTOMS as SymptomDef[])
    await db.medicationDefs.bulkAdd(
      (INITIAL_MEDICATIONS as Omit<MedicationDef, 'id'>[]).map(m => ({ ...m, tomas: ['manana'] as import('../types/medication').TomaId[] }))
    )
  }
}

export async function getOrCreateFactors(date: string): Promise<DailyFactors> {
  const existing = await db.dailyFactors.where('date').equals(date).first()
  if (existing) return existing
  const id = await db.dailyFactors.add({ date } as DailyFactors)
  return { id, date }
}

export async function getOrCreateMedCheck(date: string): Promise<DailyMedCheck> {
  const existing = await db.medChecks.where('date').equals(date).first()
  if (existing) return existing
  const id = await db.medChecks.add({ date, checks: {} } as DailyMedCheck)
  return { id, date, checks: {} }
}

export async function exportAllData() {
  const [foods, condiments, symptomDefs, medicationDefs,
         meals, symptoms, bathroom, medications, dailyFactors, medChecks] = await Promise.all([
    db.foods.toArray(), db.condiments.toArray(),
    db.symptomDefs.toArray(), db.medicationDefs.toArray(),
    db.meals.toArray(), db.symptoms.toArray(),
    db.bathroom.toArray(), db.medications.toArray(),
    db.dailyFactors.toArray(), db.medChecks.toArray(),
  ])
  return { foods, condiments, symptomDefs, medicationDefs, meals, symptoms,
           bathroom, medications, dailyFactors, medChecks, exportedAt: new Date().toISOString() }
}

export async function importAllData(data: Awaited<ReturnType<typeof exportAllData>>) {
  await db.transaction('rw',
    [db.foods, db.condiments, db.symptomDefs, db.medicationDefs,
     db.meals, db.symptoms, db.bathroom, db.medications, db.dailyFactors, db.medChecks],
    async () => {
      await db.foods.clear(); await db.foods.bulkAdd(data.foods)
      await db.condiments.clear(); await db.condiments.bulkAdd(data.condiments)
      await db.symptomDefs.clear(); await db.symptomDefs.bulkAdd(data.symptomDefs)
      await db.medicationDefs.clear(); await db.medicationDefs.bulkAdd(data.medicationDefs)
      await db.meals.clear(); await db.meals.bulkAdd(data.meals)
      await db.symptoms.clear(); await db.symptoms.bulkAdd(data.symptoms)
      await db.bathroom.clear(); await db.bathroom.bulkAdd(data.bathroom)
      await db.medications.clear(); await db.medications.bulkAdd(data.medications)
      await db.dailyFactors.clear(); await db.dailyFactors.bulkAdd(data.dailyFactors)
      await db.medChecks.clear()
      if (data.medChecks) await db.medChecks.bulkAdd(data.medChecks)
    }
  )
}

export async function deleteAllData() {
  await db.transaction('rw',
    [db.foods, db.condiments, db.symptomDefs, db.medicationDefs,
     db.meals, db.symptoms, db.bathroom, db.medications, db.dailyFactors, db.medChecks],
    async () => {
      await Promise.all([
        db.foods.clear(), db.condiments.clear(), db.symptomDefs.clear(),
        db.medicationDefs.clear(), db.meals.clear(), db.symptoms.clear(),
        db.bathroom.clear(), db.medications.clear(), db.dailyFactors.clear(),
        db.medChecks.clear(),
      ])
    }
  )
  await seedIfEmpty()
}

export function computeDayColor(symptoms: SymptomEntry[]): 'green' | 'yellow' | 'red' | 'gray' {
  if (!symptoms || symptoms.length === 0) return 'gray'
  const maxIntensity = Math.max(...symptoms.map(s => s.intensity))
  if (maxIntensity >= 4) return 'red'
  if (maxIntensity >= 2) return 'yellow'
  return 'green'
}

import type { FoodItem, Condiment, SymptomDef, MedicationDef } from '../types'

export const FOOD_CATEGORIES = [
  'Panes y cereales',
  'Lácteos',
  'Frutas',
  'Verduras y hortalizas',
  'Legumbres',
  'Carnes',
  'Pescados',
  'Huevos',
  'Embutidos',
  'Arroces y pastas',
  'Dulces y bollería',
  'Bebidas',
  'Comida preparada',
  'Otros',
]

export const INITIAL_FOODS: Omit<FoodItem, 'id'>[] = [
  // Panes y cereales
  { name: 'Pan blanco', category: 'Panes y cereales', favorite: false, hidden: false, useCount: 0 },
  { name: 'Pan integral', category: 'Panes y cereales', favorite: false, hidden: false, useCount: 0 },
  { name: 'Tostadas', category: 'Panes y cereales', favorite: false, hidden: false, useCount: 0 },
  { name: 'Arroz blanco', category: 'Arroces y pastas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Arroz integral', category: 'Arroces y pastas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Pasta', category: 'Arroces y pastas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Macarrones', category: 'Arroces y pastas', favorite: false, hidden: false, useCount: 0 },
  // Lácteos
  { name: 'Leche entera', category: 'Lácteos', favorite: false, hidden: false, useCount: 0 },
  { name: 'Leche desnatada', category: 'Lácteos', favorite: false, hidden: false, useCount: 0 },
  { name: 'Yogur natural', category: 'Lácteos', favorite: false, hidden: false, useCount: 0 },
  { name: 'Queso fresco', category: 'Lácteos', favorite: false, hidden: false, useCount: 0 },
  { name: 'Queso curado', category: 'Lácteos', favorite: false, hidden: false, useCount: 0 },
  // Frutas
  { name: 'Plátano', category: 'Frutas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Manzana', category: 'Frutas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Naranja', category: 'Frutas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Pera', category: 'Frutas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Uvas', category: 'Frutas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Sandía', category: 'Frutas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Melón', category: 'Frutas', favorite: false, hidden: false, useCount: 0 },
  // Verduras
  { name: 'Lechuga', category: 'Verduras y hortalizas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Tomate', category: 'Verduras y hortalizas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Zanahoria', category: 'Verduras y hortalizas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Patata', category: 'Verduras y hortalizas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Judías verdes', category: 'Verduras y hortalizas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Calabacín', category: 'Verduras y hortalizas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Brócoli', category: 'Verduras y hortalizas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Coliflor', category: 'Verduras y hortalizas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Espinacas', category: 'Verduras y hortalizas', favorite: false, hidden: false, useCount: 0 },
  // Legumbres
  { name: 'Lentejas', category: 'Legumbres', favorite: false, hidden: false, useCount: 0 },
  { name: 'Garbanzos', category: 'Legumbres', favorite: false, hidden: false, useCount: 0 },
  { name: 'Alubias', category: 'Legumbres', favorite: false, hidden: false, useCount: 0 },
  // Carnes
  { name: 'Pollo', category: 'Carnes', favorite: false, hidden: false, useCount: 0 },
  { name: 'Ternera', category: 'Carnes', favorite: false, hidden: false, useCount: 0 },
  { name: 'Cerdo', category: 'Carnes', favorite: false, hidden: false, useCount: 0 },
  { name: 'Cordero', category: 'Carnes', favorite: false, hidden: false, useCount: 0 },
  // Pescados
  { name: 'Merluza', category: 'Pescados', favorite: false, hidden: false, useCount: 0 },
  { name: 'Bacalao', category: 'Pescados', favorite: false, hidden: false, useCount: 0 },
  { name: 'Sardinas', category: 'Pescados', favorite: false, hidden: false, useCount: 0 },
  { name: 'Atún', category: 'Pescados', favorite: false, hidden: false, useCount: 0 },
  { name: 'Salmón', category: 'Pescados', favorite: false, hidden: false, useCount: 0 },
  // Huevos
  { name: 'Huevo cocido', category: 'Huevos', favorite: false, hidden: false, useCount: 0 },
  { name: 'Huevo frito', category: 'Huevos', favorite: false, hidden: false, useCount: 0 },
  { name: 'Tortilla', category: 'Huevos', favorite: false, hidden: false, useCount: 0 },
  // Embutidos
  { name: 'Jamón serrano', category: 'Embutidos', favorite: false, hidden: false, useCount: 0 },
  { name: 'Jamón cocido', category: 'Embutidos', favorite: false, hidden: false, useCount: 0 },
  { name: 'Chorizo', category: 'Embutidos', favorite: false, hidden: false, useCount: 0 },
  { name: 'Salchichón', category: 'Embutidos', favorite: false, hidden: false, useCount: 0 },
  // Dulces
  { name: 'Galletas', category: 'Dulces y bollería', favorite: false, hidden: false, useCount: 0 },
  { name: 'Bizcocho', category: 'Dulces y bollería', favorite: false, hidden: false, useCount: 0 },
  // Bebidas
  { name: 'Agua', category: 'Bebidas', favorite: true, hidden: false, useCount: 0 },
  { name: 'Café solo', category: 'Bebidas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Café con leche', category: 'Bebidas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Infusión', category: 'Bebidas', favorite: false, hidden: false, useCount: 0 },
  { name: 'Zumo de naranja', category: 'Bebidas', favorite: false, hidden: false, useCount: 0 },
  // Comida preparada
  { name: 'Caldo', category: 'Comida preparada', favorite: false, hidden: false, useCount: 0 },
  { name: 'Sopa', category: 'Comida preparada', favorite: false, hidden: false, useCount: 0 },
  { name: 'Cocido', category: 'Comida preparada', favorite: false, hidden: false, useCount: 0 },
  { name: 'Puré de verduras', category: 'Comida preparada', favorite: false, hidden: false, useCount: 0 },
]

export const INITIAL_CONDIMENTS: Omit<Condiment, 'id'>[] = [
  { name: 'Ajo', favorite: false, hidden: false, useCount: 0 },
  { name: 'Cebolla', favorite: false, hidden: false, useCount: 0 },
  { name: 'Pimienta', favorite: false, hidden: false, useCount: 0 },
  { name: 'Comino', favorite: false, hidden: false, useCount: 0 },
  { name: 'Pimentón', favorite: false, hidden: false, useCount: 0 },
  { name: 'Picante', favorite: false, hidden: false, useCount: 0 },
  { name: 'Tomate frito', favorite: false, hidden: false, useCount: 0 },
  { name: 'Salsa de tomate', favorite: false, hidden: false, useCount: 0 },
  { name: 'Mayonesa', favorite: false, hidden: false, useCount: 0 },
  { name: 'Mostaza', favorite: false, hidden: false, useCount: 0 },
  { name: 'Kétchup', favorite: false, hidden: false, useCount: 0 },
  { name: 'Vinagre', favorite: false, hidden: false, useCount: 0 },
  { name: 'Aceite de oliva', favorite: true, hidden: false, useCount: 0 },
  { name: 'Mantequilla', favorite: false, hidden: false, useCount: 0 },
  { name: 'Nata', favorite: false, hidden: false, useCount: 0 },
  { name: 'Queso rallado', favorite: false, hidden: false, useCount: 0 },
  { name: 'Edulcorante', favorite: false, hidden: false, useCount: 0 },
  { name: 'Azúcar', favorite: false, hidden: false, useCount: 0 },
  { name: 'Especias varias', favorite: false, hidden: false, useCount: 0 },
  { name: 'Sal', favorite: true, hidden: false, useCount: 0 },
]

export const INITIAL_SYMPTOMS: Omit<SymptomDef, 'id'>[] = [
  { name: 'Hinchazón', hidden: false, useCount: 0 },
  { name: 'Barriga dura', hidden: false, useCount: 0 },
  { name: 'Gases', hidden: false, useCount: 0 },
  { name: 'Ruidos intestinales', hidden: false, useCount: 0 },
  { name: 'Dolor abdominal', hidden: false, useCount: 0 },
  { name: 'Malestar fuerte', hidden: false, useCount: 0 },
  { name: 'Acidez', hidden: false, useCount: 0 },
  { name: 'Náuseas', hidden: false, useCount: 0 },
  { name: 'Urgencia para ir al baño', hidden: false, useCount: 0 },
  { name: 'Sensación de evacuación incompleta', hidden: false, useCount: 0 },
  { name: 'Pesadez', hidden: false, useCount: 0 },
  { name: 'Retortijones', hidden: false, useCount: 0 },
  { name: 'Diarrea', hidden: false, useCount: 0 },
  { name: 'Estreñimiento', hidden: false, useCount: 0 },
]

export const INITIAL_MEDICATIONS: Omit<MedicationDef, 'id'>[] = [
  { name: 'Onligol', hidden: false, useCount: 0 },
  { name: 'Omeprazol / Protector gástrico', hidden: false, useCount: 0 },
  { name: 'Probiótico', hidden: false, useCount: 0 },
  { name: 'Antibiótico', hidden: false, useCount: 0 },
  { name: 'Metformina (diabetes)', hidden: false, useCount: 0 },
  { name: 'Insulina', hidden: false, useCount: 0 },
  { name: 'Antihipertensivo', hidden: false, useCount: 0 },
  { name: 'Anticoagulante / AAS', hidden: false, useCount: 0 },
  { name: 'Estatina (colesterol)', hidden: false, useCount: 0 },
  { name: 'Otro medicamento', hidden: false, useCount: 0 },
]

export const MEAL_TYPE_LABELS: Record<string, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  picoteo: 'Picoteo / Otro',
}

export const BRISTOL_DESCRIPTIONS: Record<number, string> = {
  1: 'Tipo 1 — Bolitas duras separadas',
  2: 'Tipo 2 — Salchicha con bultos',
  3: 'Tipo 3 — Salchicha con grietas',
  4: 'Tipo 4 — Salchicha lisa y blanda',
  5: 'Tipo 5 — Trozos blandos',
  6: 'Tipo 6 — Blanda / pastosa',
  7: 'Tipo 7 — Líquida',
}

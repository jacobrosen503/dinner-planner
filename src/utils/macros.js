// Estimated macro breakdown per dinner serving (for 2 people, per person)
// These are rough dinner-portion estimates, clearly labeled as estimates in the UI.

const CATEGORY_MACROS = {
  Beef:         { cal: 650, protein: 45, carbs: 25, fat: 35 },
  Chicken:      { cal: 520, protein: 42, carbs: 30, fat: 20 },
  Pork:         { cal: 580, protein: 38, carbs: 20, fat: 32 },
  Lamb:         { cal: 620, protein: 40, carbs: 15, fat: 38 },
  Seafood:      { cal: 380, protein: 35, carbs: 18, fat: 12 },
  Pasta:        { cal: 580, protein: 22, carbs: 78, fat: 18 },
  Vegetarian:   { cal: 420, protein: 18, carbs: 55, fat: 14 },
  Vegan:        { cal: 390, protein: 15, carbs: 58, fat: 12 },
  Breakfast:    { cal: 480, protein: 24, carbs: 42, fat: 22 },
  Dessert:      { cal: 350, protein: 6,  carbs: 52, fat: 14 },
  Side:         { cal: 250, protein: 8,  carbs: 38, fat: 10 },
  Starter:      { cal: 300, protein: 12, carbs: 28, fat: 16 },
  Miscellaneous:{ cal: 500, protein: 28, carbs: 40, fat: 20 },
}

const DEFAULT_MACROS = { cal: 500, protein: 28, carbs: 40, fat: 20 }

export function estimateMacros(meal) {
  // Spoonacular recipes include actual nutrition sometimes
  if (meal.nutrition) return meal.nutrition

  const base = CATEGORY_MACROS[meal.category] || DEFAULT_MACROS

  // Rough adjustment by ingredient count (more ingredients → slightly more calories)
  const ingCount = meal.ingredients?.length || 10
  const scale = ingCount > 15 ? 1.1 : ingCount < 6 ? 0.9 : 1.0

  return {
    cal: Math.round(base.cal * scale),
    protein: Math.round(base.protein * scale),
    carbs: Math.round(base.carbs * scale),
    fat: Math.round(base.fat * scale),
    estimated: true,
  }
}

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1'

// --- TheMealDB helpers ---

async function mealDbRandom() {
  const r = await fetch(`${MEALDB_BASE}/random.php`)
  const d = await r.json()
  return normalizeMealDb(d.meals[0])
}

async function mealDbCategories() {
  const r = await fetch(`${MEALDB_BASE}/categories.php`)
  const d = await r.json()
  return d.categories.map(c => c.strCategory)
}

async function mealDbByCategory(category) {
  const r = await fetch(`${MEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`)
  const d = await r.json()
  if (!d.meals || d.meals.length === 0) return null
  const pick = d.meals[Math.floor(Math.random() * d.meals.length)]
  const detail = await fetch(`${MEALDB_BASE}/lookup.php?i=${pick.idMeal}`)
  const dd = await detail.json()
  return normalizeMealDb(dd.meals[0])
}

async function mealDbByArea(area) {
  const r = await fetch(`${MEALDB_BASE}/filter.php?a=${encodeURIComponent(area)}`)
  const d = await r.json()
  if (!d.meals || d.meals.length === 0) return null
  const pick = d.meals[Math.floor(Math.random() * d.meals.length)]
  const detail = await fetch(`${MEALDB_BASE}/lookup.php?i=${pick.idMeal}`)
  const dd = await detail.json()
  return normalizeMealDb(dd.meals[0])
}

function normalizeMealDb(m) {
  if (!m) return null
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const ing = m[`strIngredient${i}`]
    const meas = m[`strMeasure${i}`]
    if (ing && ing.trim()) {
      ingredients.push({ name: ing.trim(), measure: meas ? meas.trim() : '' })
    }
  }
  return {
    id: `mealdb-${m.idMeal}`,
    source: 'TheMealDB',
    title: m.strMeal,
    image: m.strMealThumb,
    category: m.strCategory || '',
    cuisine: m.strArea || '',
    instructions: m.strInstructions || '',
    ingredients,
    sourceUrl: m.strSource || null,
    youtubeUrl: m.strYoutube || null,
    tags: m.strTags ? m.strTags.split(',').map(t => t.trim()).filter(Boolean) : [],
  }
}

// --- Spoonacular helpers ---

async function spoonacularRandom(apiKey, count = 1) {
  const r = await fetch(
    `https://api.spoonacular.com/recipes/random?number=${count}&apiKey=${apiKey}`
  )
  if (!r.ok) throw new Error('Spoonacular error: ' + r.status)
  const d = await r.json()
  return d.recipes.map(normalizeSpoonacular)
}

function normalizeSpoonacular(r) {
  const ingredients = (r.extendedIngredients || []).map(i => ({
    name: i.name,
    measure: `${i.amount} ${i.unit}`.trim(),
  }))
  const instructions = (r.analyzedInstructions || [])
    .flatMap(block => block.steps || [])
    .map(s => s.step)
    .join('\n\n')
  return {
    id: `spoon-${r.id}`,
    source: 'Spoonacular',
    title: r.title,
    image: r.image,
    category: (r.dishTypes || [])[0] || '',
    cuisine: (r.cuisines || [])[0] || '',
    instructions: instructions || r.summary?.replace(/<[^>]+>/g, '') || '',
    ingredients,
    sourceUrl: r.sourceUrl || null,
    youtubeUrl: null,
    tags: [...(r.diets || []), ...(r.dishTypes || [])],
    readyInMinutes: r.readyInMinutes,
    servings: r.servings,
  }
}

// --- Public API ---

const AREAS = [
  'American', 'British', 'Canadian', 'Chinese', 'Croatian', 'Dutch',
  'Egyptian', 'Filipino', 'French', 'Greek', 'Indian', 'Irish',
  'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 'Mexican',
  'Moroccan', 'Polish', 'Portuguese', 'Russian', 'Spanish', 'Thai',
  'Tunisian', 'Turkish', 'Ukrainian', 'Vietnamese',
]

const DINNER_CATEGORIES = [
  'Beef', 'Chicken', 'Lamb', 'Pasta', 'Pork', 'Seafood',
  'Side', 'Vegan', 'Vegetarian', 'Miscellaneous',
]

// Generate 7 diverse meals — tries to avoid repeating categories/cuisines
export async function generateWeekPlan(spoonacularKey = null) {
  const results = []
  const usedCategories = new Set()
  const usedAreas = new Set()

  // Shuffle categories and areas for variety
  const shuffledCats = [...DINNER_CATEGORIES].sort(() => Math.random() - 0.5)
  const shuffledAreas = [...AREAS].sort(() => Math.random() - 0.5)

  let catIdx = 0
  let areaIdx = 0

  const fetchOne = async (attempt = 0) => {
    if (attempt > 15) {
      // fallback to pure random
      return mealDbRandom()
    }

    // Alternate between category-based and area-based picks for variety
    if (Math.random() > 0.4 && catIdx < shuffledCats.length) {
      const cat = shuffledCats[catIdx++]
      if (usedCategories.has(cat)) return fetchOne(attempt + 1)
      const meal = await mealDbByCategory(cat)
      if (!meal) return fetchOne(attempt + 1)
      usedCategories.add(cat)
      return meal
    } else {
      const area = shuffledAreas[areaIdx++ % shuffledAreas.length]
      if (usedAreas.has(area)) return fetchOne(attempt + 1)
      const meal = await mealDbByArea(area)
      if (!meal) return fetchOne(attempt + 1)
      usedAreas.add(area)
      return meal
    }
  }

  // If Spoonacular key provided, mix in some Spoonacular recipes
  let spoonRecipes = []
  if (spoonacularKey) {
    try {
      spoonRecipes = await spoonacularRandom(spoonacularKey, 3)
    } catch (e) {
      console.warn('Spoonacular fetch failed:', e.message)
    }
  }

  // Fill 7 slots
  for (let i = 0; i < 7; i++) {
    if (spoonRecipes.length > 0 && (i % 3 === 1)) {
      results.push(spoonRecipes.shift())
    } else {
      try {
        const meal = await fetchOne()
        results.push(meal)
      } catch (e) {
        console.warn('Meal fetch failed:', e)
        results.push(await mealDbRandom())
      }
    }
  }

  return results
}

export async function fetchSingleMeal(spoonacularKey = null, excludeCategories = []) {
  const areas = [...AREAS].sort(() => Math.random() - 0.5)
  const cats = [...DINNER_CATEGORIES].filter(c => !excludeCategories.includes(c))
    .sort(() => Math.random() - 0.5)

  if (spoonacularKey && Math.random() > 0.5) {
    try {
      const [meal] = await spoonacularRandom(spoonacularKey, 1)
      return meal
    } catch {}
  }

  if (cats.length > 0 && Math.random() > 0.5) {
    const meal = await mealDbByCategory(cats[0])
    if (meal) return meal
  }

  const meal = await mealDbByArea(areas[0])
  if (meal) return meal

  return mealDbRandom()
}

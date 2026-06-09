import { scoreLeftovers } from '../utils/tags'
import { pickEfficientWeek } from '../utils/shopping'
import { isEntree } from '../utils/entree'

const MEALDB = 'https://www.themealdb.com/api/json/v1/1'

// ---------------------------------------------------------------------------
// TheMealDB
// ---------------------------------------------------------------------------

function normalizeMealDb(m) {
  if (!m) return null
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const ing = m[`strIngredient${i}`]
    const meas = m[`strMeasure${i}`]
    if (ing?.trim()) ingredients.push({ name: ing.trim(), measure: meas?.trim() || '' })
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

async function dbFetch(path) {
  const r = await fetch(`${MEALDB}${path}`)
  return r.json()
}

async function mealDbRandom() {
  const d = await dbFetch('/random.php')
  return normalizeMealDb(d.meals?.[0])
}

async function mealDbLookup(id) {
  const d = await dbFetch(`/lookup.php?i=${id}`)
  return normalizeMealDb(d.meals?.[0])
}

async function mealDbListByCategory(cat) {
  const d = await dbFetch(`/filter.php?c=${encodeURIComponent(cat)}`)
  return d.meals || []
}

async function mealDbListByArea(area) {
  const d = await dbFetch(`/filter.php?a=${encodeURIComponent(area)}`)
  return d.meals || []
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

async function pickFromList(list, excludeIds = new Set(), requireEntree = true) {
  const available = shuffle(list.filter(m => !excludeIds.has(`mealdb-${m.idMeal}`)))
  for (const item of available.slice(0, 10)) {
    const meal = await mealDbLookup(item.idMeal)
    if (!meal) continue
    if (requireEntree && !isEntree(meal)) continue
    return meal
  }
  return null
}

async function mealDbByCategory(cat, excludeIds = new Set(), requireEntree = true) {
  const list = await mealDbListByCategory(cat)
  return pickFromList(list, excludeIds, requireEntree)
}

async function mealDbByArea(area, excludeIds = new Set(), requireEntree = true) {
  const list = await mealDbListByArea(area)
  return pickFromList(list, excludeIds, requireEntree)
}

// ---------------------------------------------------------------------------
// Side dish: fetch from TheMealDB Side category or Vegetarian category (non-entrees)
// ---------------------------------------------------------------------------

const SIDE_CATEGORIES = ['Side', 'Vegetarian', 'Vegan']

export async function fetchSideDish(mainCuisine = '', excludeIds = new Set()) {
  // Try to match cuisine proximity
  if (mainCuisine) {
    try {
      const list = await mealDbListByArea(mainCuisine)
      const filtered = list.filter(m => !excludeIds.has(`mealdb-${m.idMeal}`))
      for (const item of shuffle(filtered).slice(0, 8)) {
        const meal = await mealDbLookup(item.idMeal)
        if (meal && !isEntree(meal)) return meal
      }
    } catch {}
  }

  // Fallback: Side or Vegetarian category
  const cats = shuffle(SIDE_CATEGORIES)
  for (const cat of cats) {
    try {
      const meal = await mealDbByCategory(cat, excludeIds, false)
      if (meal && !isEntree(meal)) return meal
    } catch {}
  }

  // Last resort: any vegetarian dish
  for (let i = 0; i < 5; i++) {
    const m = await mealDbRandom()
    if (m && !isEntree(m) && !excludeIds.has(m.id)) return m
  }
  return null
}

// ---------------------------------------------------------------------------
// Spoonacular
// ---------------------------------------------------------------------------

function normalizeSpoonacular(r) {
  const ingredients = (r.extendedIngredients || []).map(i => ({
    name: i.name,
    measure: `${i.amount} ${i.unit}`.trim(),
  }))
  const instructions = (r.analyzedInstructions || [])
    .flatMap(b => b.steps || [])
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

async function spoonRandom(key, count = 1) {
  const r = await fetch(`https://api.spoonacular.com/recipes/random?number=${count}&apiKey=${key}`)
  if (!r.ok) throw new Error('Spoonacular ' + r.status)
  const d = await r.json()
  return d.recipes.map(normalizeSpoonacular)
}

async function spoonByCuisine(key, cuisine) {
  const p = new URLSearchParams({ cuisine, number: 5, apiKey: key, addRecipeInformation: true })
  const r = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${p}`)
  if (!r.ok) throw new Error('Spoonacular ' + r.status)
  const d = await r.json()
  if (!d.results?.length) return null
  const pick = shuffle(d.results)[0]
  const det = await fetch(`https://api.spoonacular.com/recipes/${pick.id}/information?apiKey=${key}`)
  return normalizeSpoonacular(await det.json())
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ALL_AREAS = [
  'American', 'British', 'Canadian', 'Chinese', 'Croatian', 'Dutch',
  'Egyptian', 'Filipino', 'French', 'Greek', 'Indian', 'Irish',
  'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 'Mexican',
  'Moroccan', 'Polish', 'Portuguese', 'Russian', 'Spanish', 'Thai',
  'Tunisian', 'Turkish', 'Ukrainian', 'Vietnamese',
]

const ENTREE_CATEGORIES = [
  'Beef', 'Chicken', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Miscellaneous',
]

// ---------------------------------------------------------------------------
// Pool generation (entrees only)
// ---------------------------------------------------------------------------

async function generatePool(size, spoonKey, opts = {}) {
  const { goodLeftovers = false } = opts
  const pool = []
  const usedIds = new Set()
  const cats = shuffle(ENTREE_CATEGORIES)
  const areas = shuffle(ALL_AREAS)
  let ci = 0, ai = 0, attempts = 0

  while (pool.length < size && attempts < size * 6) {
    attempts++
    let meal = null
    const roll = Math.random()

    try {
      if (roll < 0.45) {
        meal = await mealDbByCategory(cats[ci++ % cats.length], usedIds, true)
      } else if (roll < 0.8 || !spoonKey) {
        meal = await mealDbByArea(areas[ai++ % areas.length], usedIds, true)
      } else {
        try {
          const [m] = await spoonRandom(spoonKey, 1)
          if (m && isEntree(m)) meal = m
        } catch {
          meal = null
        }
      }

      if (!meal || usedIds.has(meal.id)) continue
      if (!isEntree(meal)) continue
      if (goodLeftovers && scoreLeftovers(meal) < 1) continue

      usedIds.add(meal.id)
      pool.push(meal)
    } catch {}
  }

  return pool
}

// ---------------------------------------------------------------------------
// Public: week plan
// ---------------------------------------------------------------------------

export async function generateWeekPlan(spoonKey = null, opts = {}) {
  const { efficientShopping = false, goodLeftovers = false } = opts
  const poolSize = efficientShopping ? 28 : 10

  const pool = await generatePool(poolSize, spoonKey, { goodLeftovers })

  let entrees = efficientShopping && pool.length > 7
    ? pickEfficientWeek(pool, 7)
    : pool.slice(0, 7)

  // Pad if short
  while (entrees.length < 7) {
    try {
      for (let i = 0; i < 5; i++) {
        const m = await mealDbRandom()
        if (m && isEntree(m) && !entrees.find(e => e.id === m.id)) {
          entrees.push(m)
          break
        }
      }
    } catch { break }
  }

  return entrees.slice(0, 7)
}

// ---------------------------------------------------------------------------
// Public: refresh operations
// ---------------------------------------------------------------------------

export async function fetchSingleEntree(spoonKey = null, excludeIds = []) {
  const excluded = new Set(excludeIds)
  const areas = shuffle(ALL_AREAS)
  const cats = shuffle(ENTREE_CATEGORIES)

  if (spoonKey && Math.random() > 0.5) {
    try {
      const [m] = await spoonRandom(spoonKey, 1)
      if (m && isEntree(m) && !excluded.has(m.id)) return m
    } catch {}
  }

  for (const area of areas.slice(0, 4)) {
    const m = await mealDbByArea(area, excluded, true)
    if (m) return m
  }
  for (const cat of cats.slice(0, 4)) {
    const m = await mealDbByCategory(cat, excluded, true)
    if (m) return m
  }
  return mealDbRandom()
}

export async function fetchDifferentCuisine(currentCuisine, spoonKey = null, excludeIds = []) {
  const excluded = new Set(excludeIds)
  const areas = shuffle(ALL_AREAS.filter(a => a !== currentCuisine))
  for (const area of areas.slice(0, 6)) {
    const m = await mealDbByArea(area, excluded, true)
    if (m) return m
  }
  if (spoonKey) {
    try { const m = await spoonByCuisine(spoonKey, areas[0]); if (m) return m } catch {}
  }
  return mealDbRandom()
}

export async function fetchSameCuisineDifferent(currentCuisine, spoonKey = null, excludeIds = []) {
  const excluded = new Set(excludeIds)
  if (currentCuisine) {
    try {
      const list = await mealDbListByArea(currentCuisine)
      const m = await pickFromList(list, excluded, true)
      if (m) return m
    } catch {}
  }
  if (spoonKey && currentCuisine) {
    try { const m = await spoonByCuisine(spoonKey, currentCuisine); if (m) return m } catch {}
  }
  return fetchDifferentCuisine(currentCuisine, spoonKey, excludeIds)
}

export async function fetchSwapProtein(currentCuisine, currentCategory, spoonKey = null, excludeIds = []) {
  const excluded = new Set(excludeIds)
  if (currentCuisine) {
    try {
      const list = await mealDbListByArea(currentCuisine)
      for (const candidate of shuffle(list).slice(0, 15)) {
        if (excluded.has(`mealdb-${candidate.idMeal}`)) continue
        const m = await mealDbLookup(candidate.idMeal)
        if (!m || !isEntree(m)) continue
        if (m.category !== currentCategory) return m
      }
    } catch {}
  }
  const otherCats = shuffle(ENTREE_CATEGORIES.filter(c => c !== currentCategory))
  for (const cat of otherCats.slice(0, 3)) {
    const m = await mealDbByCategory(cat, excluded, true)
    if (m) return m
  }
  return mealDbRandom()
}

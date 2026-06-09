// Greedy algorithm to pick 7 recipes with maximum ingredient overlap
// (minimizing unique ingredients across the week)

function normalizeIngredient(name) {
  return name.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/^(fresh|dried|frozen|canned|cooked|raw|chopped|sliced|diced|minced)\s+/, '')
}

export function pickEfficientWeek(pool, count = 7) {
  if (pool.length <= count) return pool

  // Build ingredient sets for each recipe
  const recipeSets = pool.map(meal => ({
    meal,
    ingredients: new Set(
      (meal.ingredients || []).map(i => normalizeIngredient(i.name))
    ),
  }))

  // Count global ingredient frequency
  const freq = new Map()
  recipeSets.forEach(({ ingredients }) => {
    ingredients.forEach(ing => {
      freq.set(ing, (freq.get(ing) || 0) + 1)
    })
  })

  const selected = []
  const globalIngredients = new Set()
  const usedIndices = new Set()

  for (let round = 0; round < count; round++) {
    let bestScore = -Infinity
    let bestIdx = -1

    recipeSets.forEach(({ meal, ingredients }, idx) => {
      if (usedIndices.has(idx)) return

      // Score = ingredients already in global set / total ingredients
      // (maximizing reuse, minimizing new unique items)
      const overlap = [...ingredients].filter(i => globalIngredients.has(i)).length
      const newUnique = ingredients.size - overlap
      // Prefer high overlap, low new unique
      const score = overlap * 2 - newUnique

      if (score > bestScore) {
        bestScore = score
        bestIdx = idx
      }
    })

    if (bestIdx === -1) break
    const { meal, ingredients } = recipeSets[bestIdx]
    selected.push(meal)
    ingredients.forEach(i => globalIngredients.add(i))
    usedIndices.add(bestIdx)
  }

  return selected
}

export function countUniqueIngredients(meals) {
  const all = new Set()
  meals.forEach(meal => {
    if (!meal) return
    ;(meal.ingredients || []).forEach(i => {
      all.add(normalizeIngredient(i.name))
    })
  })
  return all.size
}

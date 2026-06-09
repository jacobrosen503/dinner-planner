// Infer displayable tags from recipe data

const HIGH_PROTEIN_CATEGORIES = new Set(['Beef', 'Chicken', 'Lamb', 'Pork', 'Seafood'])
const VEGETARIAN_CATEGORIES = new Set(['Vegetarian', 'Vegan'])
const VEGAN_CATEGORIES = new Set(['Vegan'])

const LEFTOVERS_GOOD_KEYWORDS = [
  'curry', 'stew', 'soup', 'casserole', 'chili', 'braise', 'braised',
  'bolognese', 'lasagna', 'lasagne', 'bake', 'roast', 'roasted',
  'bean', 'lentil', 'dal', 'dahl', 'tagine', 'slow', 'pot', 'ragu',
  'enchilada', 'burrito', 'pilaf', 'pilau', 'biryani', 'risotto',
]
const LEFTOVERS_BAD_KEYWORDS = [
  'salad', 'sushi', 'sashimi', 'sandwich', 'wrap', 'crepe', 'pancake',
  'grilled fish', 'fried egg', 'poached', 'tartare',
]

const ONE_POT_KEYWORDS = [
  'one pot', 'one-pot', 'one pan', 'one-pan', 'slow cooker', 'instant pot',
  'pressure cooker', 'sheet pan', 'skillet', 'traybake',
]

export function computeTags(meal) {
  const tags = []
  const title = (meal.title || '').toLowerCase()
  const category = meal.category || ''
  const mealTags = meal.tags || []
  const existingTagsLower = mealTags.map(t => t.toLowerCase())
  const instructions = (meal.instructions || '').toLowerCase()

  // High protein
  if (
    HIGH_PROTEIN_CATEGORIES.has(category) ||
    existingTagsLower.some(t => ['high-protein', 'highprotein'].includes(t))
  ) {
    tags.push({ label: 'High Protein', icon: '💪', color: '#ef4444' })
  }

  // Vegetarian / Vegan
  if (VEGAN_CATEGORIES.has(category) || existingTagsLower.includes('vegan')) {
    tags.push({ label: 'Vegan', icon: '🌱', color: '#22c55e' })
  } else if (
    VEGETARIAN_CATEGORIES.has(category) ||
    existingTagsLower.includes('vegetarian')
  ) {
    tags.push({ label: 'Vegetarian', icon: '🥦', color: '#4ade80' })
  }

  // Quick to make
  const isQuick =
    (meal.readyInMinutes && meal.readyInMinutes <= 30) ||
    (!meal.readyInMinutes && meal.ingredients && meal.ingredients.length <= 8)
  if (isQuick) {
    tags.push({ label: '< 30 min', icon: '⚡', color: '#facc15' })
  }

  // Good leftovers
  const goodLeftovers =
    LEFTOVERS_GOOD_KEYWORDS.some(k => title.includes(k) || instructions.includes(k)) &&
    !LEFTOVERS_BAD_KEYWORDS.some(k => title.includes(k))
  if (goodLeftovers) {
    tags.push({ label: 'Good Leftovers', icon: '🍱', color: '#a78bfa' })
  }

  // One-pot
  const onePot = ONE_POT_KEYWORDS.some(
    k => title.includes(k) || instructions.includes(k)
  )
  if (onePot) {
    tags.push({ label: 'One Pot', icon: '🥘', color: '#60a5fa' })
  }

  return tags
}

export function scoreLeftovers(meal) {
  const title = (meal.title || '').toLowerCase()
  const instructions = (meal.instructions || '').toLowerCase()
  let score = 0
  LEFTOVERS_GOOD_KEYWORDS.forEach(k => {
    if (title.includes(k)) score += 3
    else if (instructions.includes(k)) score += 1
  })
  LEFTOVERS_BAD_KEYWORDS.forEach(k => {
    if (title.includes(k)) score -= 5
  })
  // Seafood and fried items generally don't reheat well
  if (meal.category === 'Seafood') score -= 2
  return score
}

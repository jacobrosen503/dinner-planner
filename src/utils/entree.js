// Classify a recipe as entree vs side dish for the purpose of the main dinner slot.

// TheMealDB categories that are always entrees
const ALWAYS_ENTREE = new Set([
  'Beef', 'Chicken', 'Lamb', 'Pork', 'Seafood', 'Goat', 'Pasta',
])

// Categories never used in the main entree slot
const NEVER_ENTREE = new Set([
  'Side', 'Starter', 'Breakfast', 'Dessert',
])

// Title keywords strongly suggesting a complete dish (entree)
const ENTREE_TITLE_KW = [
  'curry', 'stew', 'casserole', 'braise', 'braised', 'roast', 'roasted',
  'stir.?fry', 'stir.?fried', 'soup', 'chowder', 'ramen', 'pho', 'noodle',
  'pasta', 'risotto', 'pilaf', 'biryani', 'paella', 'fried rice',
  'lasagna', 'lasagne', 'moussaka', 'tagine', 'shakshuka', 'frittata',
  'quiche', 'burger', 'taco', 'burrito', 'enchilada', 'fajita', 'bowl',
  'bake', 'gratin', 'pie', 'chili', 'dal', 'dhal', 'aloo', 'paneer',
  'tofu', 'tempeh', 'schnitzel', 'stuffed', 'filled',
]

// Title keywords strongly suggesting a side / accompaniment
const SIDE_TITLE_KW = [
  'salad', 'slaw', 'dip', 'hummus', 'guacamole', 'sauce', 'relish',
  'chutney', 'chips', 'crisps', 'bread', 'rolls', 'bun', 'flatbread',
  'naan', 'pita', 'mash', 'mashed', 'puree', 'glaze', 'marinade',
  'dressing', 'vinaigrette', 'pesto', 'compote', 'jam', 'pickle',
  'roasted (asparagus|broccoli|carrots|cauliflower|zucchini|mushrooms|peppers|potatoes)',
  'steamed (vegetables|broccoli|spinach|bok choy|green beans)',
  'sautéed', 'sauteed',
]

function matchesKw(text, patterns) {
  return patterns.some(p => new RegExp(p, 'i').test(text))
}

export function isEntree(meal) {
  const cat = meal.category || ''
  const title = meal.title || ''

  if (NEVER_ENTREE.has(cat)) return false
  if (ALWAYS_ENTREE.has(cat)) {
    // Even in protein categories, veto obvious sides
    return !matchesKw(title, SIDE_TITLE_KW)
  }

  // Miscellaneous: usually entree, filter out known sides
  if (cat === 'Miscellaneous') {
    if (matchesKw(title, SIDE_TITLE_KW)) return false
    return true
  }

  // Vegetarian / Vegan: check if it's substantial
  if (cat === 'Vegetarian' || cat === 'Vegan') {
    if (matchesKw(title, SIDE_TITLE_KW)) return false
    if (matchesKw(title, ENTREE_TITLE_KW)) return true
    // Substantial if many ingredients
    if (meal.ingredients && meal.ingredients.length >= 7) return true
    return false
  }

  // Unknown category (e.g. scraped recipes)
  if (matchesKw(title, SIDE_TITLE_KW)) return false
  if (matchesKw(title, ENTREE_TITLE_KW)) return true
  // Default: treat as entree if it has enough ingredients
  if (meal.ingredients && meal.ingredients.length >= 6) return true
  return true
}

export function isSide(meal) {
  return !isEntree(meal)
}

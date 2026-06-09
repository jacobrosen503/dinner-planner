// Ingredient substitution suggestions.
// noImpact: true → bold in UI (swap barely changes flavor/texture)
// noImpact: false → plain text (healthier but you'll notice the difference)

const ENTRIES = [
  {
    match: /\bbutter\b/i,
    subs: [
      { sub: 'avocado oil', reason: 'less saturated fat, neutral flavor for sautéing', noImpact: false },
      { sub: 'olive oil', reason: 'less saturated fat, heart-healthy', noImpact: false },
    ],
  },
  {
    match: /\bheavy cream\b|\bdouble cream\b|\bwhipping cream\b/i,
    subs: [
      { sub: 'coconut cream', reason: 'dairy-free, same richness', noImpact: true },
      { sub: 'Greek yogurt', reason: 'much more protein, far less fat', noImpact: false },
    ],
  },
  {
    match: /\bsour cream\b/i,
    subs: [
      { sub: 'plain Greek yogurt', reason: 'more protein, less fat, slightly tangier', noImpact: false },
      { sub: 'low-fat sour cream', reason: 'same flavor, less fat', noImpact: true },
    ],
  },
  {
    match: /\bcream cheese\b/i,
    subs: [
      { sub: 'Neufchâtel cheese', reason: 'same flavor, 1/3 less fat', noImpact: true },
      { sub: 'blended cottage cheese', reason: 'much more protein, far less fat', noImpact: false },
    ],
  },
  {
    match: /\bwhole milk\b|\bfull.fat milk\b|\bfull fat milk\b/i,
    subs: [
      { sub: '2% milk', reason: 'less saturated fat, almost identical in cooking', noImpact: true },
      { sub: 'unsweetened oat milk', reason: 'dairy-free, creamy texture', noImpact: false },
    ],
  },
  {
    match: /\bwhite rice\b/i,
    subs: [
      { sub: 'brown rice', reason: 'more fiber and nutrients, same flavor', noImpact: true },
      { sub: 'cauliflower rice', reason: 'very low carb, lighter texture', noImpact: false },
    ],
  },
  {
    match: /\bpasta\b|\bspaghetti\b|\bpenne\b|\brigatoni\b|\bfettuccine\b|\blinguine\b/i,
    subs: [
      { sub: 'whole wheat pasta', reason: 'more fiber, nearly identical flavor', noImpact: true },
      { sub: 'chickpea pasta', reason: '2× the protein, gluten-free', noImpact: false },
    ],
  },
  {
    match: /\bflour\b(?!.*almond)/i,
    subs: [
      { sub: 'whole wheat flour', reason: 'more fiber (use 75% of the amount)', noImpact: false },
      { sub: 'oat flour', reason: 'more fiber, gluten-free option', noImpact: false },
    ],
  },
  {
    match: /\bvegetable oil\b|\bcanola oil\b|\bsunflower oil\b/i,
    subs: [
      { sub: 'olive oil', reason: 'healthier fat profile, slight flavor addition', noImpact: true },
      { sub: 'avocado oil', reason: 'healthier fats, completely neutral flavor', noImpact: true },
    ],
  },
  {
    match: /\bground beef\b|\bminced beef\b/i,
    subs: [
      { sub: '93% lean ground turkey', reason: 'less saturated fat, more protein per calorie', noImpact: false },
      { sub: '90% lean ground beef', reason: 'same flavor, significantly less fat', noImpact: true },
    ],
  },
  {
    match: /\bchicken thigh\b|\bchicken thighs\b/i,
    subs: [
      { sub: 'chicken breast', reason: 'less fat, more protein — add a bit more oil to prevent drying', noImpact: false },
    ],
  },
  {
    match: /\bpork belly\b/i,
    subs: [
      { sub: 'pork tenderloin', reason: 'much leaner, still tender if not overcooked', noImpact: false },
    ],
  },
  {
    match: /\bbacon\b/i,
    subs: [
      { sub: 'turkey bacon', reason: 'less fat, slightly less smoky', noImpact: false },
      { sub: 'Canadian bacon / back bacon', reason: 'much leaner, similar savory flavor', noImpact: false },
    ],
  },
  {
    match: /\bmayonnaise\b|\bmayo\b/i,
    subs: [
      { sub: 'plain Greek yogurt', reason: 'much more protein, far less fat', noImpact: false },
      { sub: 'avocado mayo', reason: 'healthier fats, nearly identical taste', noImpact: true },
    ],
  },
  {
    match: /\bsoy sauce\b/i,
    subs: [
      { sub: 'low-sodium soy sauce', reason: '40% less sodium, identical flavor', noImpact: true },
      { sub: 'coconut aminos', reason: 'soy-free, slightly sweeter, less sodium', noImpact: false },
    ],
  },
  {
    match: /\bsugar\b(?!.*coconut|.*brown)/i,
    subs: [
      { sub: 'coconut sugar', reason: 'lower glycemic index, slight caramel note', noImpact: false },
      { sub: 'monk fruit sweetener', reason: 'zero calories, same sweetness level', noImpact: true },
    ],
  },
  {
    match: /\bwhite bread\b|\bbread crumbs\b|\bbreadcrumbs\b|\bpanko\b/i,
    subs: [
      { sub: 'whole wheat breadcrumbs', reason: 'more fiber, same crunch', noImpact: true },
      { sub: 'almond meal', reason: 'low carb, adds protein', noImpact: false },
    ],
  },
  {
    match: /\bcheddar\b|\bparmesan\b|\bgouda\b|\bgruyere\b/i,
    subs: [
      { sub: 'reduced-fat version', reason: 'same flavor, less saturated fat', noImpact: true },
    ],
  },
  {
    match: /\bcreme fraiche\b/i,
    subs: [
      { sub: 'Greek yogurt', reason: 'more protein, less fat — add after heat to prevent curdling', noImpact: false },
    ],
  },
  {
    match: /\bcoconut milk\b/i,
    subs: [
      { sub: 'light coconut milk', reason: 'same flavor, significantly less fat', noImpact: true },
      { sub: 'unsweetened almond milk + 1 tbsp coconut oil', reason: 'lower calorie coconut flavor', noImpact: false },
    ],
  },
  {
    match: /\bshortening\b|\blard\b/i,
    subs: [
      { sub: 'coconut oil', reason: 'similar solid fat behavior, no trans fats', noImpact: false },
    ],
  },
  {
    match: /\bbeef stock\b|\bbeef broth\b/i,
    subs: [
      { sub: 'low-sodium beef broth', reason: 'much less sodium, same flavor base', noImpact: true },
    ],
  },
  {
    match: /\bchicken stock\b|\bchicken broth\b/i,
    subs: [
      { sub: 'low-sodium chicken broth', reason: 'much less sodium, same flavor base', noImpact: true },
    ],
  },
  {
    match: /\bwhite wine\b/i,
    subs: [
      { sub: 'chicken broth + 1 tsp white wine vinegar', reason: 'alcohol-free, similar acidity', noImpact: false },
    ],
  },
  {
    match: /\bred wine\b/i,
    subs: [
      { sub: 'beef broth + 1 tsp red wine vinegar', reason: 'alcohol-free, similar depth', noImpact: false },
    ],
  },
]

export function getSubstitutions(ingredientName) {
  if (!ingredientName) return []
  for (const entry of ENTRIES) {
    if (entry.match.test(ingredientName)) return entry.subs
  }
  return []
}

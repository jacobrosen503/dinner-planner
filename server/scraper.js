import * as cheerio from 'cheerio'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const FETCH_OPTS = {
  headers: {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Cache-Control': 'no-cache',
  },
  signal: AbortSignal.timeout(15_000),
}

// ---------------------------------------------------------------------------
// JSON-LD extraction
// ---------------------------------------------------------------------------

function findRecipe(data) {
  if (!data) return null
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = findRecipe(item)
      if (r) return r
    }
    return null
  }
  const types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']]
  if (types.includes('Recipe')) return data
  if (data['@graph']) return findRecipe(data['@graph'])
  return null
}

function parseJsonLd(html) {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      const recipe = findRecipe(parsed)
      if (recipe) return recipe
    } catch {}
  }
  return null
}

function textContent(val) {
  if (!val) return ''
  if (typeof val === 'string') return val.replace(/<[^>]+>/g, '').trim()
  if (Array.isArray(val)) return val.map(textContent).filter(Boolean).join('\n\n')
  if (typeof val === 'object' && val.text) return textContent(val.text)
  return String(val).replace(/<[^>]+>/g, '').trim()
}

function parseIngredients(raw) {
  const list = Array.isArray(raw) ? raw : (raw ? [raw] : [])
  return list
    .map(i => {
      const text = textContent(i)
      // Try to split measure from name (rough heuristic)
      const match = text.match(/^([\d¼½¾⅓⅔⅛⅜⅝⅞\s\-–\/\.]+(?:cup|tbsp|tsp|tablespoon|teaspoon|oz|ounce|lb|pound|g|gram|kg|ml|liter|litre|can|package|pkg|bunch|clove|cloves|piece|pieces|slice|slices|handful|pinch|dash|to taste)?s?\.?)\s+(.+)/i)
      if (match) return { measure: match[1].trim(), name: match[2].trim() }
      return { measure: '', name: text }
    })
    .filter(i => i.name)
}

function parseInstructions(raw) {
  if (!raw) return ''
  if (typeof raw === 'string') return raw.replace(/<[^>]+>/g, '').trim()
  if (Array.isArray(raw)) {
    return raw.map(step => {
      if (typeof step === 'string') return step.replace(/<[^>]+>/g, '').trim()
      if (step['@type'] === 'HowToStep') return textContent(step.text || step.name || '')
      if (step['@type'] === 'HowToSection') {
        const steps = Array.isArray(step.itemListElement) ? step.itemListElement : []
        return steps.map(s => textContent(s.text || s.name || '')).join('\n')
      }
      return textContent(step.text || step.name || '')
    }).filter(Boolean).join('\n\n')
  }
  return ''
}

function parseDuration(iso) {
  if (!iso) return null
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return null
  const h = parseInt(match[1] || 0)
  const m = parseInt(match[2] || 0)
  return h * 60 + m || null
}

function normalizeJsonLd(recipe, url) {
  const image = recipe.image
  const imageUrl = Array.isArray(image)
    ? (image[0]?.url || image[0])
    : (typeof image === 'object' ? image.url : image)

  const cuisine = Array.isArray(recipe.recipeCuisine)
    ? recipe.recipeCuisine[0]
    : (recipe.recipeCuisine || '')

  const category = Array.isArray(recipe.recipeCategory)
    ? recipe.recipeCategory[0]
    : (recipe.recipeCategory || '')

  const keywords = typeof recipe.keywords === 'string'
    ? recipe.keywords.split(',').map(k => k.trim()).filter(Boolean)
    : (Array.isArray(recipe.keywords) ? recipe.keywords : [])

  const totalTime = parseDuration(recipe.totalTime) || parseDuration(recipe.cookTime)

  return {
    id: `scraped-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: new URL(url).hostname.replace('www.', ''),
    sourceUrl: url,
    title: textContent(recipe.name),
    image: typeof imageUrl === 'string' ? imageUrl : null,
    category: category || '',
    cuisine: cuisine || '',
    instructions: parseInstructions(recipe.recipeInstructions),
    ingredients: parseIngredients(recipe.recipeIngredient),
    tags: keywords,
    readyInMinutes: totalTime,
    servings: recipe.recipeYield
      ? parseInt(String(Array.isArray(recipe.recipeYield) ? recipe.recipeYield[0] : recipe.recipeYield))
      : null,
    youtubeUrl: null,
  }
}

// ---------------------------------------------------------------------------
// Public: scrape a single URL
// ---------------------------------------------------------------------------

export async function scrapeRecipe(url) {
  const res = await fetch(url, FETCH_OPTS)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const html = await res.text()

  const recipe = parseJsonLd(html)
  if (!recipe) throw new Error('No recipe structured data found on this page')

  return normalizeJsonLd(recipe, url)
}

// ---------------------------------------------------------------------------
// Curated sites for random discovery
// ---------------------------------------------------------------------------

const CURATED_SITES = [
  { name: 'Woks of Life', pages: ['https://thewoksoflife.com/category/recipes/chicken/', 'https://thewoksoflife.com/category/recipes/beef/', 'https://thewoksoflife.com/category/recipes/seafood/'] },
  { name: 'Budget Bytes', pages: ['https://www.budgetbytes.com/category/recipes/chicken/', 'https://www.budgetbytes.com/category/recipes/beef/', 'https://www.budgetbytes.com/category/recipes/pasta/'] },
  { name: 'Minimalist Baker', pages: ['https://minimalistbaker.com/category/entree/', 'https://minimalistbaker.com/category/main-course/'] },
  { name: 'Half Baked Harvest', pages: ['https://www.halfbakedharvest.com/category/main-course/', 'https://www.halfbakedharvest.com/category/chicken/'] },
  { name: 'Pinch of Yum', pages: ['https://pinchofyum.com/category/main-dish'] },
  { name: 'Skinnytaste', pages: ['https://www.skinnytaste.com/category/dinners/'] },
  { name: 'Damn Delicious', pages: ['https://damndelicious.net/category/one-pan-meals/', 'https://damndelicious.net/category/chicken/'] },
  { name: 'Serious Eats', pages: ['https://www.seriouseats.com/quick-easy-weeknight-dinner-recipes'] },
  { name: 'Cookie and Kate', pages: ['https://cookieandkate.com/category/dinner-recipes/'] },
]

// Extract recipe-looking links from a category page
function extractRecipeLinks(html, baseUrl) {
  const $ = cheerio.load(html)
  const host = new URL(baseUrl).hostname
  const links = new Set()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    try {
      const abs = new URL(href, baseUrl).href
      if (!abs.includes(host)) return
      // Heuristic: looks like a recipe page (has a slug, not category/tag/page)
      if (
        /\/\d{4}\//.test(abs) || // date-based WordPress URLs
        abs.split('/').filter(Boolean).length >= 3 // at least 3 path segments
      ) {
        // Exclude obvious non-recipe pages
        if (!/\/(category|tag|author|page|search|about|contact|privacy|shop)\//i.test(abs)) {
          links.add(abs)
        }
      }
    } catch {}
  })

  return [...links]
}

export async function scrapeRandomFromSites() {
  const sites = [...CURATED_SITES].sort(() => Math.random() - 0.5)

  for (const site of sites.slice(0, 4)) {
    const page = site.pages[Math.floor(Math.random() * site.pages.length)]
    try {
      const res = await fetch(page, FETCH_OPTS)
      if (!res.ok) continue
      const html = await res.text()
      const links = extractRecipeLinks(html, page)
      if (links.length === 0) continue

      // Try up to 3 random links from this page
      const shuffled = [...links].sort(() => Math.random() - 0.5)
      for (const link of shuffled.slice(0, 3)) {
        try {
          const recipe = await scrapeRecipe(link)
          return recipe
        } catch {}
      }
    } catch {}
  }

  throw new Error('Could not scrape a recipe from curated sites')
}

import express from 'express'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { scrapeRecipe, scrapeRandomFromSites } from './scraper.js'
import { listSaved, saveRecipe, deleteRecipe, getApprovals, toggleApproval } from './store.js'
import { extractRecipeFromImage } from './vision.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const IS_PROD = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT || 3001

const app = express()
app.use(express.json({ limit: '20mb' })) // large for base64 images

if (!IS_PROD) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
  })
}

// ---------------------------------------------------------------------------
// Recipe scraping
// ---------------------------------------------------------------------------

app.get('/api/recipe', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'url param required' })
  try {
    const recipe = await scrapeRecipe(url)
    res.json(recipe)
  } catch (e) {
    res.status(422).json({ error: e.message })
  }
})

app.get('/api/scrape/random', async (req, res) => {
  try {
    const recipe = await scrapeRandomFromSites()
    res.json(recipe)
  } catch (e) {
    res.status(503).json({ error: e.message })
  }
})

// ---------------------------------------------------------------------------
// Vision (Instagram screenshot)
// ---------------------------------------------------------------------------

app.post('/api/vision/recipe', async (req, res) => {
  const { imageBase64, mimeType } = req.body
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured on server' })
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' })

  try {
    const recipe = await extractRecipeFromImage(imageBase64, mimeType || 'image/jpeg', apiKey)
    res.json(recipe)
  } catch (e) {
    res.status(422).json({ error: e.message })
  }
})

// ---------------------------------------------------------------------------
// Saved recipe library
// ---------------------------------------------------------------------------

app.get('/api/saved', (req, res) => res.json(listSaved()))

app.post('/api/saved', (req, res) => {
  try { res.json(saveRecipe(req.body)) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/saved/:id', (req, res) => {
  deleteRecipe(req.params.id)
  res.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Approvals (thumbs up)
// ---------------------------------------------------------------------------

app.get('/api/approvals/:weekId', (req, res) => {
  res.json(getApprovals(req.params.weekId))
})

app.post('/api/approvals/:weekId/:dayIndex', (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId required' })
  const result = toggleApproval(req.params.weekId, Number(req.params.dayIndex), userId)
  res.json(result)
})

// ---------------------------------------------------------------------------
// Production: serve React build
// ---------------------------------------------------------------------------

if (IS_PROD) {
  const distPath = join(__dir, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`🍳 Server on http://localhost:${PORT} [${IS_PROD ? 'production' : 'development'}]`)
})

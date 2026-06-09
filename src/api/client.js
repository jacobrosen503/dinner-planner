// Client-side calls to the local proxy server

const BASE = '/api'

export async function scrapeUrl(url) {
  const r = await fetch(`${BASE}/recipe?url=${encodeURIComponent(url)}`)
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'Scrape failed')
  return d
}

export async function scrapeRandom() {
  const r = await fetch(`${BASE}/scrape/random`)
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'Scrape failed')
  return d
}

export async function fetchSaved() {
  const r = await fetch(`${BASE}/saved`)
  return r.json()
}

export async function postSaved(recipe) {
  const r = await fetch(`${BASE}/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe),
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'Save failed')
  return d
}

export async function deleteSaved(id) {
  await fetch(`${BASE}/saved/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function fetchAIRecipe({ cuisine, protein, tags = [] }) {
  const r = await fetch(`${BASE}/ai/recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cuisine, protein, tags }),
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'AI recipe generation failed')
  return d
}

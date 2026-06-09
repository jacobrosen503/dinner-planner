import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
// DATA_DIR lets Railway/Render point to a persistent volume (e.g. /data)
const DATA_DIR = process.env.DATA_DIR || __dir
const DB_PATH = join(DATA_DIR, 'recipes-db.json')

function readDb() {
  if (!existsSync(DB_PATH)) return { recipes: [], approvals: {} }
  try {
    const db = JSON.parse(readFileSync(DB_PATH, 'utf-8'))
    if (!db.approvals) db.approvals = {}
    return db
  } catch { return { recipes: [], approvals: {} } }
}

function writeDb(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

export function listSaved() {
  return readDb().recipes
}

export function saveRecipe(recipe) {
  const db = readDb()
  const id = recipe.id || `user-${Date.now()}`
  const entry = { ...recipe, id, savedAt: new Date().toISOString(), source: recipe.source || 'User Added' }
  const idx = db.recipes.findIndex(r => r.id === id)
  if (idx >= 0) db.recipes[idx] = entry
  else db.recipes.unshift(entry)
  writeDb(db)
  return entry
}

export function deleteRecipe(id) {
  const db = readDb()
  db.recipes = db.recipes.filter(r => r.id !== id)
  writeDb(db)
}

// ---------------------------------------------------------------------------
// Approvals: { [weekId]: { [dayIndex]: string[] (userIds) } }
// ---------------------------------------------------------------------------

export function getApprovals(weekId) {
  const db = readDb()
  return db.approvals[weekId] || {}
}

export function toggleApproval(weekId, dayIndex, userId) {
  const db = readDb()
  if (!db.approvals[weekId]) db.approvals[weekId] = {}
  const current = db.approvals[weekId][dayIndex] || []
  if (current.includes(userId)) {
    db.approvals[weekId][dayIndex] = current.filter(id => id !== userId)
  } else {
    db.approvals[weekId][dayIndex] = [...current, userId]
  }
  writeDb(db)
  return db.approvals[weekId]
}

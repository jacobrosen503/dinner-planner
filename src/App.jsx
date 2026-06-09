import { useState, useCallback, useEffect, useRef } from 'react'
import './App.css'
import DaySlot from './components/DaySlot'
import RecipeModal from './components/RecipeModal'
import SettingsPanel from './components/SettingsPanel'
import AddRecipeModal from './components/AddRecipeModal'
import {
  generateWeekPlan, fetchSingleEntree, fetchDifferentCuisine,
  fetchSameCuisineDifferent, fetchSwapProtein, fetchSideDish,
} from './api/recipes'
import { postSaved } from './api/client'
import { countUniqueIngredients } from './utils/shopping'

const DAYS = 7
const LS_SPOON = 'meal-planner-spoon-key'
const LS_OPTS = 'meal-planner-opts'
const LS_WEEK = 'meal-planner-week-id'
const LS_USER = 'meal-planner-user-id'

function loadOpts() {
  try { return JSON.parse(localStorage.getItem(LS_OPTS)) || {} } catch { return {} }
}

function getOrCreateUserId() {
  let id = localStorage.getItem(LS_USER)
  if (!id) {
    id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(LS_USER, id)
  }
  return id
}

function getOrCreateWeekId() {
  let id = localStorage.getItem(LS_WEEK)
  if (!id) {
    id = `w-${Date.now()}`
    localStorage.setItem(LS_WEEK, id)
  }
  return id
}

export default function App() {
  const [meals, setMeals] = useState(Array(DAYS).fill(null))
  const [sides, setSides] = useState(Array(DAYS).fill(null))
  const [loadingAll, setLoadingAll] = useState(false)
  const [loadingDay, setLoadingDay] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [spoonKey, setSpoonKey] = useState(() => localStorage.getItem(LS_SPOON) || '')
  const [generated, setGenerated] = useState(false)
  const [opts, setOpts] = useState(loadOpts)
  const [showAdd, setShowAdd] = useState(false)
  const [pendingUse, setPendingUse] = useState(null)

  // Approval state: { [dayIndex]: string[] }
  const [approvals, setApprovals] = useState({})
  const [weekId, setWeekId] = useState(getOrCreateWeekId)
  const myUserId = useRef(getOrCreateUserId()).current
  const pollRef = useRef(null)

  // ---------- Approval polling ----------
  const fetchApprovals = useCallback(async (wid) => {
    try {
      const r = await fetch(`/api/approvals/${wid}`)
      if (r.ok) setApprovals(await r.json())
    } catch {}
  }, [])

  useEffect(() => {
    if (!generated) return
    fetchApprovals(weekId)
    pollRef.current = setInterval(() => fetchApprovals(weekId), 5000)
    return () => clearInterval(pollRef.current)
  }, [generated, weekId, fetchApprovals])

  const handleToggleApproval = useCallback(async (dayIndex) => {
    try {
      const r = await fetch(`/api/approvals/${weekId}/${dayIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: myUserId }),
      })
      if (r.ok) setApprovals(await r.json())
    } catch {}
  }, [weekId, myUserId])

  // ---------- Week plan ----------
  const planWeek = useCallback(async () => {
    setLoadingAll(true)
    setMeals(Array(DAYS).fill(null))
    setSides(Array(DAYS).fill(null))
    setApprovals({})

    // New weekId clears old approvals
    const newWeekId = `w-${Date.now()}`
    setWeekId(newWeekId)
    localStorage.setItem(LS_WEEK, newWeekId)

    try {
      const entrees = await generateWeekPlan(spoonKey || null, opts)
      const finalEntrees = pendingUse
        ? [pendingUse, ...entrees.filter(e => e.id !== pendingUse.id).slice(0, 6)]
        : entrees
      setMeals(finalEntrees)
      setPendingUse(null)

      const usedIds = new Set(finalEntrees.map(e => e.id))
      const sideResults = await Promise.allSettled(
        finalEntrees.map(e => fetchSideDish(e?.cuisine, usedIds))
      )
      setSides(sideResults.map(r => r.status === 'fulfilled' ? r.value : null))
      setGenerated(true)
    } catch (e) {
      console.error('Plan generation failed:', e)
    } finally {
      setLoadingAll(false)
    }
  }, [spoonKey, opts, pendingUse])

  // ---------- Entree refresh ----------
  const handleRefresh = useCallback(async (dayIndex, type) => {
    setLoadingDay({ index: dayIndex, slot: 'main' })
    const current = meals[dayIndex]
    const excludeIds = meals.filter((m, i) => m && i !== dayIndex).map(m => m.id)
    try {
      let meal = null
      if (type === 'cuisine') meal = await fetchDifferentCuisine(current?.cuisine, spoonKey || null, excludeIds)
      else if (type === 'same-cuisine') meal = await fetchSameCuisineDifferent(current?.cuisine, spoonKey || null, [...excludeIds, current?.id])
      else if (type === 'swap-protein') meal = await fetchSwapProtein(current?.cuisine, current?.category, spoonKey || null, [...excludeIds, current?.id])
      else meal = await fetchSingleEntree(spoonKey || null, excludeIds)

      if (meal) {
        setMeals(prev => { const n = [...prev]; n[dayIndex] = meal; return n })
        const usedIds = new Set(meals.map(m => m?.id).filter(Boolean))
        const side = await fetchSideDish(meal.cuisine, usedIds)
        setSides(prev => { const n = [...prev]; n[dayIndex] = side; return n })
        // Reset approvals for this day
        setApprovals(prev => { const n = { ...prev }; delete n[dayIndex]; return n })
      }
    } catch (e) { console.error('Refresh failed:', e) }
    finally { setLoadingDay(null) }
  }, [meals, spoonKey])

  // ---------- Side swap ----------
  const handleSwapSide = useCallback(async (dayIndex) => {
    setLoadingDay({ index: dayIndex, slot: 'side' })
    try {
      const usedIds = new Set([...meals.map(m => m?.id), ...sides.map(s => s?.id)].filter(Boolean))
      const side = await fetchSideDish(meals[dayIndex]?.cuisine, usedIds)
      setSides(prev => { const n = [...prev]; n[dayIndex] = side; return n })
    } catch (e) { console.error('Side swap failed:', e) }
    finally { setLoadingDay(null) }
  }, [meals, sides])

  // ---------- Settings ----------
  const saveKey = useCallback((key) => {
    setSpoonKey(key)
    if (key) localStorage.setItem(LS_SPOON, key)
    else localStorage.removeItem(LS_SPOON)
  }, [])

  const toggleOpt = useCallback((key) => {
    setOpts(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem(LS_OPTS, JSON.stringify(next))
      return next
    })
  }, [])

  // ---------- Add Recipe ----------
  const handleSaveRecipe = useCallback(async (recipe) => postSaved(recipe), [])
  const handleUseNow = useCallback((recipe) => {
    setPendingUse(recipe)
    if (generated) setMeals(prev => { const n = [...prev]; n[0] = recipe; return n })
  }, [generated])

  const isLoadingMain = i => loadingAll || (loadingDay?.index === i && loadingDay?.slot === 'main')
  const isLoadingSide = i => loadingAll || (loadingDay?.index === i && loadingDay?.slot === 'side')
  const uniqueIngredients = generated && !loadingAll ? countUniqueIngredients(meals) : null
  const totalApproved = Object.values(approvals).filter(a => a.length >= 2).length

  return (
    <div className="min-h-screen" style={{ background: '#0f0f0f' }}>
      <header
        className="sticky top-0 z-30 px-6 py-4 flex items-center gap-4"
        style={{ background: 'rgba(15,15,15,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e1e1e' }}
      >
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-2xl">🍽️</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Dinner Planner</h1>
            <p className="text-xs" style={{ color: '#555' }}>for two</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1">
          {opts.efficientShopping && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium hidden sm:inline-flex" style={{ background: 'rgba(255,107,53,0.12)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.25)' }}>🛒 Efficient Shopping</span>
          )}
          {opts.goodLeftovers && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium hidden sm:inline-flex" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>🍱 Good Leftovers</span>
          )}
          {generated && totalApproved > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium hidden sm:inline-flex" style={{ background: 'rgba(22,163,74,0.12)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.25)' }}>✓ {totalApproved}/7 agreed</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
            style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a' }}>
            + Add Recipe
          </button>
          <SettingsPanel spoonacularKey={spoonKey} onSave={saveKey} efficientShopping={!!opts.efficientShopping} goodLeftovers={!!opts.goodLeftovers} onToggle={toggleOpt} />
          <button onClick={planWeek} disabled={loadingAll}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: '#ff6b35', color: '#fff' }}>
            {loadingAll
              ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" /> Planning…</>
              : generated ? '↺ Replan' : '✨ Plan My Week'}
          </button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {!generated && !loadingAll ? (
          <HeroEmpty onPlan={planWeek} opts={opts} onToggle={toggleOpt} onAdd={() => setShowAdd(true)} />
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">This Week's Dinners</h2>
              <p className="text-sm mt-0.5" style={{ color: '#555' }}>
                {spoonKey ? 'TheMealDB + Spoonacular' : 'TheMealDB'}
                {uniqueIngredients ? ` · ${uniqueIngredients} unique ingredients` : ''}
                {' · 👍 approve meals · ✓ = both agreed'}
              </p>
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
              {Array.from({ length: DAYS }, (_, i) => (
                <DaySlot key={i} dayIndex={i}
                  meal={meals[i]} side={sides[i]}
                  loadingMeal={isLoadingMain(i)} loadingSide={isLoadingSide(i)}
                  onRefresh={handleRefresh} onSwapSide={handleSwapSide} onView={setSelectedMeal}
                  approvals={approvals[i] || []} myUserId={myUserId}
                  onToggleApproval={handleToggleApproval}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {selectedMeal && <RecipeModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />}
      {showAdd && <AddRecipeModal onClose={() => setShowAdd(false)} onSave={handleSaveRecipe} onUseNow={handleUseNow} />}
    </div>
  )
}

function HeroEmpty({ onPlan, opts, onToggle, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-6">🍳</div>
      <h2 className="text-3xl font-bold text-white mb-3">What's for dinner this week?</h2>
      <p className="text-base mb-8 max-w-md" style={{ color: '#666' }}>
        7 entrees + vegetable sides, sourced from APIs, food blogs, and Instagram. Both of you approve each meal with 👍.
      </p>
      <div className="flex gap-3 mb-8">
        <HeroToggle label="Efficient Shopping" emoji="🛒" desc="Fewer unique ingredients" active={!!opts.efficientShopping} onToggle={() => onToggle('efficientShopping')} />
        <HeroToggle label="Good Leftovers" emoji="🍱" desc="Reheats well" active={!!opts.goodLeftovers} onToggle={() => onToggle('goodLeftovers')} />
      </div>
      <div className="flex gap-3">
        <button onClick={onPlan} className="px-8 py-4 rounded-2xl font-bold text-lg cursor-pointer"
          style={{ background: '#ff6b35', color: '#fff', boxShadow: '0 0 40px rgba(255,107,53,0.3)' }}>
          ✨ Plan My Week
        </button>
        <button onClick={onAdd} className="px-6 py-4 rounded-2xl font-semibold text-base cursor-pointer"
          style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a' }}>
          + Add Recipe
        </button>
      </div>
      <p className="mt-4 text-xs" style={{ color: '#444' }}>Add a Spoonacular key in ⚙️ Settings for thousands more recipes</p>
    </div>
  )
}

function HeroToggle({ label, emoji, desc, active, onToggle }) {
  return (
    <button onClick={onToggle} className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl cursor-pointer"
      style={{ background: active ? 'rgba(255,107,53,0.12)' : '#1a1a1a', border: `1px solid ${active ? '#ff6b35' : '#2a2a2a'}` }}>
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-semibold" style={{ color: active ? '#ff6b35' : '#ccc' }}>{label}</span>
      <span className="text-xs" style={{ color: '#555' }}>{desc}</span>
    </button>
  )
}

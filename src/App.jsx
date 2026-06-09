import { useState, useCallback } from 'react'
import './App.css'
import MealCard from './components/MealCard'
import RecipeModal from './components/RecipeModal'
import SettingsPanel from './components/SettingsPanel'
import { generateWeekPlan, fetchSingleMeal } from './api/recipes'

const DAYS = 7
const LS_KEY = 'meal-planner-spoon-key'

export default function App() {
  const [meals, setMeals] = useState(Array(DAYS).fill(null))
  const [loadingAll, setLoadingAll] = useState(false)
  const [loadingDay, setLoadingDay] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [spoonacularKey, setSpoonacularKey] = useState(() => localStorage.getItem(LS_KEY) || '')
  const [generated, setGenerated] = useState(false)

  const planWeek = useCallback(async () => {
    setLoadingAll(true)
    setMeals(Array(DAYS).fill(null))
    try {
      const plan = await generateWeekPlan(spoonacularKey || null)
      setMeals(plan)
      setGenerated(true)
    } catch (e) {
      console.error('Failed to generate plan:', e)
    } finally {
      setLoadingAll(false)
    }
  }, [spoonacularKey])

  const swapMeal = useCallback(async (dayIndex) => {
    setLoadingDay(dayIndex)
    try {
      const currentCategories = meals
        .filter((m, i) => m && i !== dayIndex)
        .map(m => m.category)
        .filter(Boolean)
      const meal = await fetchSingleMeal(spoonacularKey || null, currentCategories)
      setMeals(prev => {
        const next = [...prev]
        next[dayIndex] = meal
        return next
      })
    } catch (e) {
      console.error('Failed to swap meal:', e)
    } finally {
      setLoadingDay(null)
    }
  }, [meals, spoonacularKey])

  const saveKey = useCallback((key) => {
    setSpoonacularKey(key)
    if (key) localStorage.setItem(LS_KEY, key)
    else localStorage.removeItem(LS_KEY)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#0f0f0f' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(15,15,15,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e1e1e' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Dinner Planner</h1>
            <p className="text-xs" style={{ color: '#555' }}>for two</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SettingsPanel spoonacularKey={spoonacularKey} onSave={saveKey} />
          <button
            onClick={planWeek}
            disabled={loadingAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: '#ff6b35', color: '#fff' }}
          >
            {loadingAll ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                Planning…
              </>
            ) : generated ? (
              '↺ Replan Week'
            ) : (
              '✨ Plan My Week'
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {!generated && !loadingAll ? (
          <HeroEmpty onPlan={planWeek} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">This Week's Dinners</h2>
                <p className="text-sm mt-0.5" style={{ color: '#555' }}>
                  {spoonacularKey ? 'Drawing from TheMealDB + Spoonacular' : 'Drawing from TheMealDB'} · Click ↻ to swap any meal
                </p>
              </div>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {Array.from({ length: DAYS }, (_, i) => (
                <MealCard
                  key={i}
                  dayIndex={i}
                  meal={meals[i]}
                  loading={loadingAll || loadingDay === i}
                  onSwap={swapMeal}
                  onView={setSelectedMeal}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Recipe detail modal */}
      {selectedMeal && (
        <RecipeModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
      )}
    </div>
  )
}

function HeroEmpty({ onPlan }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-6">🍳</div>
      <h2 className="text-3xl font-bold text-white mb-3">What's for dinner this week?</h2>
      <p className="text-base mb-8 max-w-md" style={{ color: '#666' }}>
        We'll pull from thousands of recipes across global cuisines — Italian, Thai, Mexican, Japanese, and more — to plan 7 unique dinners for you and your girlfriend.
      </p>
      <button
        onClick={onPlan}
        className="px-8 py-4 rounded-2xl font-bold text-lg cursor-pointer transition-all"
        style={{ background: '#ff6b35', color: '#fff', boxShadow: '0 0 40px rgba(255,107,53,0.3)' }}
      >
        ✨ Plan My Week
      </button>
      <p className="mt-4 text-xs" style={{ color: '#444' }}>
        Add a Spoonacular key in Settings for an even larger selection
      </p>
    </div>
  )
}

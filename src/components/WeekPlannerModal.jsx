import { useState } from 'react'
import { ALL_AREAS } from '../api/recipes'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const PROTEINS = ['Any', 'Beef', 'Chicken', 'Pork', 'Lamb', 'Fish', 'Shrimp', 'Shellfish', 'Tofu', 'Vegetarian', 'Vegan']

const CUISINES = ['Any', ...ALL_AREAS.sort()]

const SPECIAL_TAGS = [
  { key: 'quick',        label: '⚡ Quick',          desc: 'Under 30 min' },
  { key: 'leftovers',   label: '🍱 Good Leftovers',  desc: 'Reheats well' },
  { key: 'highProtein', label: '💪 High Protein',     desc: 'Meat-forward' },
  { key: 'onePot',      label: '🥘 One Pot',          desc: 'Minimal cleanup' },
]

export const EMPTY_DAY_PLAN = { protein: 'Any', cuisine: 'Any', tags: [] }

function emptyWeek() {
  return Array.from({ length: 7 }, () => ({ ...EMPTY_DAY_PLAN, tags: [] }))
}

export default function WeekPlannerModal({ initial, onClose, onBuild }) {
  const [plans, setPlans] = useState(() => {
    if (initial && initial.length === 7) return initial.map(p => ({ ...EMPTY_DAY_PLAN, ...p, tags: p.tags || [] }))
    return emptyWeek()
  })

  const setDay = (i, field, value) =>
    setPlans(prev => prev.map((p, j) => j === i ? { ...p, [field]: value } : p))

  const toggleTag = (i, tag) =>
    setPlans(prev => prev.map((p, j) => {
      if (j !== i) return p
      const has = p.tags.includes(tag)
      return { ...p, tags: has ? p.tags.filter(t => t !== tag) : [...p.tags, tag] }
    }))

  const clearAll = () => setPlans(emptyWeek())

  const hasAnyConstraint = plans.some(p => p.protein !== 'Any' || p.cuisine !== 'Any' || p.tags.length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full rounded-2xl flex flex-col overflow-hidden"
        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', maxHeight: '90vh', maxWidth: 740 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <div>
            <h2 className="text-lg font-bold text-white">Configure Your Week</h2>
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>
              Set preferences per day — leave any field as "Any" to get a random pick.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-sm ml-4 shrink-0" style={{ background: '#2a2a2a', color: '#aaa' }}>✕</button>
        </div>

        {/* Day rows */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
          {DAYS.map((day, i) => (
            <DayRow
              key={day}
              day={day}
              plan={plans[i]}
              onProtein={v => setDay(i, 'protein', v)}
              onCuisine={v => setDay(i, 'cuisine', v)}
              onToggleTag={tag => toggleTag(i, tag)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid #2a2a2a' }}>
          <button
            onClick={clearAll}
            disabled={!hasAnyConstraint}
            className="px-4 py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-30"
            style={{ background: '#2a2a2a', color: '#888' }}
          >
            Clear All
          </button>
          <button
            onClick={() => { onBuild(plans); onClose() }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
            style={{ background: '#ff6b35', color: '#fff' }}
          >
            ✨ Build Plan
          </button>
        </div>
      </div>
    </div>
  )
}

function DayRow({ day, plan, onProtein, onCuisine, onToggleTag }) {
  const isConfigured = plan.protein !== 'Any' || plan.cuisine !== 'Any' || plan.tags.length > 0

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: isConfigured ? 'rgba(255,107,53,0.05)' : '#141414',
        border: `1px solid ${isConfigured ? 'rgba(255,107,53,0.2)' : '#222'}`,
      }}
    >
      {/* Day label */}
      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: isConfigured ? '#ff6b35' : '#555' }}>
        {day}
      </div>

      <div className="space-y-2.5">
        {/* Protein chips */}
        <div>
          <div className="text-xs mb-1.5" style={{ color: '#555' }}>Protein</div>
          <div className="flex flex-wrap gap-1.5">
            {PROTEINS.map(p => (
              <button
                key={p}
                onClick={() => onProtein(p)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all"
                style={{
                  background: plan.protein === p ? (p === 'Any' ? '#2a2a2a' : '#ff6b35') : '#0f0f0f',
                  color: plan.protein === p ? (p === 'Any' ? '#aaa' : '#fff') : '#555',
                  border: `1px solid ${plan.protein === p ? (p === 'Any' ? '#3a3a3a' : '#ff6b35') : '#222'}`,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine + Special tags row */}
        <div className="flex flex-wrap gap-3 items-start">
          <div>
            <div className="text-xs mb-1.5" style={{ color: '#555' }}>Cuisine</div>
            <select
              value={plan.cuisine}
              onChange={e => onCuisine(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs cursor-pointer outline-none"
              style={{ background: plan.cuisine !== 'Any' ? 'rgba(255,107,53,0.15)' : '#0f0f0f', color: plan.cuisine !== 'Any' ? '#ff6b35' : '#888', border: `1px solid ${plan.cuisine !== 'Any' ? '#ff6b3566' : '#222'}` }}
            >
              {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex-1">
            <div className="text-xs mb-1.5" style={{ color: '#555' }}>Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {SPECIAL_TAGS.map(t => {
                const active = plan.tags.includes(t.key)
                return (
                  <button
                    key={t.key}
                    onClick={() => onToggleTag(t.key)}
                    className="px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-all"
                    title={t.desc}
                    style={{
                      background: active ? 'rgba(255,107,53,0.15)' : '#0f0f0f',
                      color: active ? '#ff6b35' : '#555',
                      border: `1px solid ${active ? '#ff6b3566' : '#222'}`,
                    }}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

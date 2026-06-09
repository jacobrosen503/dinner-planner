import { useState } from 'react'
import { estimateMacros } from '../utils/macros'

export default function MacroPanel({ meal }) {
  const [open, setOpen] = useState(false)
  if (!meal) return null

  const macros = estimateMacros(meal)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Macro breakdown"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer"
        style={{ background: open ? '#333' : '#2a2a2a', color: '#aaa' }}
      >
        📊
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-52 rounded-xl p-4 z-20"
          style={{ background: '#1e1e1e', border: '1px solid #333', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
        >
          <div className="text-xs font-semibold mb-3 flex items-center justify-between">
            <span className="text-white">Per serving</span>
            {macros.estimated && (
              <span style={{ color: '#555' }}>est.</span>
            )}
          </div>

          <MacroBar label="Calories" value={macros.cal} unit="kcal" color="#ff6b35" max={900} />
          <MacroBar label="Protein" value={macros.protein} unit="g" color="#4ade80" max={60} />
          <MacroBar label="Carbs" value={macros.carbs} unit="g" color="#facc15" max={100} />
          <MacroBar label="Fat" value={macros.fat} unit="g" color="#f472b6" max={60} />

          {macros.estimated && (
            <p className="text-xs mt-3" style={{ color: '#555' }}>
              Estimates based on recipe category. Add a nutrition API key in Settings for exact values.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function MacroBar({ label, value, unit, color, max }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: '#aaa' }}>{label}</span>
        <span className="font-medium" style={{ color }}>{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

import { useState } from 'react'

export default function SettingsPanel({ spoonacularKey, onSave, efficientShopping, goodLeftovers, onToggle }) {
  const [key, setKey] = useState(spoonacularKey || '')
  const [show, setShow] = useState(false)

  const handleSave = () => {
    onSave(key.trim())
    setShow(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShow(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm cursor-pointer"
        style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a' }}
      >
        <span>⚙️</span>
        <span>Settings</span>
        {(spoonacularKey || efficientShopping || goodLeftovers) && (
          <span className="w-2 h-2 rounded-full" style={{ background: '#4ade80' }} />
        )}
      </button>

      {show && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl p-5 z-40"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
        >
          {/* Toggles */}
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#ff6b35' }}>
            Planning Mode
          </h3>

          <Toggle
            label="Efficient Shopping"
            desc="Minimize unique ingredients across the week — great for keeping the grocery bill low."
            emoji="🛒"
            active={efficientShopping}
            onChange={() => onToggle('efficientShopping')}
          />
          <Toggle
            label="Good Leftovers"
            desc="Prioritize dishes that reheat well — curries, stews, bakes, and braises."
            emoji="🍱"
            active={goodLeftovers}
            onChange={() => onToggle('goodLeftovers')}
          />

          <div className="my-4" style={{ borderTop: '1px solid #2a2a2a' }} />

          {/* API keys */}
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#ff6b35' }}>
            API Keys
          </h3>
          <p className="text-xs mb-3" style={{ color: '#555' }}>
            Add a Spoonacular key to unlock 5,000+ more recipes. Free tier at spoonacular.com.
          </p>

          <label className="block text-xs font-medium mb-1" style={{ color: '#aaa' }}>
            Spoonacular API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Enter your key…"
            className="w-full rounded-xl px-3 py-2 text-sm mb-4 outline-none"
            style={{ background: '#0f0f0f', border: '1px solid #333', color: '#fff' }}
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 rounded-xl text-sm font-medium cursor-pointer"
              style={{ background: '#ff6b35', color: '#fff' }}
            >
              Save
            </button>
            <button
              onClick={() => setShow(false)}
              className="flex-1 py-2 rounded-xl text-sm cursor-pointer"
              style={{ background: '#2a2a2a', color: '#aaa' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ label, desc, emoji, active, onChange }) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-start gap-3 mb-3 p-3 rounded-xl text-left cursor-pointer transition-all"
      style={{
        background: active ? 'rgba(255,107,53,0.1)' : '#0f0f0f',
        border: `1px solid ${active ? '#ff6b3566' : '#2a2a2a'}`,
      }}
    >
      <span className="text-xl mt-0.5">{emoji}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: active ? '#ff6b35' : '#ccc' }}>
            {label}
          </span>
          <span
            className="w-8 h-4 rounded-full flex items-center transition-all relative"
            style={{ background: active ? '#ff6b35' : '#333' }}
          >
            <span
              className="absolute w-3 h-3 rounded-full bg-white transition-all"
              style={{ left: active ? '18px' : '2px' }}
            />
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: '#555' }}>{desc}</p>
      </div>
    </button>
  )
}

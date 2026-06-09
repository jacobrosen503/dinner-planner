import { useState } from 'react'

export default function SettingsPanel({ spoonacularKey, onSave }) {
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
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm cursor-pointer transition-all"
        style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a' }}
      >
        <span>⚙️</span>
        <span>Settings</span>
        {spoonacularKey && <span className="w-2 h-2 rounded-full" style={{ background: '#4ade80' }} />}
      </button>

      {show && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl p-5 z-40"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
        >
          <h3 className="font-semibold text-white mb-1">API Keys</h3>
          <p className="text-xs mb-4" style={{ color: '#666' }}>
            Add a Spoonacular API key to unlock 5000+ additional recipes. Free tier available at spoonacular.com.
          </p>

          <label className="block text-xs font-medium mb-1" style={{ color: '#aaa' }}>
            Spoonacular API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Enter your API key..."
            className="w-full rounded-xl px-3 py-2 text-sm mb-3 outline-none"
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
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

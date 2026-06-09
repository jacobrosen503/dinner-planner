import { useEffect, useRef, useState } from 'react'

const OPTIONS = [
  {
    key: 'cuisine',
    label: 'New cuisine',
    desc: 'Completely different country',
    icon: '🌍',
  },
  {
    key: 'same-cuisine',
    label: 'Same cuisine',
    desc: 'Different dish, same origin',
    icon: '🔄',
  },
  {
    key: 'swap-protein',
    label: 'Swap protein',
    desc: 'Different main protein, same cuisine',
    icon: '🥩',
  },
]

export default function RefreshMenu({ onSelect, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={disabled}
        title="Refresh options"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: open ? '#333' : '#2a2a2a', color: '#aaa' }}
      >
        ↻
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-52 rounded-xl overflow-hidden z-20"
          style={{ background: '#1e1e1e', border: '1px solid #333', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
        >
          {OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => {
                setOpen(false)
                onSelect(opt.key)
              }}
              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
              style={{ borderBottom: '1px solid #2a2a2a' }}
              onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="text-lg mt-0.5">{opt.icon}</span>
              <div>
                <div className="text-sm font-medium text-white">{opt.label}</div>
                <div className="text-xs mt-0.5" style={{ color: '#666' }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

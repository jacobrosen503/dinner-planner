import { computeTags } from '../utils/tags'

export default function SideCard({ meal, loading, onView, onSwap }) {
  const tags = meal && !loading ? computeTags(meal).slice(0, 2) : []

  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 mt-2"
      style={{ background: '#141414', border: '1px solid #222' }}
    >
      {/* Small image */}
      <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden" style={{ background: '#222' }}>
        {loading ? (
          <div className="w-full h-full animate-pulse" style={{ background: '#2a2a2a' }} />
        ) : meal?.image ? (
          <img src={meal.image} alt={meal.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🥗</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold mb-0.5" style={{ color: '#4ade80' }}>
          Suggested Side
        </div>
        {loading ? (
          <div className="h-4 rounded animate-pulse w-32" style={{ background: '#2a2a2a' }} />
        ) : (
          <div className="text-sm font-medium text-white truncate">{meal?.title || '—'}</div>
        )}
        {tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {tags.map(t => (
              <span key={t.label} className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${t.color}22`, color: t.color }}>
                {t.icon} {t.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        {meal && !loading && (
          <button
            onClick={() => onView(meal)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
            style={{ background: '#1e1e1e', color: '#aaa', border: '1px solid #2a2a2a' }}
          >
            View
          </button>
        )}
        <button
          onClick={onSwap}
          disabled={loading}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm cursor-pointer disabled:opacity-30"
          style={{ background: '#1e1e1e', color: '#666', border: '1px solid #2a2a2a' }}
          title="Swap side dish"
        >
          ↻
        </button>
      </div>
    </div>
  )
}

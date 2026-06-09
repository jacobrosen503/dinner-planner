import { useEffect } from 'react'

export default function RecipeModal({ meal, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!meal) return null

  const steps = meal.instructions
    ? meal.instructions
        .split(/\r?\n+/)
        .map(s => s.trim())
        .filter(s =>
          s.length > 0 &&
          // Drop bare "step N" / "STEP N:" labels — we number steps ourselves
          !/^step\s*\d+[.:)]*$/i.test(s) &&
          // Drop lone numbers like "1." or "(2)"
          !/^\(?\d+[.)]\)?$/.test(s)
        )
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#1a1a1a', maxHeight: '90vh' }}
      >
        {/* Hero image */}
        {meal.image && (
          <div className="relative h-56 shrink-0">
            <img src={meal.image} alt={meal.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #1a1a1a 0%, transparent 60%)' }} />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          ✕
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">{meal.title}</h2>

          <div className="flex flex-wrap gap-2 mb-5">
            {meal.cuisine && (
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#ff6b35', color: '#fff' }}>
                {meal.cuisine}
              </span>
            )}
            {meal.category && (
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#2a2a2a', color: '#ccc' }}>
                {meal.category}
              </span>
            )}
            {meal.readyInMinutes && (
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#2a2a2a', color: '#ccc' }}>
                ⏱ {meal.readyInMinutes} min
              </span>
            )}
            {meal.servings && (
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#2a2a2a', color: '#ccc' }}>
                👤 {meal.servings} servings
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#2a2a2a', color: '#888' }}>
              via {meal.source}
            </span>
          </div>

          {/* Ingredients */}
          {meal.ingredients.length > 0 && (
            <section className="mb-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#ff6b35' }}>
                Ingredients
              </h3>
              <ul className="grid grid-cols-2 gap-1">
                {meal.ingredients.map((ing, i) => (
                  <li key={i} className="flex gap-2 text-sm py-1" style={{ borderBottom: '1px solid #2a2a2a', color: '#e0e0e0' }}>
                    <span className="font-medium shrink-0" style={{ color: '#fff' }}>{ing.measure}</span>
                    <span>{ing.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Instructions */}
          {steps.length > 0 && (
            <section className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#ff6b35' }}>
                Instructions
              </h3>
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm" style={{ color: '#ccc' }}>
                    <span
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: '#ff6b35', color: '#fff' }}
                    >
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* External links */}
          <div className="flex gap-3 pt-2">
            {meal.sourceUrl && (
              <a
                href={meal.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-4 py-2 rounded-lg font-medium"
                style={{ background: '#ff6b35', color: '#fff', textDecoration: 'none' }}
              >
                Full Recipe ↗
              </a>
            )}
            {meal.youtubeUrl && (
              <a
                href={meal.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-4 py-2 rounded-lg font-medium"
                style={{ background: '#2a2a2a', color: '#fff', textDecoration: 'none' }}
              >
                ▶ Watch
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

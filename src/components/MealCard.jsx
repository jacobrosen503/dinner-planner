const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function MealCard({ dayIndex, meal, loading, onSwap, onView }) {
  const day = DAYS[dayIndex]

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
    >
      {/* Day label */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#ff6b35' }}>
          {day}
        </span>
        {meal && !loading && (
          <span className="text-xs" style={{ color: '#555' }}>
            {meal.source}
          </span>
        )}
      </div>

      {/* Image area */}
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        {loading ? (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#222' }}>
            <LoadingSpinner />
          </div>
        ) : meal?.image ? (
          <img
            src={meal.image}
            alt={meal.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: '#222' }}>
            🍽️
          </div>
        )}

        {/* Cuisine badge */}
        {!loading && meal?.cuisine && (
          <span
            className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(0,0,0,0.75)', color: '#fff', backdropFilter: 'blur(4px)' }}
          >
            {meal.cuisine}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {loading ? (
          <div className="flex-1 space-y-2">
            <div className="h-5 rounded-lg animate-pulse" style={{ background: '#2a2a2a', width: '80%' }} />
            <div className="h-4 rounded-lg animate-pulse" style={{ background: '#2a2a2a', width: '50%' }} />
          </div>
        ) : meal ? (
          <>
            <h3 className="font-semibold text-white leading-tight mb-2 line-clamp-2" style={{ fontSize: 15 }}>
              {meal.title}
            </h3>
            <div className="flex flex-wrap gap-1 mb-3">
              {meal.category && (
                <span className="px-2 py-0.5 rounded text-xs" style={{ background: '#2a2a2a', color: '#999' }}>
                  {meal.category}
                </span>
              )}
              {meal.readyInMinutes && (
                <span className="px-2 py-0.5 rounded text-xs" style={{ background: '#2a2a2a', color: '#999' }}>
                  ⏱ {meal.readyInMinutes}m
                </span>
              )}
              {meal.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded text-xs" style={{ background: '#2a2a2a', color: '#999' }}>
                  {tag}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: '#555' }}>No meal planned</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={() => meal && onView(meal)}
            disabled={loading || !meal}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#ff6b35', color: '#fff' }}
          >
            View Recipe
          </button>
          <button
            onClick={() => onSwap(dayIndex)}
            disabled={loading}
            className="px-3 py-2 rounded-xl text-sm transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#2a2a2a', color: '#aaa' }}
            title="Get different meal"
          >
            ↻
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div
      className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
      style={{ borderColor: '#ff6b35', borderTopColor: 'transparent' }}
    />
  )
}

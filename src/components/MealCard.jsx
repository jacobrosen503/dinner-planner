import { computeTags } from '../utils/tags'
import RefreshMenu from './RefreshMenu'
import MacroPanel from './MacroPanel'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function MealCard({ dayIndex, meal, loading, onRefresh, onView }) {
  const day = DAYS[dayIndex]
  const tags = meal && !loading ? computeTags(meal) : []

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
          <span className="text-xs" style={{ color: '#444' }}>
            {meal.source}
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 176 }}>
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

        {/* Cuisine pill */}
        {!loading && meal?.cuisine && (
          <span
            className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', backdropFilter: 'blur(6px)' }}
          >
            {meal.cuisine}
          </span>
        )}

        {/* AI badge */}
        {!loading && meal?.aiGenerated && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(167,139,250,0.85)', color: '#fff', backdropFilter: 'blur(6px)' }}
          >
            ✨ AI
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {loading ? (
          <div className="flex-1 space-y-2">
            <div className="h-5 rounded-lg animate-pulse" style={{ background: '#2a2a2a', width: '80%' }} />
            <div className="h-4 rounded-lg animate-pulse" style={{ background: '#2a2a2a', width: '55%' }} />
            <div className="flex gap-1 mt-3">
              {[60, 80, 50].map(w => (
                <div key={w} className="h-5 rounded animate-pulse" style={{ background: '#2a2a2a', width: w }} />
              ))}
            </div>
          </div>
        ) : meal ? (
          <>
            <h3 className="font-semibold text-white leading-snug mb-3 line-clamp-2" style={{ fontSize: 15 }}>
              {meal.title}
            </h3>

            {/* Tags row */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {meal.category && (
                <Tag label={meal.category} color="#2a2a2a" textColor="#888" />
              )}
              {meal.readyInMinutes && (
                <Tag label={`⏱ ${meal.readyInMinutes}m`} color="#2a2a2a" textColor="#888" />
              )}
              {tags.map(tag => (
                <Tag
                  key={tag.label}
                  label={`${tag.icon} ${tag.label}`}
                  color={`${tag.color}22`}
                  textColor={tag.color}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: '#555' }}>No meal planned</p>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            onClick={() => meal && onView(meal)}
            disabled={loading || !meal}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#ff6b35', color: '#fff' }}
          >
            View Recipe
          </button>

          <MacroPanel meal={!loading ? meal : null} />

          <RefreshMenu
            disabled={loading || !meal}
            onSelect={(type) => onRefresh(dayIndex, type)}
          />
        </div>
      </div>
    </div>
  )
}

function Tag({ label, color, textColor }) {
  return (
    <span
      className="px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: color, color: textColor }}
    >
      {label}
    </span>
  )
}

function LoadingSpinner() {
  return (
    <div
      className="w-8 h-8 rounded-full border-2 animate-spin"
      style={{ borderColor: '#ff6b35', borderTopColor: 'transparent' }}
    />
  )
}

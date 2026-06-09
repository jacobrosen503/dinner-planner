import MealCard from './MealCard'
import SideCard from './SideCard'
import ApprovalButtons from './ApprovalButtons'

export default function DaySlot({
  dayIndex, meal, side,
  loadingMeal, loadingSide,
  onRefresh, onSwapSide, onView,
  approvals, myUserId, onToggleApproval,
}) {
  const bothApproved = (approvals || []).length >= 2

  return (
    <div className="flex flex-col">
      <div className="relative">
        {/* Green glow border when both approved */}
        {bothApproved && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-10"
            style={{ border: '2px solid #16a34a', boxShadow: '0 0 16px rgba(22,163,74,0.3)' }}
          />
        )}
        <MealCard
          dayIndex={dayIndex}
          meal={meal}
          loading={loadingMeal}
          onRefresh={onRefresh}
          onView={onView}
        />
      </div>

      {/* Approval bar */}
      <div className="flex items-center justify-end px-1 py-1.5">
        <ApprovalButtons
          dayIndex={dayIndex}
          approvals={approvals || []}
          myUserId={myUserId}
          onToggle={() => onToggleApproval(dayIndex)}
          loading={loadingMeal}
        />
      </div>

      <SideCard
        meal={side}
        loading={loadingSide}
        onView={onView}
        onSwap={() => onSwapSide(dayIndex)}
      />
    </div>
  )
}

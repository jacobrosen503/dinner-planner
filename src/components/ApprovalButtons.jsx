// Two-person approval system.
// Each device has a stable UUID (localStorage). Two unique approvals = green checkmark.

const BOTH_APPROVED_THRESHOLD = 2

export default function ApprovalButtons({ dayIndex, approvals = [], myUserId, onToggle, loading }) {
  const iApproved = approvals.includes(myUserId)
  const count = approvals.length
  const bothApproved = count >= BOTH_APPROVED_THRESHOLD

  if (bothApproved) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
        style={{ background: '#16a34a22', border: '2px solid #16a34a', color: '#4ade80' }}
        title="Both approved — click to withdraw your approval"
      >
        <span className="text-base">✓</span>
        <span>Both approved!</span>
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all disabled:opacity-30"
      style={{
        background: iApproved ? '#ff6b3522' : '#1a1a1a',
        border: `1px solid ${iApproved ? '#ff6b35' : '#333'}`,
        color: iApproved ? '#ff6b35' : '#666',
      }}
      title={iApproved ? 'Withdraw your approval' : 'Approve this meal'}
    >
      <span className="text-base">👍</span>
      {count > 0 && <span>{count}/2</span>}
    </button>
  )
}

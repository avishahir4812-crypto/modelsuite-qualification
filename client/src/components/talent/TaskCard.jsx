import { useState } from 'react';
import { claimTask } from '../../api/talent';

const STATUS_CLASS = {
  Open:      'status-badge-Open',
  Claimed:   'status-badge-Claimed',
  Submitted: 'status-badge-Submitted',
  Approved:  'status-badge-Approved',
  Rejected:  'status-badge-Rejected',
};

const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 animate-spin">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** Human-readable due-date label plus an "urgent" flag. */
const getDueInfo = (dueDate) => {
  if (!dueDate) return null;
  const target = new Date(dueDate);
  if (isNaN(target.getTime())) return { label: dueDate, urgent: false, diffDays: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target0 = new Date(target);
  target0.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target0 - today) / 86400000);

  if (diffDays < 0) return { label: 'Overdue', urgent: true, diffDays };
  if (diffDays === 0) return { label: 'Due today', urgent: true, diffDays };
  if (diffDays === 1) return { label: 'Due tomorrow', urgent: true, diffDays };
  return { label: `Due in ${diffDays} days`, urgent: false, diffDays };
};

/** 0 (plenty of time) -> 1 (overdue) urgency reading, capped to a 14-day window. */
const getUrgencyLevel = (diffDays) => {
  if (diffDays === null || diffDays === undefined) return null;
  const pct = Math.min(1, Math.max(0, 1 - diffDays / 14));
  if (pct >= 0.75) return { pct, color: 'bg-red-500' };
  if (pct >= 0.4) return { pct, color: 'bg-amber-500' };
  return { pct, color: 'bg-emerald-500' };
};

const TaskCard = ({ task, showClaimButton = false, onClaimed, index = 0 }) => {
  const [claimState, setClaimState] = useState('idle'); // idle | claiming | claimed

  const handleClaim = async () => {
    if (claimState !== 'idle') return;
    setClaimState('claiming');
    try {
      await claimTask(task._id);
      setClaimState('claimed');
      setTimeout(() => { if (onClaimed) onClaimed(); }, 550);
    } catch (err) {
      setClaimState('idle');
      alert(err.response?.data?.message || 'Failed to claim task');
    }
  };

  const due = getDueInfo(task.dueDate);
  const urgency = due ? getUrgencyLevel(due.diffDays) : null;
  const posterInitial = task.createdBy?.name ? task.createdBy.name.charAt(0).toUpperCase() : null;

  return (
    <div
      className="relative h-full flex flex-col bg-bg-card border border-border rounded-xl overflow-hidden gap-3 transition-all duration-300 ease-out hover:border-border-light hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 opacity-0 animate-[taskCardIn_0.45s_ease_both]"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      {/* Deadline urgency strip */}
      {urgency && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-border/60">
          <div
            className={`h-full transition-all duration-700 ease-out ${urgency.color}`}
            style={{ width: `${urgency.pct * 100}%` }}
          />
        </div>
      )}

      <div className="p-5 pt-6 flex flex-col gap-3 flex-1">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-text-primary leading-snug line-clamp-2">
            {task.title || 'Untitled Task'}
          </h3>
          {task.status && (
            <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold tracking-[0.3px] ${STATUS_CLASS[task.status] || ''}`}>
              {task.status === 'Open' && (
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-current opacity-60 animate-ping" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-current" />
                </span>
              )}
              {task.status}
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-[13px] text-text-muted leading-relaxed line-clamp-3">
            {task.description}
          </p>
        )}
      </div>

      {/* Meta footer */}
      <div className="px-5 pb-5 flex flex-col gap-3">
        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          <div className={`flex items-center gap-1.5 text-[12px] ${due?.urgent ? 'text-red-500 font-medium' : 'text-text-faint'}`}>
            <CalendarIcon />
            <span>{due ? due.label : 'No due date'}</span>
          </div>

          {task.createdBy?.name && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-5 h-5 rounded-full border border-border-light flex items-center justify-center text-[9px] font-semibold text-text-muted shrink-0">
                {posterInitial}
              </span>
              <span className="text-[12px] text-text-faint truncate">{task.createdBy.name}</span>
            </div>
          )}
        </div>

        {showClaimButton && (
          <button
            onClick={handleClaim}
            disabled={claimState !== 'idle'}
            className={`w-full py-2.5 rounded-lg border-none text-[13px] font-semibold text-white font-sans transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              ${claimState === 'claimed' ? 'bg-emerald-500' : 'btn-gradient hover:opacity-90 hover:shadow-md active:scale-[0.98]'}
              ${claimState === 'claiming' ? 'opacity-80 cursor-wait' : claimState === 'claimed' ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {claimState === 'claiming' && <SpinnerIcon />}
            {claimState === 'claimed' && <CheckIcon />}
            {claimState === 'idle' && 'Claim Task'}
            {claimState === 'claiming' && 'Claiming...'}
            {claimState === 'claimed' && 'Claimed'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
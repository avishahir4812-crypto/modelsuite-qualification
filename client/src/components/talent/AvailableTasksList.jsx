import { useEffect, useMemo, useRef, useState } from 'react';
import TaskCard from './TaskCard';

const SEARCH_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-faint">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CLEAR_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SORT_OPTIONS = [
  { key: 'due', label: 'Due date' },
  { key: 'title', label: 'Title' },
];

const SORTERS = {
  due: (a, b) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aTime - bTime;
  },
  title: (a, b) => (a.title || '').localeCompare(b.title || ''),
};

const AvailableTasksList = ({ tasks, onClaimed }) => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('due');

  const trackRef = useRef(null);
  const buttonRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const measure = () => {
      const btn = buttonRefs.current[sort];
      const track = trackRef.current;
      if (!btn || !track) return;
      const btnRect = btn.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      setIndicator({ left: btnRect.left - trackRect.left, width: btnRect.width });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [sort]);

  const filtered = useMemo(() => {
    let list = tasks || [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      );
    }
    return [...list].sort(SORTERS[sort]);
  }, [tasks, search, sort]);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-bg-card border border-dashed border-border rounded-xl py-10 px-6 text-center text-text-faint text-sm">
        No open tasks right now — check back later.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* One-off keyframes for card entrance + count transitions */}
      <style>{`
        @keyframes taskCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-bg-card border border-border rounded-lg px-3 py-2 transition-colors duration-200 focus-within:border-border-light focus-within:shadow-sm">
          {SEARCH_ICON}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search open tasks by title or description"
            aria-label="Search open tasks"
            className="flex-1 bg-transparent outline-none text-[13px] text-text-primary placeholder:text-text-faint"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="text-text-faint hover:text-text-primary transition-colors duration-150 shrink-0"
            >
              {CLEAR_ICON}
            </button>
          )}
        </div>

        {/* Segmented sort control */}
        <div
          ref={trackRef}
          className="relative flex items-center bg-bg-card border border-border rounded-lg p-1 shrink-0"
          role="tablist"
          aria-label="Sort tasks"
        >
          {indicator.width > 0 && (
            <div
              className="absolute top-1 bottom-1 rounded-md btn-gradient transition-all duration-200 ease-out"
              style={{ left: indicator.left, width: indicator.width }}
            />
          )}
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              ref={(el) => { buttonRefs.current[opt.key] = el; }}
              type="button"
              role="tab"
              aria-selected={sort === opt.key}
              onClick={() => setSort(opt.key)}
              className={`relative z-10 px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold whitespace-nowrap transition-colors duration-200 ${
                sort === opt.key ? 'text-white' : 'text-text-faint hover:text-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <span className="text-[12px] text-text-faint transition-opacity duration-200">
        Showing {filtered.length} of {tasks.length} open {tasks.length === 1 ? 'task' : 'tasks'}
      </span>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-bg-card border border-dashed border-border rounded-xl py-10 px-6 text-center text-text-faint text-sm">
          No tasks match your search.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {filtered.map((task, i) => (
            <TaskCard key={task._id} task={task} showClaimButton onClaimed={onClaimed} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableTasksList;
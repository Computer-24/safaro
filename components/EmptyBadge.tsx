export function EmptyBadge() {
  return (
    <div className="flex justify-center">
      <div
        className="
          inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium shadow-sm
          bg-slate-50 text-slate-800
          dark:bg-slate-800 dark:text-slate-100
          ring-1 ring-slate-200 dark:ring-slate-700
        "
        role="status"
        aria-live="polite"
      >
        <svg className="h-4 w-4 text-teal-600 dark:text-teal-300" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <span className="min-w-0 truncate">
          <strong className="block text-sm">No users found</strong>
          <span className="block text-xs text-slate-600 dark:text-slate-300/90">
            Try adjusting filters or add a new user
          </span>
        </span>
      </div>
    </div>
  );
}

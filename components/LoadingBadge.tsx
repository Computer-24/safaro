export function LoadingBadge() {
  return (
    <div className="flex justify-center">
      <div
        role="status"
        aria-live="polite"
        className="
          inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium shadow-sm
          bg-gray-50 text-gray-700 ring-1 ring-gray-100
          dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700
        "
      >
        <svg
          className="h-4 w-4 animate-spin text-gray-700 dark:text-slate-200"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeOpacity="0.15"
          />
          <path
            d="M22 12a10 10 0 0 1-10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-gray-700 dark:text-slate-200"
          />
        </svg>

        <span className="min-w-0 truncate">
          <strong className="block text-sm">Loading users…</strong>
          <span className="block text-xs text-muted-foreground dark:text-slate-300/90">
            Fetching data — please wait
          </span>
        </span>
      </div>
    </div>
  );
}

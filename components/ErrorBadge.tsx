export function ErrorBadge({ message }: { message: string }) {
  return (
    <div className="flex justify-center">
      <div
        role="alert"
        aria-live="assertive"
        className="
          inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium shadow-sm
          bg-red-50 text-red-700 ring-1 ring-red-100
          dark:bg-slate-800 dark:text-red-200 dark:ring-red-900/30
        "
      >
        <svg
          className="h-4 w-4 flex-none text-red-700 dark:text-red-300"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            stroke="none"
            fill="currentColor"
            opacity="0.08"
            className="text-red-700 dark:text-red-300/12"
          />
        </svg>

        <span className="min-w-0 truncate">
          <strong className="block text-sm">Error loading users</strong>
          <span className="block text-xs text-red-600/90 dark:text-red-200/90">
            {message}
          </span>
        </span>
      </div>
    </div>
  );
}

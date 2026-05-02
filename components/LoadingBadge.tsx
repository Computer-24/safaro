export function LoadingBadge() {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 rounded-full bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
        <svg className="h-4 w-4 animate-spin text-gray-700" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>

        <span className="min-w-0 truncate">
          <strong className="block text-sm">Loading users…</strong>
          <span className="block text-xs text-muted-foreground">Fetching data — please wait</span>
        </span>
      </div>
    </div>
  );
}
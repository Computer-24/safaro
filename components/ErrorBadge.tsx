export function ErrorBadge({ message }: { message: string }) {
  return (
    <div className="flex justify-center">
      <div
        role="alert"
        aria-live="assertive"
        className="inline-flex items-center gap-3 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm"
      >
        <svg className="h-4 w-4 flex-none text-red-700" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="0" fill="currentColor" opacity="0.08" />
        </svg>

        <span className="min-w-0 truncate">
          <strong className="block text-sm">Error loading users</strong>
          <span className="block text-xs text-red-600/90">{message}</span>
        </span>
      </div>
    </div>
  );
}
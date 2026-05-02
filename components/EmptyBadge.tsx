export function EmptyBadge() {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm">
        <svg className="h-4 w-4 text-amber-700" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <span className="min-w-0 truncate">
          <strong className="block text-sm">No users found</strong>
          <span className="block text-xs text-amber-600/90">Try adjusting filters or add a new user</span>
        </span>
      </div>
    </div>
  );
}
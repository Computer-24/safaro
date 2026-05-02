// lib/pagination.ts
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const APPROVER_LIST_DROPDOWN_CAP = 300;

export function normalizePageSize(requested?: unknown) {
  const n = Number(requested);
  const safe = Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, safe), MAX_PAGE_SIZE);
}

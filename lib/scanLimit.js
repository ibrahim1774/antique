export const FREE_SCAN_LIMIT = 2
export const STORAGE_KEY = 'tivoro_scan_count'

export function getLocalScanCount() {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
}

export function incrementLocalScanCount() {
  if (typeof window === 'undefined') return
  const current = getLocalScanCount()
  localStorage.setItem(STORAGE_KEY, String(current + 1))
}

export function isOverLocalLimit() {
  return getLocalScanCount() >= FREE_SCAN_LIMIT
}

const MAP = {
  aktif: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  lulus: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  pindah: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'tidak aktif': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  terkunci: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  hadir: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  sakit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  izin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  alpa: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  terlambat: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}
export default function Badge({ children, tone }) {
  const cls = MAP[tone?.toLowerCase?.()] || MAP[String(children).toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  return <span className={`badge ${cls}`}>{children}</span>
}

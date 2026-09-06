import { Inbox } from 'lucide-react'
export default function EmptyState({ message = 'Belum ada data.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
      <Inbox size={32} />
      <p className="text-sm">{message}</p>
    </div>
  )
}

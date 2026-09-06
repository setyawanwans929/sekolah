import { XCircle } from 'lucide-react'
export default function ErrorState({ message = 'Terjadi kesalahan saat memuat data.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-red-500">
      <XCircle size={32} />
      <p className="text-sm text-center max-w-md">{message}</p>
    </div>
  )
}

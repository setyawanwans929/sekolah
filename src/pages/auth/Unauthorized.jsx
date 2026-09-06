import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-3 text-center p-4">
      <ShieldAlert size={40} className="text-amber-500" />
      <h1 className="text-lg font-semibold">Akses Ditolak</h1>
      <p className="text-sm text-gray-500 max-w-sm">Kamu tidak memiliki izin untuk mengakses halaman ini.</p>
      <Link to="/login" className="btn btn-primary">Kembali ke Login</Link>
    </div>
  )
}

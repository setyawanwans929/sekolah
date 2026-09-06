import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth, ROLE_HOME } from '../../context/AuthContext'
import { LogIn, Loader2 } from 'lucide-react'

export default function Login() {
  const { signIn, session, role, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  if (!loading && session && role) {
    const from = location.state?.from?.pathname
    return <Navigate to={from || ROLE_HOME[role] || '/'} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      // Redirect ditangani oleh blok Navigate di atas setelah profil termuat.
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email atau password salah.' : err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <img src="/favicon.svg" alt="EduTrack" className="w-14 h-14 mb-2" />
          <h1 className="text-xl font-bold text-brand-700 dark:text-brand-400">EduTrack</h1>
          <p className="text-sm text-gray-500">Sistem Informasi Akademik Sekolah</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@sekolah.sch.id" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn btn-primary w-full">
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        <p className="text-xs text-center text-gray-400 mt-4">
          Akun dibuat oleh Admin melalui Supabase Auth. Hubungi admin sekolah jika belum memiliki akun.
        </p>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import { createUserAccount, listUserAccounts, unlinkedStudents, unlinkedTeachers, unlinkedParents } from '../../services/usersService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { logActivity } from '../../services/auditLogService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Badge from '../../components/ui/Badge'
import { formatDateTime } from '../../utils/format'
import { ROLE_LABEL } from '../../utils/roles'

const ROLES = ['admin', 'teacher', 'homeroom', 'student', 'parent']
const emptyForm = { role: 'student', entityId: '', email: '', password: '', fullName: '' }

export default function UsersPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [accounts, setAccounts] = useState([])
  const [candidates, setCandidates] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setAccounts(await listUserAccounts()) } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    (async () => {
      setForm((f) => ({ ...f, entityId: '', fullName: '' }))
      if (form.role === 'admin') { setCandidates([]); return }
      try {
        if (form.role === 'student') setCandidates(await unlinkedStudents())
        else if (form.role === 'teacher' || form.role === 'homeroom') setCandidates(await unlinkedTeachers())
        else if (form.role === 'parent') setCandidates(await unlinkedParents())
      } catch (e) { toast.error(e.message) }
    })()
  }, [form.role])

  const pickEntity = (id) => {
    const item = candidates.find((c) => c.id === id)
    setForm((f) => ({ ...f, entityId: id, fullName: item?.full_name || '' }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.role !== 'admin' && !form.entityId) { toast.error('Pilih data yang akan dihubungkan ke akun ini.'); return }
    setSubmitting(true)
    try {
      await createUserAccount({
        email: form.email, password: form.password, fullName: form.fullName, role: form.role,
        teacherId: (form.role === 'teacher' || form.role === 'homeroom') ? form.entityId : undefined,
        studentId: form.role === 'student' ? form.entityId : undefined,
        parentId: form.role === 'parent' ? form.entityId : undefined,
      })
      await logActivity({ userId: profile.id, role: profile.role, action: 'Buat akun pengguna', relatedTable: 'profiles', detail: `${form.email} (${form.role})` })
      toast.success('Akun berhasil dibuat.')
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold">Kelola Pengguna</h1><p className="text-sm text-gray-500">Buat akun login langsung dari sini — tidak perlu membuka Supabase Dashboard.</p></div>

      <div className="card max-w-2xl">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><UserPlus size={18} />Buat Akun Baru</h2>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Role *</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>

          {form.role !== 'admin' && (
            <div>
              <label className="label">Hubungkan ke Data {ROLE_LABEL[form.role]} *</label>
              <select required className="input" value={form.entityId} onChange={(e) => pickEntity(e.target.value)}>
                <option value="">- Pilih -</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.full_name}{c.nis ? ` (${c.nis})` : c.nip ? ` (${c.nip})` : ''}</option>)}
              </select>
              {candidates.length === 0 && <p className="text-xs text-amber-600 mt-1">Semua data {ROLE_LABEL[form.role].toLowerCase()} sudah punya akun, atau datanya belum diinput di menu terkait.</p>}
            </div>
          )}

          {form.role === 'admin' && (
            <div><label className="label">Nama Lengkap *</label><input required className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          )}

          <div><label className="label">Email *</label><input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>

          <div>
            <label className="label">Password * (min. 8 karakter)</label>
            <div className="relative">
              <input required minLength={8} type={showPassword ? 'text' : 'password'} className="input pr-10" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Membuat akun...' : 'Buat Akun'}</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Akun yang Sudah Dibuat</h2>
        {loading ? <LoadingSpinner /> : accounts.length === 0 ? <EmptyState message="Belum ada akun." /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Email</th><th>Nama</th><th>Role</th><th>Terhubung ke</th><th>Dibuat</th></tr></thead>
              <tbody>{accounts.map((a) => (
                <tr key={a.id}>
                  <td>{a.email}</td>
                  <td className="font-medium">{a.full_name || '-'}</td>
                  <td><Badge tone="draft">{ROLE_LABEL[a.role] || a.role}</Badge></td>
                  <td className="text-gray-500">{a.teacher?.full_name || a.student?.full_name || a.parent?.full_name || '-'}</td>
                  <td className="text-gray-400 text-xs">{formatDateTime(a.created_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

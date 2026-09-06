import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Eye, Upload, Download } from 'lucide-react'
import { listStudents, createStudent, updateStudent, deleteStudent } from '../../services/studentsService'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../services/auditLogService'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import { exportToCsv } from '../../utils/csv'
import { Link, useNavigate } from 'react-router-dom'

const STATUS_OPTIONS = ['aktif', 'lulus', 'pindah', 'tidak aktif']
const emptyForm = {
  nis: '', nisn: '', full_name: '', nickname: '', gender: 'L', birth_place: '', birth_date: '',
  address: '', phone: '', email: '', entry_year: new Date().getFullYear(), status: 'aktif',
}

export default function StudentsPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const pageSize = 10

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data, count } = await listStudents({ search, status, page, pageSize })
      setRows(data); setCount(count)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [search, status, page])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (row) => { setEditing(row); setForm({ ...emptyForm, ...row }); setModalOpen(true) }

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateStudent(editing.id, form)
        await logActivity({ userId: profile.id, role: profile.role, action: 'Edit siswa', relatedTable: 'students', relatedId: editing.id, detail: form.full_name })
        toast.success('Data siswa berhasil diperbarui.')
      } else {
        const created = await createStudent(form)
        await logActivity({ userId: profile.id, role: profile.role, action: 'Tambah siswa', relatedTable: 'students', relatedId: created.id, detail: form.full_name })
        toast.success('Siswa baru berhasil ditambahkan.')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message.includes('duplicate') ? 'NIS atau NISN sudah digunakan siswa lain.' : err.message)
    }
  }

  const confirmDeleteNow = async () => {
    try {
      await deleteStudent(confirmDelete.id)
      await logActivity({ userId: profile.id, role: profile.role, action: 'Hapus siswa', relatedTable: 'students', relatedId: confirmDelete.id, detail: confirmDelete.full_name })
      toast.success('Siswa berhasil dihapus.')
      setConfirmDelete(null)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const handleExport = () => exportToCsv('siswa.csv', rows.map((r) => ({
    NIS: r.nis, NISN: r.nisn, Nama: r.full_name, Gender: r.gender, Status: r.status, 'Tahun Masuk': r.entry_year,
  })))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Data Siswa</h1>
          <p className="text-sm text-gray-500">Kelola data induk siswa sekolah.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-outline" onClick={() => navigate('/admin/students/import')}><Upload size={16} />Import CSV</button>
          <button className="btn btn-outline" onClick={handleExport}><Download size={16} />Export CSV</button>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Tambah Siswa</button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Cari nama, NIS, atau NISN..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="input sm:w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} /> : rows.length === 0 ? <EmptyState message="Tidak ada data siswa yang cocok." /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>NIS</th><th>Nama</th><th>Gender</th><th>Tahun Masuk</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.nis}</td>
                    <td className="font-medium">{r.full_name}</td>
                    <td>{r.gender}</td>
                    <td>{r.entry_year}</td>
                    <td><Badge tone={r.status}>{r.status}</Badge></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/students/${r.id}`} className="btn btn-outline px-2 py-1"><Eye size={14} /></Link>
                        <button className="btn btn-outline px-2 py-1" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                        <button className="btn btn-outline px-2 py-1 text-red-600" onClick={() => setConfirmDelete(r)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && <Pagination page={page} pageSize={pageSize} total={count} onChange={setPage} />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Siswa' : 'Tambah Siswa'} size="lg">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">NIS *</label><input required className="input" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} /></div>
          <div><label className="label">NISN *</label><input required className="input" value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Nama Lengkap *</label><input required className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><label className="label">Nama Panggilan</label><input className="input" value={form.nickname || ''} onChange={(e) => setForm({ ...form, nickname: e.target.value })} /></div>
          <div>
            <label className="label">Jenis Kelamin</label>
            <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="L">Laki-laki</option><option value="P">Perempuan</option>
            </select>
          </div>
          <div><label className="label">Tempat Lahir</label><input className="input" value={form.birth_place || ''} onChange={(e) => setForm({ ...form, birth_place: e.target.value })} /></div>
          <div><label className="label">Tanggal Lahir</label><input type="date" className="input" value={form.birth_date || ''} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Alamat</label><input className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="label">No. HP</label><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Tahun Masuk</label><input type="number" className="input" value={form.entry_year} onChange={(e) => setForm({ ...form, entry_year: Number(e.target.value) })} /></div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} title="Hapus Siswa" message={`Yakin ingin menghapus ${confirmDelete?.full_name}? Tindakan ini tidak dapat dibatalkan.`} onConfirm={confirmDeleteNow} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}

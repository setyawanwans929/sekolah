import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { listTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../services/teachersService'
import { listSubjects } from '../../services/subjectsService'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

const emptyForm = { nip: '', full_name: '', email: '', phone: '', gender: 'L', main_subject_id: '', status: 'aktif' }

export default function TeachersPage() {
  const toast = useToast()
  const [rows, setRows] = useState([]); const [count, setCount] = useState(0)
  const [page, setPage] = useState(1); const [search, setSearch] = useState('')
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const pageSize = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data, count }, subs] = await Promise.all([listTeachers({ search, page, pageSize }), listSubjects()])
      setRows(data); setCount(count); setSubjects(subs)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (row) => { setEditing(row); setForm({ ...emptyForm, ...row }); setModalOpen(true) }

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (editing) { await updateTeacher(editing.id, form); toast.success('Data guru diperbarui.') }
      else { await createTeacher(form); toast.success('Guru baru ditambahkan.') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
  }

  const confirmDeleteNow = async () => {
    try { await deleteTeacher(confirmDelete.id); toast.success('Guru dihapus.'); setConfirmDelete(null); load() }
    catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-bold">Data Guru</h1><p className="text-sm text-gray-500">Kelola data guru dan mata pelajaran yang diampu.</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Tambah Guru</button>
      </div>
      <div className="card">
        <div className="relative mb-4 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Cari nama atau NIP..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        {loading ? <LoadingSpinner /> : rows.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>NIP</th><th>Nama</th><th>Mapel Utama</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.nip}</td><td className="font-medium">{r.full_name}</td>
                    <td>{r.subject?.name || '-'}</td><td><Badge tone={r.status}>{r.status}</Badge></td>
                    <td><div className="flex justify-end gap-1">
                      <button className="btn btn-outline px-2 py-1" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                      <button className="btn btn-outline px-2 py-1 text-red-600" onClick={() => setConfirmDelete(r)}><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <Pagination page={page} pageSize={pageSize} total={count} onChange={setPage} />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Guru' : 'Tambah Guru'}>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">NIP *</label><input required className="input" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Nama Lengkap *</label><input required className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">No. HP</label><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div>
            <label className="label">Jenis Kelamin</label>
            <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>
          </div>
          <div>
            <label className="label">Mapel Utama</label>
            <select className="input" value={form.main_subject_id || ''} onChange={(e) => setForm({ ...form, main_subject_id: e.target.value || null })}>
              <option value="">- Pilih -</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="aktif">Aktif</option><option value="tidak aktif">Tidak Aktif</option></select>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirmDelete} title="Hapus Guru" message={`Yakin ingin menghapus ${confirmDelete?.full_name}?`} onConfirm={confirmDeleteNow} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}

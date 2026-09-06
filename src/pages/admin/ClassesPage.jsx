import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { listClasses, createClass, updateClass, deleteClass } from '../../services/classesService'
import { listTeachers } from '../../services/teachersService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { Link } from 'react-router-dom'

const emptyForm = { name: '', grade_level: 'X', major: 'RPL', homeroom_teacher_id: '', capacity: 36 }

export default function ClassesPage() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [teachers, setTeachers] = useState([])
  const [activeYear, setActiveYear] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const year = await getActiveAcademicYear()
      setActiveYear(year)
      const [classes, { data: t }] = await Promise.all([listClasses({ academicYearId: year?.id }), listTeachers({ pageSize: 100 })])
      setRows(classes); setTeachers(t)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (row) => { setEditing(row); setForm({ ...emptyForm, ...row }); setModalOpen(true) }

  const submit = async (e) => {
    e.preventDefault()
    if (!activeYear) { toast.error('Tidak ada tahun ajaran aktif. Atur di menu Tahun Ajaran.'); return }
    try {
      const payload = { ...form, academic_year_id: activeYear.id }
      if (editing) { await updateClass(editing.id, payload); toast.success('Kelas diperbarui.') }
      else { await createClass(payload); toast.success('Kelas baru dibuat.') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
  }
  const confirmDeleteNow = async () => {
    try { await deleteClass(confirmDelete.id); toast.success('Kelas dihapus.'); setConfirmDelete(null); load() }
    catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Data Kelas</h1>
          <p className="text-sm text-gray-500">Tahun ajaran aktif: <strong>{activeYear?.name || 'Belum diatur'}</strong></p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/classes/assign" className="btn btn-outline"><Users size={16} />Pembagian Kelas</Link>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Tambah Kelas</button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : rows.length === 0 ? <EmptyState message="Belum ada kelas untuk tahun ajaran ini." /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((c) => (
            <div key={c.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{c.name}</h3>
                  <p className="text-xs text-gray-500">{c.grade_level} · {c.major}</p>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-outline px-2 py-1" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                  <button className="btn btn-outline px-2 py-1 text-red-600" onClick={() => setConfirmDelete(c)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <p>Wali Kelas: <strong>{c.homeroom_teacher?.full_name || '-'}</strong></p>
                <p>Kapasitas: <strong>{c.capacity}</strong> siswa</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Kelas' : 'Tambah Kelas'}>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Nama Kelas * (mis. X RPL 1)</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Tingkat</label><select className="input" value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })}><option>X</option><option>XI</option><option>XII</option></select></div>
          <div><label className="label">Jurusan</label><input className="input" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} /></div>
          <div>
            <label className="label">Wali Kelas</label>
            <select className="input" value={form.homeroom_teacher_id || ''} onChange={(e) => setForm({ ...form, homeroom_teacher_id: e.target.value || null })}>
              <option value="">- Pilih -</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div><label className="label">Kapasitas</label><input type="number" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirmDelete} title="Hapus Kelas" message={`Yakin ingin menghapus kelas ${confirmDelete?.name}?`} onConfirm={confirmDeleteNow} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}

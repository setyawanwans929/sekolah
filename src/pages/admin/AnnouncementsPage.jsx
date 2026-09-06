import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Megaphone } from 'lucide-react'
import { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../services/announcementsService'
import { listClasses } from '../../services/classesService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { formatDate } from '../../utils/format'

const TARGETS = ['semua', 'guru', 'siswa', 'orang tua', 'kelas tertentu']
const emptyForm = { title: '', content: '', target: 'semua', class_id: '' }

export default function AnnouncementsPage({ readOnly = false }) {
  const { profile } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState([]); const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false); const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm); const [confirmDelete, setConfirmDelete] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const y = await getActiveAcademicYear()
      const [ann, cls] = await Promise.all([listAnnouncements({ target: profile.role === 'admin' ? undefined : profile.role }), listClasses({ academicYearId: y?.id })])
      setRows(ann); setClasses(cls)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (r) => { setEditing(r); setForm({ ...emptyForm, ...r, class_id: r.class?.id || '' }); setModalOpen(true) }
  const submit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, author_id: profile.id, class_id: form.target === 'kelas tertentu' ? form.class_id : null, status: 'terbit' }
      if (editing) { await updateAnnouncement(editing.id, payload); toast.success('Pengumuman diperbarui.') }
      else { await createAnnouncement(payload); toast.success('Pengumuman diterbitkan.') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
  }
  const confirmDeleteNow = async () => { try { await deleteAnnouncement(confirmDelete.id); toast.success('Dihapus.'); setConfirmDelete(null); load() } catch (e) { toast.error(e.message) } }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-bold">Pengumuman</h1><p className="text-sm text-gray-500">Informasi untuk seluruh warga sekolah.</p></div>
        {!readOnly && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Buat Pengumuman</button>}
      </div>
      {loading ? <LoadingSpinner /> : rows.length === 0 ? <EmptyState /> : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <Megaphone className="text-brand-600 mt-1" size={18} />
                  <div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{r.author?.full_name || 'Admin'} · {formatDate(r.created_at)} · Target: {r.target}{r.class ? ` (${r.class.name})` : ''}</p>
                  </div>
                </div>
                {!readOnly && <div className="flex gap-1 shrink-0">
                  <button className="btn btn-outline px-2 py-1" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                  <button className="btn btn-outline px-2 py-1 text-red-600" onClick={() => setConfirmDelete(r)}><Trash2 size={14} /></button>
                </div>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Pengumuman' : 'Buat Pengumuman'}>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Judul *</label><input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Isi *</label><textarea required rows={4} className="input" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <div><label className="label">Target</label><select className="input" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>{TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          {form.target === 'kelas tertentu' && <div><label className="label">Kelas</label><select className="input" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}><option value="">-</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Terbitkan</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirmDelete} title="Hapus Pengumuman" message="Yakin ingin menghapus pengumuman ini?" onConfirm={confirmDeleteNow} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}

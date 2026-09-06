import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { listExams, createExam, updateExam, deleteExam } from '../../services/examsService'
import { listClasses } from '../../services/classesService'
import { listSubjects } from '../../services/subjectsService'
import { listTeachers } from '../../services/teachersService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { formatDate } from '../../utils/format'

const TYPES = ['Ulangan', 'UTS', 'UAS', 'Praktik', 'Ujian Lainnya']
const emptyForm = { name: '', exam_type: 'Ulangan', subject_id: '', class_id: '', teacher_id: '', exam_date: '', start_time: '', room: '' }

export default function ExamsPage({ readOnly = false }) {
  const toast = useToast()
  const [rows, setRows] = useState([]); const [classes, setClasses] = useState([]); const [subjects, setSubjects] = useState([]); const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false); const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm); const [confirmDelete, setConfirmDelete] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const y = await getActiveAcademicYear()
      const [ex, cls, subs, { data: tch }] = await Promise.all([listExams(), listClasses({ academicYearId: y?.id }), listSubjects(), listTeachers({ pageSize: 100 })])
      setRows(ex); setClasses(cls); setSubjects(subs); setTeachers(tch)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (r) => { setEditing(r); setForm({ ...emptyForm, ...r, subject_id: r.subject_id, class_id: r.class_id, teacher_id: r.teacher_id }); setModalOpen(true) }
  const submit = async (e) => {
    e.preventDefault()
    try {
      if (editing) { await updateExam(editing.id, form); toast.success('Ujian diperbarui.') }
      else { await createExam(form); toast.success('Jadwal ujian ditambahkan.') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
  }
  const confirmDeleteNow = async () => { try { await deleteExam(confirmDelete.id); toast.success('Dihapus.'); setConfirmDelete(null); load() } catch (e) { toast.error(e.message) } }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-bold">Jadwal Ujian</h1><p className="text-sm text-gray-500">Kelola jadwal ulangan, UTS, UAS, dan ujian praktik.</p></div>
        {!readOnly && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Tambah Ujian</button>}
      </div>
      <div className="card">
        {loading ? <LoadingSpinner /> : rows.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Nama</th><th>Jenis</th><th>Mapel</th><th>Kelas</th><th>Tanggal</th><th>Jam</th>{!readOnly && <th className="text-right">Aksi</th>}</tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.name}</td><td>{r.exam_type}</td><td>{r.subject?.name}</td><td>{r.class?.name}</td><td>{formatDate(r.exam_date)}</td><td>{r.start_time?.slice(0,5)}</td>
                  {!readOnly && <td><div className="flex justify-end gap-1">
                    <button className="btn btn-outline px-2 py-1" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                    <button className="btn btn-outline px-2 py-1 text-red-600" onClick={() => setConfirmDelete(r)}><Trash2 size={14} /></button>
                  </div></td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Ujian' : 'Tambah Ujian'} size="lg">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Nama Ujian *</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Jenis</label><select className="input" value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className="label">Ruangan</label><input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
          <div><label className="label">Mapel *</label><select required className="input" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}><option value="">-</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label className="label">Kelas *</label><select required className="input" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}><option value="">-</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Guru</label><select className="input" value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}><option value="">-</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></div>
          <div><label className="label">Tanggal *</label><input required type="date" className="input" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} /></div>
          <div><label className="label">Jam</label><input type="time" className="input" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirmDelete} title="Hapus Ujian" message="Yakin ingin menghapus jadwal ujian ini?" onConfirm={confirmDeleteNow} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}

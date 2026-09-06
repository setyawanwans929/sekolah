import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, AlertTriangle } from 'lucide-react'
import { listSchedules, createSchedule, updateSchedule, deleteSchedule } from '../../services/schedulesService'
import { listClasses } from '../../services/classesService'
import { listTeachers } from '../../services/teachersService'
import { listSubjects } from '../../services/subjectsService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { DAYS } from '../../utils/format'

const emptyForm = { day_of_week: 1, start_time: '07:00', end_time: '08:30', teacher_id: '', subject_id: '', class_id: '', room: '' }

export default function SchedulesPage() {
  const toast = useToast()
  const [rows, setRows] = useState([]); const [classes, setClasses] = useState([]); const [teachers, setTeachers] = useState([]); const [subjects, setSubjects] = useState([])
  const [year, setYear] = useState(null)
  const [filterClass, setFilterClass] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false); const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm); const [formError, setFormError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const y = await getActiveAcademicYear()
      setYear(y)
      const semId = y?.semesters?.find((s) => s.is_active)?.id
      const [sch, cls, { data: tch }, subs] = await Promise.all([
        listSchedules({ classId: filterClass || undefined, semesterId: semId }), listClasses({ academicYearId: y?.id }), listTeachers({ pageSize: 100 }), listSubjects(),
      ])
      setRows(sch); setClasses(cls); setTeachers(tch); setSubjects(subs)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filterClass])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true) }
  const openEdit = (r) => {
    setEditing(r)
    setForm({ day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time, teacher_id: r.teacher?.id, subject_id: r.subject?.id, class_id: r.class?.id, room: r.room || '' })
    setFormError(''); setModalOpen(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setFormError('')
    const semId = year?.semesters?.find((s) => s.is_active)?.id
    if (!semId) { setFormError('Tidak ada semester aktif. Atur di menu Tahun Ajaran.'); return }
    try {
      const payload = { ...form, academic_year_id: year.id, semester_id: semId }
      if (editing) await updateSchedule(editing.id, payload)
      else await createSchedule(payload)
      toast.success('Jadwal berhasil disimpan.')
      setModalOpen(false); load()
    } catch (err) { setFormError(err.message) }
  }
  const confirmDeleteNow = async () => { try { await deleteSchedule(confirmDelete.id); toast.success('Jadwal dihapus.'); setConfirmDelete(null); load() } catch (e) { toast.error(e.message) } }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div><h1 className="text-xl font-bold">Jadwal Pelajaran</h1><p className="text-sm text-gray-500">Sistem otomatis mendeteksi bentrok guru, kelas, dan ruangan.</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Tambah Jadwal</button>
      </div>
      <div className="card">
        <select className="input max-w-xs mb-4" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="">Semua Kelas</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {loading ? <LoadingSpinner /> : rows.length === 0 ? <EmptyState message="Belum ada jadwal." /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Hari</th><th>Jam</th><th>Kelas</th><th>Mapel</th><th>Guru</th><th>Ruang</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id}>
                  <td>{DAYS[r.day_of_week]}</td><td>{r.start_time?.slice(0,5)}–{r.end_time?.slice(0,5)}</td>
                  <td>{r.class?.name}</td><td>{r.subject?.name}</td><td>{r.teacher?.full_name}</td><td>{r.room || '-'}</td>
                  <td><div className="flex justify-end gap-1">
                    <button className="btn btn-outline px-2 py-1" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                    <button className="btn btn-outline px-2 py-1 text-red-600" onClick={() => setConfirmDelete(r)}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Jadwal' : 'Tambah Jadwal'}>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Hari</label><select className="input" value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}>{DAYS.map((d, i) => i > 0 && i < 7 && <option key={i} value={i}>{d}</option>)}</select></div>
          <div><label className="label">Ruangan</label><input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
          <div><label className="label">Jam Mulai</label><input type="time" className="input" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
          <div><label className="label">Jam Selesai</label><input type="time" className="input" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
          <div>
            <label className="label">Kelas *</label>
            <select required className="input" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
              <option value="">- Pilih -</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mata Pelajaran *</label>
            <select required className="input" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">- Pilih -</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Guru *</label>
            <select required className="input" value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
              <option value="">- Pilih -</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          {formError && <p className="sm:col-span-2 text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={14} />{formError}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirmDelete} title="Hapus Jadwal" message="Yakin ingin menghapus jadwal ini?" onConfirm={confirmDeleteNow} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}

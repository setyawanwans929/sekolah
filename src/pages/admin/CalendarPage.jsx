import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { listCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '../../services/calendarService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { formatDate } from '../../utils/format'

const TYPES = ['Hari Efektif', 'Libur', 'Ujian', 'UTS', 'UAS', 'Pembagian Rapor', 'Kegiatan Sekolah', 'Masa Pendaftaran', 'Lainnya']
const emptyForm = { title: '', event_type: 'Kegiatan Sekolah', start_date: '', end_date: '', description: '' }

export default function CalendarPage({ readOnly = false }) {
  const toast = useToast()
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false); const [form, setForm] = useState(emptyForm)
  const [view, setView] = useState('list')

  const load = async () => {
    setLoading(true)
    try { const y = await getActiveAcademicYear(); setRows(await listCalendarEvents({ academicYearId: y?.id })) }
    catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      const y = await getActiveAcademicYear()
      await createCalendarEvent({ ...form, academic_year_id: y?.id })
      toast.success('Event kalender ditambahkan.'); setModalOpen(false); setForm(emptyForm); load()
    } catch (err) { toast.error(err.message) }
  }
  const remove = async (id) => { try { await deleteCalendarEvent(id); toast.success('Event dihapus.'); load() } catch (e) { toast.error(e.message) } }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div><h1 className="text-xl font-bold">Kalender Akademik</h1><p className="text-sm text-gray-500">Hari efektif, libur, ujian, dan kegiatan sekolah.</p></div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <button className={`px-3 py-1.5 text-sm ${view === 'list' ? 'bg-brand-600 text-white' : ''}`} onClick={() => setView('list')}>List</button>
            <button className={`px-3 py-1.5 text-sm ${view === 'calendar' ? 'bg-brand-600 text-white' : ''}`} onClick={() => setView('calendar')}>Calendar</button>
          </div>
          {!readOnly && <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} />Tambah Event</button>}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : rows.length === 0 ? <EmptyState /> : view === 'list' ? (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Judul</th><th>Jenis</th><th>Mulai</th><th>Selesai</th>{!readOnly && <th className="text-right">Aksi</th>}</tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.title}</td><td>{r.event_type}</td><td>{formatDate(r.start_date)}</td><td>{formatDate(r.end_date)}</td>
                {!readOnly && <td className="text-right"><button className="btn btn-outline px-2 py-1 text-red-600" onClick={() => remove(r.id)}><Trash2 size={14} /></button></td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r) => (
            <div key={r.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="text-xs text-brand-600 font-medium">{r.event_type}</p>
              <p className="font-semibold">{r.title}</p>
              <p className="text-xs text-gray-500">{formatDate(r.start_date)} {r.end_date && r.end_date !== r.start_date ? `- ${formatDate(r.end_date)}` : ''}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Event Kalender">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Judul *</label><input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Jenis</label><select className="input" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className="label">Tanggal Mulai *</label><input required type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
          <div><label className="label">Tanggal Selesai</label><input type="date" className="input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Deskripsi</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

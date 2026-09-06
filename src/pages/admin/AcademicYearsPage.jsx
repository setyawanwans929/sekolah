import { useEffect, useState } from 'react'
import { Plus, CheckCircle2 } from 'lucide-react'
import { listAcademicYears, createAcademicYear, setActiveAcademicYear, createSemester, setActiveSemester } from '../../services/academicYearsService'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function AcademicYearsPage() {
  const toast = useToast()
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false); const [form, setForm] = useState({ name: '' })
  const [semModal, setSemModal] = useState(null)
  const [semForm, setSemForm] = useState({ name: 'Ganjil' })

  const load = async () => { setLoading(true); try { setRows(await listAcademicYears()) } catch (e) { toast.error(e.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const submitYear = async (e) => {
    e.preventDefault()
    try { await createAcademicYear(form); toast.success('Tahun ajaran ditambahkan.'); setModalOpen(false); setForm({ name: '' }); load() }
    catch (err) { toast.error(err.message) }
  }
  const activateYear = async (id) => { try { await setActiveAcademicYear(id); toast.success('Tahun ajaran aktif diperbarui.'); load() } catch (e) { toast.error(e.message) } }

  const submitSemester = async (e) => {
    e.preventDefault()
    try { await createSemester({ ...semForm, academic_year_id: semModal.id }); toast.success('Semester ditambahkan.'); setSemModal(null); load() }
    catch (err) { toast.error(err.message) }
  }
  const activateSemester = async (semId, yearId) => { try { await setActiveSemester(semId, yearId); toast.success('Semester aktif diperbarui.'); load() } catch (e) { toast.error(e.message) } }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-bold">Tahun Ajaran & Semester</h1><p className="text-sm text-gray-500">Hanya satu tahun ajaran dan satu semester yang boleh aktif dalam satu waktu.</p></div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} />Tambah Tahun Ajaran</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((y) => (
          <div key={y.id} className="card">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">{y.name}</h3>
              {y.is_active ? <Badge tone="aktif">Aktif</Badge> : <button className="btn btn-outline px-2 py-1 text-xs" onClick={() => activateYear(y.id)}>Aktifkan</button>}
            </div>
            <div className="space-y-2">
              {(y.semesters || []).map((s) => (
                <div key={s.id} className="flex justify-between items-center text-sm border-t border-gray-100 dark:border-gray-800 pt-2">
                  <span>Semester {s.name}</span>
                  {s.is_active ? <Badge tone="aktif">Aktif</Badge> : <button className="text-xs text-brand-600 hover:underline" onClick={() => activateSemester(s.id, y.id)}>Aktifkan</button>}
                </div>
              ))}
              <button className="text-xs text-brand-600 hover:underline" onClick={() => setSemModal(y)}>+ Tambah Semester</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Tahun Ajaran" size="sm">
        <form onSubmit={submitYear} className="space-y-4">
          <div><label className="label">Nama (mis. 2026/2027) *</label><input required className="input" value={form.name} onChange={(e) => setForm({ name: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button><button type="submit" className="btn btn-primary">Simpan</button></div>
        </form>
      </Modal>
      <Modal open={!!semModal} onClose={() => setSemModal(null)} title={`Tambah Semester — ${semModal?.name}`} size="sm">
        <form onSubmit={submitSemester} className="space-y-4">
          <div><label className="label">Nama Semester</label><select className="input" value={semForm.name} onChange={(e) => setSemForm({ name: e.target.value })}><option>Ganjil</option><option>Genap</option></select></div>
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={() => setSemModal(null)}>Batal</button><button type="submit" className="btn btn-primary">Simpan</button></div>
        </form>
      </Modal>
    </div>
  )
}

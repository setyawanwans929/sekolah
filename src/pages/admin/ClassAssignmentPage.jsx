import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listClasses, classStudents, unassignedStudents, assignStudentsToClass, removeStudentFromClass } from '../../services/classesService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function ClassAssignmentPage() {
  const toast = useToast()
  const [year, setYear] = useState(null)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [unassigned, setUnassigned] = useState([])
  const [members, setMembers] = useState([])
  const [checked, setChecked] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const y = await getActiveAcademicYear()
      setYear(y)
      const cls = await listClasses({ academicYearId: y?.id })
      setClasses(cls)
      const unassignedList = await unassignedStudents(y?.id)
      setUnassigned(unassignedList)
      if (selectedClass) setMembers(await classStudents(selectedClass))
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [selectedClass])
  useEffect(() => { load() }, [load])

  const toggle = (id) => setChecked((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id])

  const doAssign = async () => {
    if (!selectedClass || checked.length === 0) { toast.error('Pilih kelas tujuan dan minimal satu siswa.'); return }
    try {
      await assignStudentsToClass({ studentIds: checked, classId: selectedClass, academicYearId: year.id, semesterId: year.semesters?.find((s) => s.is_active)?.id })
      toast.success(`${checked.length} siswa berhasil dimasukkan ke kelas.`)
      setChecked([]); load()
    } catch (e) { toast.error(e.message) }
  }

  const doRemove = async (historyId) => {
    try { await removeStudentFromClass(historyId); toast.success('Siswa dikeluarkan dari kelas.'); load() }
    catch (e) { toast.error(e.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <Link to="/admin/classes" className="inline-flex items-center gap-1 text-sm text-brand-600"><ArrowLeft size={16} />Kembali</Link>
      <h1 className="text-xl font-bold">Pembagian Kelas</h1>
      <p className="text-sm text-gray-500">Satu siswa tidak dapat berada di dua kelas aktif pada tahun ajaran & semester yang sama — sistem otomatis menonaktifkan penempatan lama saat memindahkan siswa.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-3">Siswa Belum Memiliki Kelas ({unassigned.length})</h2>
          <div className="max-h-80 overflow-y-auto space-y-1 mb-3">
            {unassigned.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                <input type="checkbox" checked={checked.includes(s.id)} onChange={() => toggle(s.id)} />
                {s.full_name} <span className="text-gray-400">({s.nis})</span>
              </label>
            ))}
            {unassigned.length === 0 && <p className="text-sm text-gray-400">Semua siswa aktif sudah memiliki kelas.</p>}
          </div>
          <select className="input mb-2" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">- Pilih Kelas Tujuan -</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary w-full" onClick={doAssign}>Masukkan ke Kelas ({checked.length} dipilih)</button>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Anggota Kelas Terpilih</h2>
          {!selectedClass ? <p className="text-sm text-gray-400">Pilih kelas untuk melihat anggotanya.</p> : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {members.map((m) => (
                <div key={m.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span>{m.student.full_name} <span className="text-gray-400">({m.student.nis})</span></span>
                  <button className="text-red-600 text-xs hover:underline" onClick={() => doRemove(m.id)}>Keluarkan</button>
                </div>
              ))}
              {members.length === 0 && <p className="text-sm text-gray-400">Kelas ini belum memiliki siswa.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

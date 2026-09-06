import { useEffect, useState } from 'react'
import { attendanceRecap } from '../../services/attendanceService'
import { listClasses } from '../../services/classesService'
import { classStudents } from '../../services/classesService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToCsv } from '../../utils/csv'
import { Download } from 'lucide-react'

export default function AttendanceRecapPage() {
  const toast = useToast()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try { const y = await getActiveAcademicYear(); setClasses(await listClasses({ academicYearId: y?.id })) }
      catch (e) { toast.error(e.message) }
    })()
  }, [])

  useEffect(() => {
    if (!selectedClass) { setRows([]); setLoading(false); return }
    (async () => {
      setLoading(true)
      try {
        const students = await classStudents(selectedClass)
        const data = await Promise.all(students.map(async (m) => ({
          name: m.student.full_name, nis: m.student.nis,
          ...(await attendanceRecap({ studentId: m.student.id, classId: selectedClass })),
        })))
        setRows(data)
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [selectedClass])

  const handleExport = () => exportToCsv('rekap-absensi.csv', rows.map((r) => ({
    Nama: r.name, NIS: r.nis, Hadir: r.hadir, Sakit: r.sakit, Izin: r.izin, Alpa: r.alpa, Terlambat: r.terlambat, 'Persentase Kehadiran': `${r.percentage}%`,
  })))

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Rekap Absensi</h1><p className="text-sm text-gray-500">Kehadiran = Hadir / Total Pertemuan × 100%</p></div>
      <div className="card">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <select className="input max-w-xs" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">- Pilih Kelas -</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {rows.length > 0 && <button className="btn btn-outline" onClick={handleExport}><Download size={16} />Export CSV</button>}
        </div>
        {loading ? <LoadingSpinner /> : !selectedClass ? <p className="text-sm text-gray-400 text-center py-8">Pilih kelas untuk melihat rekap.</p> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Nama</th><th>NIS</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alpa</th><th>Terlambat</th><th>%</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.nis}><td className="font-medium">{r.name}</td><td>{r.nis}</td><td>{r.hadir}</td><td>{r.sakit}</td><td>{r.izin}</td><td>{r.alpa}</td><td>{r.terlambat}</td><td className="font-semibold">{r.percentage}%</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getReportCardData } from '../../services/reportCardsService'
import { getActiveSemester } from '../../services/academicYearsService'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Printer } from 'lucide-react'

export default function ReportCardPage({ studentIdOverride }) {
  const params = useParams()
  const studentId = studentIdOverride || params.studentId
  const toast = useToast()
  const [data, setData] = useState(null)
  const [semester, setSemester] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const sem = await getActiveSemester()
        setSemester(sem)
        setData(await getReportCardData({ studentId, semesterId: sem?.id }))
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [studentId])

  if (loading) return <LoadingSpinner />
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} />Cetak Rapor</button>
      </div>
      <div className="card print:shadow-none print:border-none" id="report-card">
        <div className="text-center border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
          <h1 className="font-bold text-lg">LAPORAN HASIL BELAJAR SISWA</h1>
          <p className="text-sm text-gray-500">Tahun Ajaran {semester?.academic_year?.name} · Semester {semester?.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
          <p><strong>Nama:</strong> {data.student.full_name}</p>
          <p><strong>NIS/NISN:</strong> {data.student.nis} / {data.student.nisn}</p>
          <p><strong>Kelas:</strong> {data.class?.name || '-'}</p>
          <p><strong>Wali Kelas:</strong> {data.class?.homeroom_teacher?.full_name || '-'}</p>
        </div>
        <table className="table-base border border-gray-200 dark:border-gray-800 mb-4">
          <thead><tr><th>Mata Pelajaran</th><th>KKM</th><th>Nilai Akhir</th><th>Predikat</th><th>Deskripsi</th></tr></thead>
          <tbody>{data.subjects.map((s) => (
            <tr key={s.name}><td>{s.name}</td><td>{s.kkm}</td><td className="font-semibold">{s.final ?? '-'}</td><td>{s.predicate}</td><td className="text-xs">{s.description}</td></tr>
          ))}</tbody>
        </table>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="font-semibold mb-1">Kehadiran</p>
            <p>Hadir: {data.attendance.hadir} · Sakit: {data.attendance.sakit} · Izin: {data.attendance.izin} · Alpa: {data.attendance.alpa}</p>
            <p>Persentase: {data.attendance.percentage}%</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Catatan Wali Kelas</p>
            <p className="text-gray-600 dark:text-gray-400">{data.homeroomNote?.note || 'Belum ada catatan.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

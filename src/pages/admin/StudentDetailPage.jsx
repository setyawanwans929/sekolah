import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getStudent } from '../../services/studentsService'
import { promotionHistory } from '../../services/promotionService'
import { attendanceRecap } from '../../services/attendanceService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorState from '../../components/common/ErrorState'
import Badge from '../../components/ui/Badge'
import { formatDate } from '../../utils/format'

export default function StudentDetailPage() {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [history, setHistory] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null)
      try {
        const [s, h, a] = await Promise.all([getStudent(id), promotionHistory(id), attendanceRecap({ studentId: id })])
        setStudent(s); setHistory(h); setAttendance(a)
      } catch (e) { setError(e.message) } finally { setLoading(false) }
    })()
  }, [id])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} />
  if (!student) return null

  return (
    <div className="space-y-4">
      <Link to="/admin/students" className="inline-flex items-center gap-1 text-sm text-brand-600"><ArrowLeft size={16} />Kembali</Link>
      <div className="card flex flex-col sm:flex-row gap-4">
        <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-400 shrink-0">
          {student.full_name?.[0]}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{student.full_name}</h1>
          <p className="text-sm text-gray-500">NIS {student.nis} · NISN {student.nisn}</p>
          <div className="mt-2"><Badge tone={student.status}>{student.status}</Badge></div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-64">
          <StatCard label="Rata-rata Kehadiran" value={`${attendance?.percentage ?? 0}%`} />
          <StatCard label="Total Pertemuan" value={attendance?.total ?? 0} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-3">Biodata</h2>
          <dl className="text-sm space-y-2">
            <Row label="Jenis Kelamin" value={student.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
            <Row label="Tempat, Tanggal Lahir" value={`${student.birth_place || '-'}, ${formatDate(student.birth_date)}`} />
            <Row label="Alamat" value={student.address || '-'} />
            <Row label="No. HP" value={student.phone || '-'} />
            <Row label="Email" value={student.email || '-'} />
            <Row label="Orang Tua" value={student.parent?.full_name || '-'} />
          </dl>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">Riwayat Kelas & Kenaikan</h2>
          {history.length === 0 ? <p className="text-sm text-gray-400">Belum ada riwayat.</p> : (
            <ul className="text-sm space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span>{h.previous_class?.name || '-'} → {h.new_class?.name || '-'}</span>
                  <span className="text-gray-400">{h.decision} · {formatDate(h.decided_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-brand-700 dark:text-brand-300">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  )
}
function Row({ label, value }) {
  return <div className="flex justify-between gap-4"><dt className="text-gray-500">{label}</dt><dd className="font-medium text-right">{value}</dd></div>
}

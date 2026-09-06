import { useEffect, useState } from 'react'
import { attendanceRecap } from '../../services/attendanceService'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function StudentAttendancePage({ studentIdOverride }) {
  const { profile } = useAuth()
  const studentId = studentIdOverride || profile.student_id
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => { setLoading(true); setData(await attendanceRecap({ studentId })); setLoading(false) })() }, [studentId])
  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Rekap Absensi</h1>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {['hadir', 'sakit', 'izin', 'alpa', 'terlambat'].map((k) => (
          <div key={k} className="card text-center"><p className="text-2xl font-bold text-brand-600">{data[k]}</p><p className="text-xs capitalize text-gray-500">{k}</p></div>
        ))}
      </div>
      <div className="card text-center"><p className="text-3xl font-bold text-green-600">{data.percentage}%</p><p className="text-sm text-gray-500">Persentase Kehadiran dari {data.total} pertemuan</p></div>
    </div>
  )
}

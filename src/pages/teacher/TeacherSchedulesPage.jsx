import { useEffect, useState } from 'react'
import { listSchedules } from '../../services/schedulesService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { DAYS } from '../../utils/format'

export default function TeacherSchedulesPage() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const y = await getActiveAcademicYear()
      setRows(await listSchedules({ teacherId: profile.teacher_id, semesterId: y?.semesters?.find((s) => s.is_active)?.id }))
      setLoading(false)
    })()
  }, [profile])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Jadwal Mengajar</h1>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Hari</th><th>Jam</th><th>Kelas</th><th>Mapel</th><th>Ruang</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td>{DAYS[r.day_of_week]}</td><td>{r.start_time?.slice(0,5)}–{r.end_time?.slice(0,5)}</td><td>{r.class.name}</td><td>{r.subject.name}</td><td>{r.room || '-'}</td></tr>)}</tbody>
        </table>
        {rows.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Belum ada jadwal mengajar.</p>}
      </div>
    </div>
  )
}

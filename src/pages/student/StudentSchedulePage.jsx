import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { listSchedules } from '../../services/schedulesService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { DAYS } from '../../utils/format'

export default function StudentSchedulePage({ studentIdOverride }) {
  const { profile } = useAuth()
  const studentId = studentIdOverride || profile.student_id
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const y = await getActiveAcademicYear()
      const sem = y?.semesters?.find((s) => s.is_active)
      const { data: hist } = await supabase.from('student_class_history').select('class_id').eq('student_id', studentId).eq('is_active', true).maybeSingle()
      if (hist) setRows(await listSchedules({ classId: hist.class_id, semesterId: sem?.id }))
      setLoading(false)
    })()
  }, [studentId])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Jadwal Pelajaran</h1>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Hari</th><th>Jam</th><th>Mapel</th><th>Guru</th><th>Ruang</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td>{DAYS[r.day_of_week]}</td><td>{r.start_time?.slice(0,5)}–{r.end_time?.slice(0,5)}</td><td>{r.subject.name}</td><td>{r.teacher.full_name}</td><td>{r.room || '-'}</td></tr>)}</tbody>
        </table>
        {rows.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Belum ada jadwal.</p>}
      </div>
    </div>
  )
}

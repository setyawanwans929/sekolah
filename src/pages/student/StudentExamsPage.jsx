import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { listExams } from '../../services/examsService'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/format'

function Countdown({ date }) {
  const days = Math.ceil((new Date(date) - new Date()) / 86400000)
  if (days < 0) return <span className="text-gray-400">Selesai</span>
  if (days === 0) return <span className="text-red-600 font-semibold">Hari ini</span>
  return <span className="text-brand-600 font-semibold">{days} hari lagi</span>
}

export default function StudentExamsPage({ studentIdOverride }) {
  const { profile } = useAuth()
  const studentId = studentIdOverride || profile.student_id
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data: hist } = await supabase.from('student_class_history').select('class_id').eq('student_id', studentId).eq('is_active', true).maybeSingle()
      if (hist) setRows(await listExams({ classId: hist.class_id }))
      setLoading(false)
    })()
  }, [studentId])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Jadwal Ujian</h1>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="card flex justify-between items-center">
            <div><p className="font-semibold">{r.name}</p><p className="text-sm text-gray-500">{r.subject?.name} · {formatDate(r.exam_date)} {r.start_time?.slice(0,5)} · Ruang {r.room || '-'}</p></div>
            <Countdown date={r.exam_date} />
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400">Tidak ada jadwal ujian.</p>}
      </div>
    </div>
  )
}

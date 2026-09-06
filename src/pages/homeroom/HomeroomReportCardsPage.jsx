import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { classStudents } from '../../services/classesService'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { FileText } from 'lucide-react'

export default function HomeroomReportCardsPage() {
  const { profile } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data: classRow } = await supabase.from('classes').select('id').eq('homeroom_teacher_id', profile.teacher_id).maybeSingle()
      if (classRow) { const m = await classStudents(classRow.id); setStudents(m.map((x) => x.student)) }
      setLoading(false)
    })()
  }, [profile])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Rapor Siswa</h1>
      <div className="card divide-y divide-gray-100 dark:divide-gray-800">
        {students.map((s) => (
          <Link key={s.id} to={`/homeroom/report-cards/${s.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 -mx-2 rounded">
            <span className="flex items-center gap-2"><FileText size={16} className="text-brand-600" />{s.full_name}</span>
            <span className="text-sm text-gray-400">{s.nis}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

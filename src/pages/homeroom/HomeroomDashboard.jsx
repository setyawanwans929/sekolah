import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { classStudents } from '../../services/classesService'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Users, FileText, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomeroomDashboard() {
  const { profile } = useAuth()
  const [className, setClassName] = useState('')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data: classRow } = await supabase.from('classes').select('id, name').eq('homeroom_teacher_id', profile.teacher_id).maybeSingle()
      if (classRow) { setClassName(classRow.name); const m = await classStudents(classRow.id); setTotal(m.length) }
      setLoading(false)
    })()
  }, [profile])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold">Dashboard Wali Kelas</h1><p className="text-sm text-gray-500">Kelas: <strong>{className || 'Belum ditetapkan'}</strong> · {total} siswa</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/homeroom/students" className="card flex flex-col items-center gap-2 py-6 hover:border-brand-400"><Users className="text-brand-600" size={24} /><span className="text-sm font-medium">Siswa Kelas</span></Link>
        <Link to="/homeroom/report-cards" className="card flex flex-col items-center gap-2 py-6 hover:border-brand-400"><FileText className="text-brand-600" size={24} /><span className="text-sm font-medium">Rapor Siswa</span></Link>
        <Link to="/homeroom/promotion" className="card flex flex-col items-center gap-2 py-6 hover:border-brand-400"><TrendingUp className="text-brand-600" size={24} /><span className="text-sm font-medium">Kenaikan Kelas</span></Link>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { attendanceRecap } from '../../services/attendanceService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useParentChild } from '../../context/ParentChildContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

export default function ParentDashboard() {
  const { selected, kids } = useParentChild()
  const [info, setInfo] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [avgGrade, setAvgGrade] = useState('-')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selected) { setLoading(false); return }
    (async () => {
      setLoading(true)
      const { data: student } = await supabase.from('students').select('*').eq('id', selected).single()
      const { data: hist } = await supabase.from('student_class_history').select('class:class_id(name, homeroom_teacher:homeroom_teacher_id(full_name))').eq('student_id', selected).eq('is_active', true).maybeSingle()
      setInfo({ student, class: hist?.class })
      const y = await getActiveAcademicYear()
      const sem = y?.semesters?.find((s) => s.is_active)
      setAttendance(await attendanceRecap({ studentId: selected, semesterId: sem?.id }))
      const { data: grades } = await supabase.from('grades').select('score').eq('student_id', selected).eq('semester_id', sem?.id)
      if (grades?.length) setAvgGrade((grades.reduce((a, g) => a + g.score, 0) / grades.length).toFixed(1))
      setLoading(false)
    })()
  }, [selected])

  if (kids.length === 0) return <EmptyState message="Belum ada data anak yang terhubung dengan akun ini." />
  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="font-bold text-lg">{info?.student?.full_name}</h1>
        <p className="text-sm text-gray-500">Kelas {info?.class?.name || '-'} · Wali Kelas: {info?.class?.homeroom_teacher?.full_name || '-'}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-2xl font-bold text-brand-600">{avgGrade}</p><p className="text-xs text-gray-500">Rata-rata Nilai</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-brand-600">{attendance?.percentage ?? 0}%</p><p className="text-xs text-gray-500">Kehadiran</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-brand-600">{attendance?.total ?? 0}</p><p className="text-xs text-gray-500">Total Pertemuan</p></div>
      </div>
    </div>
  )
}

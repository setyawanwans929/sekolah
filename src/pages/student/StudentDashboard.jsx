import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { listSchedules } from '../../services/schedulesService'
import { attendanceRecap } from '../../services/attendanceService'
import { listAnnouncements } from '../../services/announcementsService'
import { supabase } from '../../lib/supabase'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { DAYS } from '../../utils/format'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const toast = useToast()
  const [today, setToday] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [avgGrade, setAvgGrade] = useState('-')
  const [announcements, setAnnouncements] = useState([])
  const [classInfo, setClassInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const y = await getActiveAcademicYear()
        const sem = y?.semesters?.find((s) => s.is_active)
        const { data: hist } = await supabase.from('student_class_history').select('class:class_id(name, homeroom_teacher:homeroom_teacher_id(full_name))').eq('student_id', profile.student_id).eq('is_active', true).maybeSingle()
        setClassInfo(hist?.class)
        const sch = await listSchedules({ classId: hist?.class?.id, semesterId: sem?.id })
        setToday(sch.filter((s) => s.day_of_week === new Date().getDay()))
        setAttendance(await attendanceRecap({ studentId: profile.student_id, semesterId: sem?.id }))
        const { data: grades } = await supabase.from('grades').select('score').eq('student_id', profile.student_id).eq('semester_id', sem?.id)
        if (grades?.length) setAvgGrade((grades.reduce((a, g) => a + g.score, 0) / grades.length).toFixed(1))
        setAnnouncements((await listAnnouncements({ target: 'siswa' })).slice(0, 5))
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [profile])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xl font-bold text-brand-700">{profile.full_name?.[0]}</div>
        <div>
          <h1 className="font-bold text-lg">{profile.full_name}</h1>
          <p className="text-sm text-gray-500">NIS {profile.nis} · Kelas {classInfo?.name || '-'} · Wali Kelas: {classInfo?.homeroom_teacher?.full_name || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Rata-rata Nilai" value={avgGrade} />
        <Stat label="Kehadiran" value={`${attendance?.percentage ?? 0}%`} />
        <Stat label="Total Pertemuan" value={attendance?.total ?? 0} />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Jadwal Hari Ini ({DAYS[new Date().getDay()]})</h3>
        {today.length === 0 ? <p className="text-sm text-gray-400">Tidak ada jadwal.</p> : (
          <ul className="text-sm divide-y divide-gray-100 dark:divide-gray-800">{today.map((s) => <li key={s.id} className="py-2 flex justify-between"><span>{s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)} · {s.subject.name}</span><span className="text-gray-400">{s.teacher.full_name}</span></li>)}</ul>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Pengumuman</h3>
        {announcements.length === 0 ? <p className="text-sm text-gray-400">Tidak ada pengumuman.</p> : <ul className="text-sm space-y-2">{announcements.map((a) => <li key={a.id}><strong>{a.title}</strong> — {a.content}</li>)}</ul>}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return <div className="card text-center"><p className="text-2xl font-bold text-brand-600">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
}

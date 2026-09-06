import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSchedules } from '../../services/schedulesService'
import { listAnnouncements } from '../../services/announcementsService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ClipboardCheck, PenSquare, CalendarClock, Users } from 'lucide-react'
import { DAYS } from '../../utils/format'

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const toast = useToast()
  const [today, setToday] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const y = await getActiveAcademicYear()
        const sem = y?.semesters?.find((s) => s.is_active)
        const all = await listSchedules({ teacherId: profile.teacher_id, semesterId: sem?.id })
        const dow = new Date().getDay()
        setToday(all.filter((s) => s.day_of_week === dow))
        setAnnouncements((await listAnnouncements({ target: 'guru' })).slice(0, 5))
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [profile])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold">Dashboard Guru</h1><p className="text-sm text-gray-500">Selamat datang, {profile.full_name}.</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickLink to="/teacher/attendance" icon={ClipboardCheck} label="Input Absensi" />
        <QuickLink to="/teacher/grades" icon={PenSquare} label="Input Nilai" />
        <QuickLink to="/teacher/schedules" icon={CalendarClock} label="Jadwal" />
        <QuickLink to="/teacher/schedules" icon={Users} label="Siswa" />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Jadwal Mengajar Hari Ini ({DAYS[new Date().getDay()]})</h3>
        {today.length === 0 ? <p className="text-sm text-gray-400">Tidak ada jadwal mengajar hari ini.</p> : (
          <ul className="text-sm divide-y divide-gray-100 dark:divide-gray-800">
            {today.map((s) => <li key={s.id} className="py-2 flex justify-between"><span>{s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)} · {s.subject.name}</span><span className="text-gray-400">{s.class.name} · {s.room || '-'}</span></li>)}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Pengumuman</h3>
        {announcements.length === 0 ? <p className="text-sm text-gray-400">Tidak ada pengumuman.</p> : (
          <ul className="text-sm space-y-2">{announcements.map((a) => <li key={a.id}><strong>{a.title}</strong> — {a.content}</li>)}</ul>
        )}
      </div>
    </div>
  )
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="card flex flex-col items-center justify-center gap-2 py-6 hover:border-brand-400 transition-colors">
      <Icon className="text-brand-600" size={22} /><span className="text-sm font-medium">{label}</span>
    </Link>
  )
}

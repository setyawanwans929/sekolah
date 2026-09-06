import { useEffect, useState } from 'react'
import { Users, GraduationCap, School, BookOpen } from 'lucide-react'
import { adminStats, studentsPerClass, recentActivity, atRiskStudents } from '../../services/dashboardService'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ChartCard from '../../components/common/ChartCard'
import { formatDateTime } from '../../utils/format'
import { AlertTriangle } from 'lucide-react'

export default function AdminDashboard() {
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [perClass, setPerClass] = useState([])
  const [activity, setActivity] = useState([])
  const [risky, setRisky] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [s, pc, act, risk] = await Promise.all([adminStats(), studentsPerClass(), recentActivity(8), atRiskStudents()])
        setStats(s); setPerClass(pc); setActivity(act); setRisky(risk.slice(0, 5))
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold">Dashboard Admin</h1><p className="text-sm text-gray-500">Ringkasan kondisi akademik sekolah hari ini.</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Siswa" value={stats.totalStudents} />
        <StatCard icon={GraduationCap} label="Total Guru" value={stats.totalTeachers} />
        <StatCard icon={School} label="Total Kelas" value={stats.totalClasses} />
        <StatCard icon={BookOpen} label="Total Mapel" value={stats.totalSubjects} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(stats.todayAttendance).map(([k, v]) => (
          <div key={k} className="card text-center py-3"><p className="text-2xl font-bold text-brand-600">{v}</p><p className="text-xs capitalize text-gray-500">{k}</p></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Jumlah Siswa per Kelas" data={perClass} dataKey="count" nameKey="name" />
        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" />Perlu Perhatian Akademik</h3>
          {risky.length === 0 ? <p className="text-sm text-gray-400">Tidak ada siswa yang memerlukan perhatian khusus saat ini.</p> : (
            <ul className="text-sm space-y-2">{risky.map((r) => <li key={r.studentId} className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-1"><span>{r.name}</span><span className="text-amber-600">{r.reason} — rata-rata {r.value}</span></li>)}</ul>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Aktivitas Terbaru</h3>
        {activity.length === 0 ? <p className="text-sm text-gray-400">Belum ada aktivitas.</p> : (
          <ul className="text-sm space-y-2">{activity.map((a) => <li key={a.id} className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-1"><span>{a.action}{a.detail ? ` — ${a.detail}` : ''}</span><span className="text-gray-400">{formatDateTime(a.created_at)}</span></li>)}</ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600"><Icon size={20} /></div>
      <div><p className="text-xl font-bold">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
    </div>
  )
}

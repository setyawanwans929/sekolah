import { useEffect, useState } from 'react'
import { QrCode, CheckCheck, Save } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { listSchedules } from '../../services/schedulesService'
import { createSession, listSessionAttendance, upsertAttendance, markAllPresent } from '../../services/attendanceService'
import { classStudents } from '../../services/classesService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { logActivity } from '../../services/auditLogService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/ui/Badge'

const STATUSES = ['hadir', 'sakit', 'izin', 'alpa', 'terlambat']

export default function TeacherAttendancePage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [year, setYear] = useState(null)
  const [mySchedules, setMySchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [meetingNumber, setMeetingNumber] = useState(1)
  const [session, setSession] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrEnabled, setQrEnabled] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const y = await getActiveAcademicYear()
        setYear(y)
        const teacherRow = profile.teacher_id
        const sch = await listSchedules({ teacherId: teacherRow, semesterId: y?.semesters?.find((s) => s.is_active)?.id })
        setMySchedules(sch)
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [profile])

  const startSession = async () => {
    const sched = mySchedules.find((s) => s.id === selectedSchedule)
    if (!sched) { toast.error('Pilih jadwal terlebih dahulu.'); return }
    try {
      const sem = year.semesters.find((s) => s.is_active)
      const sess = await createSession({
        classId: sched.class.id, subjectId: sched.subject.id, teacherId: profile.teacher_id,
        date, meetingNumber, academicYearId: year.id, semesterId: sem.id, qrEnabled,
      })
      setSession(sess)
      const students = await classStudents(sched.class.id)
      const initial = students.map((s) => ({ student: s.student, status: 'hadir', id: null }))
      setAttendance(initial)
      await logActivity({ userId: profile.id, role: profile.role, action: 'Buat sesi absensi', relatedTable: 'attendance_sessions', relatedId: sess.id, detail: sched.class.name })
    } catch (e) { toast.error(e.message) }
  }

  const setStatus = async (studentId, status) => {
    setAttendance((prev) => prev.map((a) => a.student.id === studentId ? { ...a, status } : a))
    try { await upsertAttendance({ sessionId: session.id, studentId, status }) } catch (e) { toast.error(e.message) }
  }

  const allPresent = async () => {
    try {
      await markAllPresent(session.id, attendance.map((a) => a.student.id))
      setAttendance((prev) => prev.map((a) => ({ ...a, status: 'hadir' })))
      toast.success('Semua siswa ditandai hadir.')
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Input Absensi</h1><p className="text-sm text-gray-500">Pilih jadwal mengajar untuk membuka sesi absensi.</p></div>

      {!session ? (
        <div className="card space-y-4 max-w-lg">
          <div>
            <label className="label">Jadwal Mengajar</label>
            <select className="input" value={selectedSchedule} onChange={(e) => setSelectedSchedule(e.target.value)}>
              <option value="">- Pilih Jadwal -</option>
              {mySchedules.map((s) => <option key={s.id} value={s.id}>{s.class.name} · {s.subject.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tanggal</label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="label">Pertemuan Ke-</label><input type="number" className="input" value={meetingNumber} onChange={(e) => setMeetingNumber(Number(e.target.value))} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={qrEnabled} onChange={(e) => setQrEnabled(e.target.checked)} />Aktifkan absensi via QR Code (siswa scan sendiri, berlaku 15 menit)</label>
          <button className="btn btn-primary" onClick={startSession}>Mulai Sesi Absensi</button>
        </div>
      ) : (
        <div className="space-y-4">
          {session.qr_enabled && (
            <div className="card flex flex-col items-center gap-3 max-w-xs">
              <p className="text-sm font-medium flex items-center gap-1"><QrCode size={16} />Scan untuk Absen</p>
              <QRCodeSVG value={session.qr_token} size={180} />
              <p className="text-xs text-gray-400">Berlaku hingga {new Date(session.qr_expires_at).toLocaleTimeString('id-ID')}</p>
            </div>
          )}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Daftar Hadir ({attendance.length} siswa)</h2>
              <button className="btn btn-outline" onClick={allPresent}><CheckCheck size={16} />Tandai Semua Hadir</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>Siswa</th><th>NIS</th><th>Status</th></tr></thead>
                <tbody>{attendance.map((a) => (
                  <tr key={a.student.id}>
                    <td className="font-medium">{a.student.full_name}</td><td>{a.student.nis}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {STATUSES.map((s) => (
                          <button key={s} onClick={() => setStatus(a.student.id, s)} className={`text-xs px-2 py-1 rounded-full border ${a.status === s ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 dark:border-gray-700'}`}>{s}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => setSession(null)}>Tutup Sesi</button>
        </div>
      )}
    </div>
  )
}

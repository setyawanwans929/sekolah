import { useEffect, useState } from 'react'
import { Lock, Unlock, Save } from 'lucide-react'
import { listSchedules } from '../../services/schedulesService'
import { classStudents } from '../../services/classesService'
import { listGrades, upsertGrade, lockGrades, unlockGrades } from '../../services/gradesService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/ui/Badge'

const COMPONENTS = ['tugas', 'kuis', 'ulangan', 'uts', 'uas', 'praktik', 'proyek']

export default function TeacherGradesPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [year, setYear] = useState(null)
  const [mySchedules, setMySchedules] = useState([])
  const [selected, setSelected] = useState('')
  const [component, setComponent] = useState('tugas')
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState({}) // studentId -> {score, status}
  const [loading, setLoading] = useState(true)
  const isLocked = students.length > 0 && students.every((s) => grades[s.id]?.status === 'terkunci')

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const y = await getActiveAcademicYear()
        setYear(y)
        setMySchedules(await listSchedules({ teacherId: profile.teacher_id, semesterId: y?.semesters?.find((s) => s.is_active)?.id }))
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [profile])

  useEffect(() => {
    if (!selected) return
    (async () => {
      setLoading(true)
      const sched = mySchedules.find((s) => s.id === selected)
      try {
        const members = await classStudents(sched.class.id)
        setStudents(members.map((m) => m.student))
        const sem = year.semesters.find((s) => s.is_active)
        const existing = await listGrades({ classId: sched.class.id, subjectId: sched.subject.id, semesterId: sem.id })
        const map = {}
        existing.filter((g) => g.component === component).forEach((g) => { map[g.student.id] = { score: g.score, status: g.status } })
        setGrades(map)
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [selected, component])

  const setScore = (studentId, score) => setGrades((g) => ({ ...g, [studentId]: { ...g[studentId], score: Number(score) } }))

  const saveAll = async () => {
    const sched = mySchedules.find((s) => s.id === selected)
    const sem = year.semesters.find((s) => s.is_active)
    try {
      await Promise.all(students.map((s) => {
        const val = grades[s.id]?.score
        if (val === undefined || val === '') return null
        return upsertGrade({ studentId: s.id, subjectId: sched.subject.id, teacherId: profile.teacher_id, component, score: val, semesterId: sem.id, academicYearId: year.id })
      }))
      toast.success('Nilai berhasil disimpan sebagai draft.')
    } catch (e) { toast.error(e.message) }
  }

  const toggleLock = async () => {
    const sched = mySchedules.find((s) => s.id === selected)
    const sem = year.semesters.find((s) => s.is_active)
    try {
      if (isLocked) { await unlockGrades({ classId: sched.class.id, subjectId: sched.subject.id, semesterId: sem.id }); toast.success('Nilai dibuka kembali.') }
      else { await lockGrades({ classId: sched.class.id, subjectId: sched.subject.id, semesterId: sem.id, lockedBy: profile.id }); toast.success('Nilai berhasil dikunci.') }
      setSelected(''); setTimeout(() => setSelected(selected), 0)
    } catch (e) { toast.error(e.message) }
  }

  if (loading && !selected) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Input Nilai</h1><p className="text-sm text-gray-500">Simpan sebagai draft, lalu kunci nilai setelah selesai.</p></div>
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Jadwal (Kelas · Mapel)</label>
            <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">- Pilih -</option>{mySchedules.map((s) => <option key={s.id} value={s.id}>{s.class.name} · {s.subject.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Jenis Komponen</label>
            <select className="input" value={component} onChange={(e) => setComponent(e.target.value)}>{COMPONENTS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </div>
        </div>

        {selected && students.length > 0 && (
          <>
            <div className="flex justify-between items-center">
              {isLocked ? <Badge tone="terkunci">Terkunci</Badge> : <Badge tone="draft">Draft</Badge>}
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={toggleLock}>{isLocked ? <Unlock size={16} /> : <Lock size={16} />}{isLocked ? 'Buka Nilai' : 'Kunci Nilai'}</button>
                <button className="btn btn-primary" disabled={isLocked} onClick={saveAll}><Save size={16} />Simpan Draft</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>Siswa</th><th>NIS</th><th>Nilai (0-100)</th></tr></thead>
                <tbody>{students.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.full_name}</td><td>{s.nis}</td>
                    <td><input type="number" min="0" max="100" disabled={isLocked} className="input w-24" value={grades[s.id]?.score ?? ''} onChange={(e) => setScore(s.id, e.target.value)} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

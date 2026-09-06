import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { classStudents } from '../../services/classesService'
import { getActiveSemester } from '../../services/academicYearsService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Save } from 'lucide-react'

export default function HomeroomNotesPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [students, setStudents] = useState([])
  const [notes, setNotes] = useState({})
  const [semester, setSemester] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const sem = await getActiveSemester()
        setSemester(sem)
        const { data: classRow } = await supabase.from('classes').select('id').eq('homeroom_teacher_id', profile.teacher_id).maybeSingle()
        if (!classRow) { setLoading(false); return }
        const members = await classStudents(classRow.id)
        setStudents(members.map((m) => m.student))
        const { data: existing } = await supabase.from('homeroom_notes').select('*').eq('semester_id', sem?.id)
        const map = {}
        ;(existing || []).forEach((n) => { map[n.student_id] = n.note })
        setNotes(map)
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [profile])

  const save = async (studentId) => {
    try {
      await supabase.from('homeroom_notes').upsert({ student_id: studentId, semester_id: semester.id, note: notes[studentId] || '', created_by: profile.id }, { onConflict: 'student_id,semester_id' })
      toast.success('Catatan tersimpan.')
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Catatan Wali Kelas</h1><p className="text-sm text-gray-500">Catatan akademik, perkembangan, sikap, dan saran untuk siswa.</p></div>
      {students.length === 0 ? <p className="text-sm text-gray-400">Kamu belum ditetapkan sebagai wali kelas manapun.</p> : (
        <div className="space-y-3">
          {students.map((s) => (
            <div key={s.id} className="card">
              <p className="font-medium mb-2">{s.full_name} <span className="text-gray-400 text-sm">({s.nis})</span></p>
              <textarea rows={3} className="input mb-2" value={notes[s.id] || ''} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })} placeholder="Tuliskan catatan akademik, perkembangan, sikap, atau saran..." />
              <button className="btn btn-primary" onClick={() => save(s.id)}><Save size={16} />Simpan Catatan</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

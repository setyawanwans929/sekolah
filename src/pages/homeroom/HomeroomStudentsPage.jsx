import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { classStudents } from '../../services/classesService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Badge from '../../components/ui/Badge'

export default function HomeroomStudentsPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [className, setClassName] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const { data: classRow } = await supabase.from('classes').select('id, name').eq('homeroom_teacher_id', profile.teacher_id).maybeSingle()
        if (!classRow) { setLoading(false); return }
        setClassName(classRow.name)
        const members = await classStudents(classRow.id)
        setStudents(members.map((m) => m.student))
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [profile])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Siswa Kelas {className || '-'}</h1><p className="text-sm text-gray-500">Daftar siswa yang menjadi tanggung jawab wali kelas.</p></div>
      <div className="card">
        {students.length === 0 ? <EmptyState message="Kamu belum ditetapkan sebagai wali kelas." /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>NIS</th><th>Nama</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>{students.map((s) => (
                <tr key={s.id}>
                  <td>{s.nis}</td><td className="font-medium">{s.full_name}</td><td><Badge tone={s.status}>{s.status}</Badge></td>
                  <td className="text-right"><Link to={`/homeroom/report-cards/${s.id}`} className="text-brand-600 text-sm hover:underline">Lihat Rapor</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

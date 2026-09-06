import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getActiveSemester } from '../../services/academicYearsService'
import { getGradeWeights, computeFinalScore, scoreToPredicate } from '../../services/gradesService'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function StudentGradesPage({ studentIdOverride }) {
  const { profile } = useAuth()
  const studentId = studentIdOverride || profile.student_id
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const sem = await getActiveSemester()
      const { data: grades } = await supabase.from('grades').select('component, score, subject:subject_id(id, name, kkm)').eq('student_id', studentId).eq('semester_id', sem?.id)
      const { data: ranges } = await supabase.from('predicate_ranges').select('*')
      const weights = await getGradeWeights()
      const bySubject = {}
      ;(grades || []).forEach((g) => { bySubject[g.subject.id] ??= { subject: g.subject, comps: {} }; bySubject[g.subject.id].comps[g.component] = g.score })
      setRows(Object.values(bySubject).map((s) => {
        const final = computeFinalScore(s.comps, weights)
        return { name: s.subject.name, kkm: s.subject.kkm, final, predicate: final != null ? scoreToPredicate(final, ranges) : '-' }
      }))
      setLoading(false)
    })()
  }, [studentId])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Nilai Saya</h1>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Mata Pelajaran</th><th>KKM</th><th>Nilai Akhir</th><th>Predikat</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.name}><td className="font-medium">{r.name}</td><td>{r.kkm}</td><td className="font-semibold">{r.final ?? '-'}</td><td>{r.predicate}</td></tr>)}</tbody>
        </table>
        {rows.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Belum ada nilai untuk semester ini.</p>}
      </div>
    </div>
  )
}

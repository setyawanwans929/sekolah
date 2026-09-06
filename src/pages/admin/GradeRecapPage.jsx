import { useEffect, useState } from 'react'
import { listClasses, classStudents } from '../../services/classesService'
import { listSubjects } from '../../services/subjectsService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { supabase } from '../../lib/supabase'
import { getGradeWeights, computeFinalScore } from '../../services/gradesService'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToCsv } from '../../utils/csv'
import { Download } from 'lucide-react'

export default function GradeRecapPage() {
  const toast = useToast()
  const [classes, setClasses] = useState([]); const [subjects, setSubjects] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [rankingEnabled, setRankingEnabled] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const y = await getActiveAcademicYear()
        setClasses(await listClasses({ academicYearId: y?.id }))
        setSubjects(await listSubjects())
      } catch (e) { toast.error(e.message) }
    })()
  }, [])

  useEffect(() => {
    if (!selectedClass) { setRows([]); setLoading(false); return }
    (async () => {
      setLoading(true)
      try {
        const y = await getActiveAcademicYear()
        const sem = y?.semesters?.find((s) => s.is_active)
        const members = await classStudents(selectedClass)
        const weights = await getGradeWeights()
        const { data: allGrades } = await supabase.from('grades').select('student_id, subject_id, component, score').eq('semester_id', sem?.id)
        const data = members.map((m) => {
          const perSubject = {}
          subjects.forEach((subj) => {
            const comps = {}
            ;(allGrades || []).filter((g) => g.student_id === m.student.id && g.subject_id === subj.id).forEach((g) => { comps[g.component] = g.score })
            perSubject[subj.name] = computeFinalScore(comps, weights)
          })
          const values = Object.values(perSubject).filter((v) => v != null)
          const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '-'
          return { name: m.student.full_name, nis: m.student.nis, ...perSubject, average: avg }
        })
        if (rankingEnabled) data.sort((a, b) => (b.average === '-' ? 0 : b.average) - (a.average === '-' ? 0 : a.average))
        setRows(data)
      } catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [selectedClass, rankingEnabled])

  const handleExport = () => exportToCsv('rekap-nilai.csv', rows)

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Rekap Nilai Kelas</h1><p className="text-sm text-gray-500">Rata-rata dihitung dari nilai akhir tiap mata pelajaran.</p></div>
      <div className="card">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <select className="input max-w-xs" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">- Pilih Kelas -</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rankingEnabled} onChange={(e) => setRankingEnabled(e.target.checked)} />Tampilkan Ranking</label>
          {rows.length > 0 && <button className="btn btn-outline" onClick={handleExport}><Download size={16} />Export CSV</button>}
        </div>
        {loading ? <LoadingSpinner /> : !selectedClass ? <p className="text-sm text-gray-400 text-center py-8">Pilih kelas.</p> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr>{rankingEnabled && <th>Rank</th>}<th>Nama</th><th>NIS</th>{subjects.map((s) => <th key={s.id}>{s.name}</th>)}<th>Rata-rata</th></tr></thead>
              <tbody>{rows.map((r, i) => (
                <tr key={r.nis}>{rankingEnabled && <td>{i + 1}</td>}<td className="font-medium">{r.name}</td><td>{r.nis}</td>
                  {subjects.map((s) => <td key={s.id}>{r[s.name] ?? '-'}</td>)}<td className="font-semibold">{r.average}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { listClasses, classStudents } from '../../services/classesService'
import { getActiveAcademicYear } from '../../services/academicYearsService'
import { promoteStudents } from '../../services/promotionService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { logActivity } from '../../services/auditLogService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ArrowRight } from 'lucide-react'

const DECISIONS = [
  { value: 'naik', label: 'Naik Kelas' },
  { value: 'tinggal', label: 'Tinggal Kelas' },
  { value: 'lulus', label: 'Lulus' },
  { value: 'pindah', label: 'Pindah' },
]

export default function PromotionPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [year, setYear] = useState(null)
  const [classes, setClasses] = useState([])
  const [fromClass, setFromClass] = useState('')
  const [toClass, setToClass] = useState('')
  const [decision, setDecision] = useState('naik')
  const [students, setStudents] = useState([])
  const [checked, setChecked] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try { const y = await getActiveAcademicYear(); setYear(y); setClasses(await listClasses({ academicYearId: y?.id })) }
      catch (e) { toast.error(e.message) } finally { setLoading(false) }
    })()
  }, [])

  useEffect(() => {
    if (!fromClass) return
    (async () => {
      try { const members = await classStudents(fromClass); setStudents(members.map((m) => m.student)); setChecked([]) }
      catch (e) { toast.error(e.message) }
    })()
  }, [fromClass])

  const toggle = (id) => setChecked((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id])
  const toggleAll = () => setChecked(checked.length === students.length ? [] : students.map((s) => s.id))

  const submit = async () => {
    if (checked.length === 0) { toast.error('Pilih minimal satu siswa.'); return }
    if (decision === 'naik' && !toClass) { toast.error('Pilih kelas tujuan untuk kenaikan kelas.'); return }
    try {
      const sem = year.semesters.find((s) => s.is_active)
      await promoteStudents({ studentIds: checked, fromClassId: fromClass, toClassId: toClass, decision, academicYearId: year.id, semesterId: sem?.id, decidedBy: profile.id })
      await logActivity({ userId: profile.id, role: profile.role, action: 'Kenaikan kelas', relatedTable: 'class_promotions', detail: `${checked.length} siswa - ${decision}` })
      toast.success(`${checked.length} siswa berhasil diproses (${decision}).`)
      setChecked([])
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Kenaikan Kelas</h1><p className="text-sm text-gray-500">Riwayat kelas lama tidak dihapus — histori tersimpan permanen.</p></div>
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="label">Kelas Asal</label><select className="input" value={fromClass} onChange={(e) => setFromClass(e.target.value)}><option value="">- Pilih -</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Keputusan</label><select className="input" value={decision} onChange={(e) => setDecision(e.target.value)}>{DECISIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
          {decision === 'naik' && <div><label className="label">Kelas Tujuan</label><select className="input" value={toClass} onChange={(e) => setToClass(e.target.value)}><option value="">- Pilih -</option>{classes.filter((c) => c.id !== fromClass).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
        </div>

        {students.length > 0 && (
          <>
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked.length === students.length} onChange={toggleAll} />Pilih Semua</label>
              <span className="text-sm text-gray-500">{checked.length} dari {students.length} dipilih</span>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1 border border-gray-100 dark:border-gray-800 rounded-lg p-2">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input type="checkbox" checked={checked.includes(s.id)} onChange={() => toggle(s.id)} />{s.full_name} <span className="text-gray-400">({s.nis})</span>
                </label>
              ))}
            </div>
            <button className="btn btn-primary" onClick={submit}>Proses {checked.length} Siswa <ArrowRight size={16} /></button>
          </>
        )}
      </div>
    </div>
  )
}

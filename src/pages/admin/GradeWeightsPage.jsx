import { useEffect, useState } from 'react'
import { getGradeWeights, updateGradeWeight } from '../../services/gradesService'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Save } from 'lucide-react'

export default function GradeWeightsPage() {
  const toast = useToast()
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => { setLoading(true); try { setWeights(await getGradeWeights()) } catch (e) { toast.error(e.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const change = (component, value) => setWeights((w) => w.map((x) => x.component === component ? { ...x, weight: Number(value) } : x))
  const total = weights.reduce((a, w) => a + Number(w.weight || 0), 0)

  const save = async () => {
    if (total !== 100) { toast.error('Total bobot harus 100%.'); return }
    try { await Promise.all(weights.map((w) => updateGradeWeight(w.component, w.weight))); toast.success('Bobot nilai diperbarui.') }
    catch (e) { toast.error(e.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4 max-w-lg">
      <div><h1 className="text-xl font-bold">Konfigurasi Bobot Nilai</h1><p className="text-sm text-gray-500">Nilai akhir = Σ (nilai komponen × bobot%). Total bobot harus 100%.</p></div>
      <div className="card space-y-3">
        {weights.map((w) => (
          <div key={w.component} className="flex items-center justify-between gap-3">
            <label className="capitalize text-sm">{w.component}</label>
            <div className="flex items-center gap-2">
              <input type="number" className="input w-24" value={w.weight} onChange={(e) => change(w.component, e.target.value)} />
              <span className="text-sm text-gray-400">%</span>
            </div>
          </div>
        ))}
        <div className={`text-sm font-medium ${total === 100 ? 'text-green-600' : 'text-red-600'}`}>Total: {total}%</div>
        <button className="btn btn-primary" onClick={save}><Save size={16} />Simpan</button>
      </div>
    </div>
  )
}

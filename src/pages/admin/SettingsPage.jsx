import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Save, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SettingsPage() {
  const toast = useToast()
  const [ranges, setRanges] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const { data, error } = await supabase.from('predicate_ranges').select('*').order('min_score', { ascending: false }); if (error) throw error; setRanges(data) }
    catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const update = (id, field, value) => setRanges((r) => r.map((x) => x.id === id ? { ...x, [field]: Number(value) } : x))
  const save = async () => {
    try {
      await Promise.all(ranges.map((r) => supabase.from('predicate_ranges').update({ min_score: r.min_score, max_score: r.max_score }).eq('id', r.id)))
      toast.success('Rentang predikat diperbarui.')
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4 max-w-2xl">
      <div><h1 className="text-xl font-bold">Pengaturan Sistem</h1><p className="text-sm text-gray-500">Konfigurasi predikat nilai dan pengaturan lainnya.</p></div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Rentang Predikat Nilai</h2>
        {ranges.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <span className="w-8 font-bold text-brand-600">{r.label}</span>
            <input type="number" className="input w-24" value={r.min_score} onChange={(e) => update(r.id, 'min_score', e.target.value)} />
            <span>–</span>
            <input type="number" className="input w-24" value={r.max_score} onChange={(e) => update(r.id, 'max_score', e.target.value)} />
          </div>
        ))}
        <button className="btn btn-primary" onClick={save}><Save size={16} />Simpan</button>
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold">Bobot Nilai & Ranking</h2>
        <p className="text-sm text-gray-500">Atur bobot komponen nilai (Tugas, Kuis, UTS, UAS, dsb).</p>
        <Link to="/admin/grades/weights" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1"><LinkIcon size={14} />Buka Konfigurasi Bobot Nilai</Link>
      </div>
    </div>
  )
}

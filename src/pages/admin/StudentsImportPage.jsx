import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseCsvFile } from '../../utils/csv'
import { bulkImportStudents } from '../../services/studentsService'
import { useToast } from '../../context/ToastContext'
import { ArrowLeft, Upload, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

const REQUIRED = ['nis', 'nisn', 'full_name']

export default function StudentsImportPage() {
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const data = await parseCsvFile(file)
    const errs = []
    data.forEach((row, i) => {
      REQUIRED.forEach((f) => { if (!row[f]) errs.push(`Baris ${i + 2}: kolom "${f}" wajib diisi.`) })
    })
    const nisSet = new Set()
    data.forEach((row, i) => {
      if (row.nis && nisSet.has(row.nis)) errs.push(`Baris ${i + 2}: NIS "${row.nis}" duplikat dalam file.`)
      nisSet.add(row.nis)
    })
    setRows(data)
    setErrors(errs)
  }

  const confirmImport = async () => {
    if (errors.length) { toast.error('Perbaiki error validasi sebelum melanjutkan.'); return }
    setImporting(true)
    try {
      const payload = rows.map((r) => ({
        nis: r.nis, nisn: r.nisn, full_name: r.full_name, gender: r.gender || 'L',
        entry_year: Number(r.entry_year) || new Date().getFullYear(), status: 'aktif',
      }))
      await bulkImportStudents(payload)
      toast.success(`${payload.length} siswa berhasil diimpor.`)
      navigate('/admin/students')
    } catch (err) {
      toast.error(err.message.includes('duplicate') ? 'Ada NIS/NISN yang sudah terdaftar di database.' : err.message)
    } finally { setImporting(false) }
  }

  return (
    <div className="space-y-4">
      <Link to="/admin/students" className="inline-flex items-center gap-1 text-sm text-brand-600"><ArrowLeft size={16} />Kembali</Link>
      <div className="card space-y-4">
        <h1 className="text-lg font-bold">Import Data Siswa (CSV)</h1>
        <p className="text-sm text-gray-500">Kolom wajib: <code>nis, nisn, full_name</code>. Kolom opsional: <code>gender, entry_year</code>.</p>
        <input type="file" accept=".csv" onChange={handleFile} className="input" />

        {rows.length > 0 && (
          <>
            <div className="overflow-x-auto max-h-64 border border-gray-200 dark:border-gray-800 rounded-lg">
              <table className="table-base">
                <thead><tr>{Object.keys(rows[0]).map((k) => <th key={k}>{k}</th>)}</tr></thead>
                <tbody>{rows.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody>
              </table>
            </div>
            {errors.length > 0 ? (
              <div className="text-sm text-red-600 space-y-1">
                <p className="flex items-center gap-1 font-medium"><AlertTriangle size={16} />{errors.length} error ditemukan:</p>
                <ul className="list-disc list-inside max-h-32 overflow-y-auto">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            ) : (
              <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={16} />Data valid, siap diimpor ({rows.length} baris).</p>
            )}
            <button className="btn btn-primary" disabled={importing || errors.length > 0} onClick={confirmImport}>
              <Upload size={16} />{importing ? 'Mengimpor...' : 'Konfirmasi & Import ke Supabase'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { FileText, Download, Printer } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { exportToCsv } from '../../utils/csv'
import { useToast } from '../../context/ToastContext'

const REPORTS = [
  { key: 'students', label: 'Laporan Siswa', table: 'students', columns: 'nis,nisn,full_name,gender,status,entry_year' },
  { key: 'teachers', label: 'Laporan Guru', table: 'teachers', columns: 'nip,full_name,email,status' },
  { key: 'classes', label: 'Laporan Kelas', table: 'classes', columns: 'name,grade_level,major,capacity' },
  { key: 'grades', label: 'Laporan Nilai', table: 'grades', columns: 'component,score,status' },
  { key: 'attendance', label: 'Laporan Absensi', table: 'attendance', columns: 'status,marked_via' },
]

export default function ReportsPage() {
  const toast = useToast()
  const [loadingKey, setLoadingKey] = useState('')

  const generate = async (report) => {
    setLoadingKey(report.key)
    try {
      const { data, error } = await supabase.from(report.table).select(report.columns).limit(1000)
      if (error) throw error
      if (!data.length) { toast.info('Tidak ada data untuk laporan ini.'); return }
      exportToCsv(`${report.key}.csv`, data)
      toast.success(`${report.label} berhasil diunduh.`)
    } catch (e) { toast.error(e.message) } finally { setLoadingKey('') }
  }

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Laporan</h1><p className="text-sm text-gray-500">Unduh laporan dalam format CSV, atau cetak dari menu terkait (Rapor, Jadwal, dll).</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <div key={r.key} className="card flex flex-col items-start gap-3">
            <FileText className="text-brand-600" size={24} />
            <h3 className="font-semibold">{r.label}</h3>
            <button className="btn btn-outline w-full" disabled={loadingKey === r.key} onClick={() => generate(r)}>
              <Download size={16} />{loadingKey === r.key ? 'Memproses...' : 'Export CSV'}
            </button>
          </div>
        ))}
        <div className="card flex flex-col items-start gap-3">
          <Printer className="text-brand-600" size={24} />
          <h3 className="font-semibold">Rapor & Dokumen Cetak</h3>
          <p className="text-sm text-gray-500">Gunakan menu Rapor pada masing-masing siswa untuk mencetak rapor dengan layout siap-print.</p>
        </div>
      </div>
    </div>
  )
}

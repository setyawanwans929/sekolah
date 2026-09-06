import { AlertTriangle } from 'lucide-react'

export default function ConfigWarning() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-lg card text-center">
        <AlertTriangle className="mx-auto text-amber-500 mb-3" size={40} />
        <h1 className="text-lg font-semibold mb-2">Konfigurasi Supabase Belum Lengkap</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          EduTrack memerlukan koneksi ke Supabase untuk berjalan. Salin <code className="px-1 bg-gray-100 dark:bg-gray-800 rounded">.env.example</code> menjadi <code className="px-1 bg-gray-100 dark:bg-gray-800 rounded">.env</code>, lalu isi:
        </p>
        <pre className="text-left text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto mb-4">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
        </pre>
        <p className="text-xs text-gray-500">
          Nilai ini bisa didapat dari Supabase Dashboard → Project Settings → API. Setelah diisi, jalankan ulang <code>npm run dev</code>. Lihat README.md untuk panduan lengkap.
        </p>
      </div>
    </div>
  )
}

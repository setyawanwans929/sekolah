import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../context/AuthContext'

export default function StudentQrPage() {
  const { profile } = useAuth()
  return (
    <div className="max-w-sm mx-auto">
      <div className="card text-center space-y-3">
        <h1 className="font-bold text-lg">Kartu Identitas Digital</h1>
        <div className="flex justify-center">
          <QRCodeSVG value={`student:${profile?.student_id}`} size={200} />
        </div>
        <p className="font-semibold">{profile?.full_name}</p>
        <p className="text-sm text-gray-500">NIS: {profile?.nis || '-'}</p>
        <p className="text-xs text-gray-400">QR ini hanya berfungsi sebagai identitas untuk absensi kehadiran dan tidak menampilkan data pribadi sensitif.</p>
      </div>
    </div>
  )
}

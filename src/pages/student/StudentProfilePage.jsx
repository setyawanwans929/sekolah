import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/format'

export default function StudentProfilePage() {
  const { profile } = useAuth()
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Profil Saya</h1>
      <div className="card space-y-2 text-sm">
        <Row label="Nama Lengkap" value={profile.full_name} />
        <Row label="NIS" value={profile.nis} />
        <Row label="Email" value={profile.email} />
        <Row label="Terdaftar Sejak" value={formatDate(profile.created_at)} />
      </div>
    </div>
  )
}
function Row({ label, value }) { return <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2"><span className="text-gray-500">{label}</span><span className="font-medium">{value || '-'}</span></div> }

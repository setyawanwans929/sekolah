import { useEffect, useState } from 'react'
import { listNotifications, markAsRead, markAllAsRead } from '../../services/notificationsService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Badge from '../../components/ui/Badge'
import { formatDateTime } from '../../utils/format'
import { CheckCheck } from 'lucide-react'

export default function NotificationsPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true)

  const load = async () => { setLoading(true); try { setRows(await listNotifications(profile.id)) } catch (e) { toast.error(e.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const readOne = async (id) => { await markAsRead(id); load() }
  const readAll = async () => { await markAllAsRead(profile.id); toast.success('Semua notifikasi ditandai dibaca.'); load() }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Notifikasi</h1>
        <button className="btn btn-outline" onClick={readAll}><CheckCheck size={16} />Tandai Semua Dibaca</button>
      </div>
      {loading ? <LoadingSpinner /> : rows.length === 0 ? <EmptyState message="Tidak ada notifikasi." /> : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((n) => (
            <div key={n.id} className={`py-3 flex justify-between items-start gap-3 ${!n.is_read ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`} onClick={() => !n.is_read && readOne(n.id)}>
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-gray-500">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
              </div>
              {!n.is_read && <Badge tone="draft">Baru</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

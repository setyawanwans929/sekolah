import { useEffect, useState } from 'react'
import { listAuditLogs } from '../../services/auditLogService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { formatDateTime } from '../../utils/format'

export default function AuditLogPage() {
  const [rows, setRows] = useState([]); const [count, setCount] = useState(0)
  const [page, setPage] = useState(1); const [loading, setLoading] = useState(true)
  const pageSize = 20

  useEffect(() => {
    (async () => { setLoading(true); try { const { data, count } = await listAuditLogs({ page, pageSize }); setRows(data); setCount(count) } finally { setLoading(false) } })()
  }, [page])

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Audit Log</h1><p className="text-sm text-gray-500">Riwayat aktivitas seluruh pengguna sistem.</p></div>
      <div className="card">
        {loading ? <LoadingSpinner /> : rows.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Waktu</th><th>Role</th><th>Aktivitas</th><th>Tabel Terkait</th><th>Detail</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id}><td>{formatDateTime(r.created_at)}</td><td className="capitalize">{r.role}</td><td>{r.action}</td><td>{r.related_table || '-'}</td><td className="text-gray-500">{r.detail || '-'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {!loading && <Pagination page={page} pageSize={pageSize} total={count} onChange={setPage} />}
      </div>
    </div>
  )
}

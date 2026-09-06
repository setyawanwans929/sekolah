export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between mt-3 text-sm">
      <span className="text-gray-500">Menampilkan halaman {page} dari {totalPages} ({total} data)</span>
      <div className="flex gap-1">
        <button className="btn btn-outline px-2 py-1" disabled={page <= 1} onClick={() => onChange(page - 1)}>Sebelumnya</button>
        <button className="btn btn-outline px-2 py-1" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Berikutnya</button>
      </div>
    </div>
  )
}

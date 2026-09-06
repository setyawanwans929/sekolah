import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { listParents, createParent, updateParent, deleteParent } from '../../services/parentsService'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

const emptyForm = { full_name: '', email: '', phone: '', address: '', relation: 'Ayah' }

export default function ParentsPage() {
  const toast = useToast()
  const [rows, setRows] = useState([]); const [count, setCount] = useState(0)
  const [page, setPage] = useState(1); const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const pageSize = 10

  const load = useCallback(async () => {
    setLoading(true)
    try { const { data, count } = await listParents({ search, page, pageSize }); setRows(data); setCount(count) }
    catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [search, page])
  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (row) => { setEditing(row); setForm({ ...emptyForm, ...row }); setModalOpen(true) }

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (editing) { await updateParent(editing.id, form); toast.success('Data orang tua diperbarui.') }
      else { await createParent(form); toast.success('Orang tua baru ditambahkan.') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
  }
  const confirmDeleteNow = async () => {
    try { await deleteParent(confirmDelete.id); toast.success('Data dihapus.'); setConfirmDelete(null); load() }
    catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-bold">Data Orang Tua / Wali</h1><p className="text-sm text-gray-500">Kelola data orang tua dan relasi ke siswa.</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Tambah</button>
      </div>
      <div className="card">
        <div className="relative mb-4 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Cari nama..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        {loading ? <LoadingSpinner /> : rows.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Nama</th><th>Hubungan</th><th>Anak</th><th>No. HP</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.full_name}</td><td>{r.relation}</td>
                    <td>{(r.students || []).map((s) => s.full_name).join(', ') || '-'}</td>
                    <td>{r.phone || '-'}</td>
                    <td><div className="flex justify-end gap-1">
                      <button className="btn btn-outline px-2 py-1" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                      <button className="btn btn-outline px-2 py-1 text-red-600" onClick={() => setConfirmDelete(r)}><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <Pagination page={page} pageSize={pageSize} total={count} onChange={setPage} />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Orang Tua' : 'Tambah Orang Tua'}>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Nama Lengkap *</label><input required className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">No. HP</label><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div>
            <label className="label">Hubungan</label>
            <select className="input" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
              <option>Ayah</option><option>Ibu</option><option>Wali</option>
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">Alamat</label><input className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirmDelete} title="Hapus Data" message={`Yakin ingin menghapus ${confirmDelete?.full_name}?`} onConfirm={confirmDeleteNow} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}

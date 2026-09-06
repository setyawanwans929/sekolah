import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { listSubjects, createSubject, updateSubject, deleteSubject } from '../../services/subjectsService'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

const emptyForm = { code: '', name: '', group_name: 'Produktif', kkm: 75, hours_per_week: 2 }

export default function SubjectsPage() {
  const toast = useToast()
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false); const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm); const [confirmDelete, setConfirmDelete] = useState(null)

  const load = async () => { setLoading(true); try { setRows(await listSubjects()) } catch (e) { toast.error(e.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (r) => { setEditing(r); setForm({ ...emptyForm, ...r }); setModalOpen(true) }
  const submit = async (e) => {
    e.preventDefault()
    try {
      if (editing) { await updateSubject(editing.id, form); toast.success('Mata pelajaran diperbarui.') }
      else { await createSubject(form); toast.success('Mata pelajaran ditambahkan.') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message.includes('duplicate') ? 'Kode mata pelajaran sudah dipakai.' : err.message) }
  }
  const confirmDeleteNow = async () => { try { await deleteSubject(confirmDelete.id); toast.success('Dihapus.'); setConfirmDelete(null); load() } catch (e) { toast.error(e.message) } }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-bold">Mata Pelajaran</h1><p className="text-sm text-gray-500">Kelola daftar mata pelajaran, KKM, dan jam pelajaran.</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Tambah</button>
      </div>
      <div className="card">
        {loading ? <LoadingSpinner /> : rows.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Kode</th><th>Nama</th><th>Kelompok</th><th>KKM</th><th>Jam/Minggu</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.code}</td><td className="font-medium">{r.name}</td><td>{r.group_name}</td><td>{r.kkm}</td><td>{r.hours_per_week}</td>
                  <td><div className="flex justify-end gap-1">
                    <button className="btn btn-outline px-2 py-1" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                    <button className="btn btn-outline px-2 py-1 text-red-600" onClick={() => setConfirmDelete(r)}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Mapel' : 'Tambah Mapel'}>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Kode *</label><input required className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="label">Nama *</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Kelompok</label><input className="input" value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} /></div>
          <div><label className="label">KKM</label><input type="number" className="input" value={form.kkm} onChange={(e) => setForm({ ...form, kkm: Number(e.target.value) })} /></div>
          <div><label className="label">Jam/Minggu</label><input type="number" className="input" value={form.hours_per_week} onChange={(e) => setForm({ ...form, hours_per_week: Number(e.target.value) })} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirmDelete} title="Hapus Mapel" message={`Yakin ingin menghapus ${confirmDelete?.name}?`} onConfirm={confirmDeleteNow} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}

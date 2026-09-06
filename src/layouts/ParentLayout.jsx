import { Outlet } from 'react-router-dom'
import { ParentChildProvider, useParentChild } from '../context/ParentChildContext'

function ChildSelector() {
  const { kids, selected, setSelected, loading } = useParentChild()
  if (loading || kids.length <= 1) return null
  return (
    <div className="mb-4">
      <label className="label">Pilih Anak</label>
      <select className="input max-w-xs" value={selected || ''} onChange={(e) => setSelected(e.target.value)}>
        {kids.map((k) => <option key={k.id} value={k.id}>{k.full_name} ({k.nis})</option>)}
      </select>
    </div>
  )
}

export default function ParentLayout() {
  return (
    <ParentChildProvider>
      <ChildSelector />
      <Outlet />
    </ParentChildProvider>
  )
}

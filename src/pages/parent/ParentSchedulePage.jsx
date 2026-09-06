import { useParentChild } from '../../context/ParentChildContext'
import StudentSchedulePage from '../student/StudentSchedulePage'
import EmptyState from '../../components/common/EmptyState'
export default function ParentSchedulePage() {
  const { selected, kids } = useParentChild()
  if (kids.length === 0) return <EmptyState message="Belum ada data anak." />
  return <StudentSchedulePage studentIdOverride={selected} />
}

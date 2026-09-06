import { useParentChild } from '../../context/ParentChildContext'
import StudentExamsPage from '../student/StudentExamsPage'
import EmptyState from '../../components/common/EmptyState'
export default function ParentExamsPage() {
  const { selected, kids } = useParentChild()
  if (kids.length === 0) return <EmptyState message="Belum ada data anak." />
  return <StudentExamsPage studentIdOverride={selected} />
}

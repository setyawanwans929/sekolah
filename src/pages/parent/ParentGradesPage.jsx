import { useParentChild } from '../../context/ParentChildContext'
import StudentGradesPage from '../student/StudentGradesPage'
import EmptyState from '../../components/common/EmptyState'
export default function ParentGradesPage() {
  const { selected, kids } = useParentChild()
  if (kids.length === 0) return <EmptyState message="Belum ada data anak." />
  return <StudentGradesPage studentIdOverride={selected} />
}

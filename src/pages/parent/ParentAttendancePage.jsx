import { useParentChild } from '../../context/ParentChildContext'
import StudentAttendancePage from '../student/StudentAttendancePage'
import EmptyState from '../../components/common/EmptyState'
export default function ParentAttendancePage() {
  const { selected, kids } = useParentChild()
  if (kids.length === 0) return <EmptyState message="Belum ada data anak." />
  return <StudentAttendancePage studentIdOverride={selected} />
}

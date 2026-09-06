import { useParentChild } from '../../context/ParentChildContext'
import ReportCardPage from '../common/ReportCardPage'
import EmptyState from '../../components/common/EmptyState'
export default function ParentReportCardPage() {
  const { selected, kids } = useParentChild()
  if (kids.length === 0) return <EmptyState message="Belum ada data anak." />
  return <ReportCardPage studentIdOverride={selected} />
}

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function ProtectedRoute({ allowedRoles }) {
  const { session, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner label="Memeriksa sesi..." />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}

import { Navigate, useLocation } from "react-router-dom"

export default function RequireRole({ role, children }) {
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if (!user?.role) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}

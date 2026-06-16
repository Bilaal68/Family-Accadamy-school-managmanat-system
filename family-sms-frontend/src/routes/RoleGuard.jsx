import { Navigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export default function RoleGuard({ role, children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    // redirect each role to their correct dashboard
    if (user.role === "SUPER_ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "CLASS_TEACHER") return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === "CASHIER") return <Navigate to="/cashier/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

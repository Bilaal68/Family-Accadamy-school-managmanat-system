import { Navigate, useNavigate } from "react-router-dom";

import LoginForm from "./LoginForm";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLogin() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user?.role === "SUPER_ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <LoginForm
      title="Admin sign in"
      subtitle="Family Academy Management System"
      identifierLabel="Email"
      identifierType="email"
      expectedRole="SUPER_ADMIN"
      onSuccess={() => navigate("/admin/dashboard")}
      alternatePortals={[
        { label: "Teacher sign in", path: "/teacher/login" },
        { label: "Cashier sign in", path: "/cashier/login" },
      ]}
    />
  );
}

import { Navigate, useNavigate } from "react-router-dom";

import LoginForm from "./LoginForm";
import { useAuth } from "@/hooks/useAuth";

export default function CashierLogin() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user?.role === "CASHIER") {
    return <Navigate to="/cashier/dashboard" replace />;
  }

  return (
    <LoginForm
      title="Cashier sign in"
      subtitle="Family Academy Management System"
      identifierLabel="Email"
      identifierType="email"
      expectedRole="CASHIER"
      onSuccess={() => navigate("/cashier/dashboard")}
      alternatePortals={[
        { label: "Admin sign in", path: "/admin/login" },
        { label: "Teacher sign in", path: "/teacher/login" },
      ]}
    />
  );
}

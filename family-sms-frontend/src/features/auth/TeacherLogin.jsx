import { Navigate, useNavigate } from "react-router-dom";

import LoginForm from "./LoginForm";
import { useAuth } from "@/hooks/useAuth";

export default function TeacherLogin() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user?.role === "CLASS_TEACHER") {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return (
    <LoginForm
      title="Teacher sign in"
      subtitle="Access your class dashboard"
      identifierLabel="Email"
      identifierType="email"
      expectedRole="CLASS_TEACHER"
      onSuccess={() => navigate("/teacher/dashboard")}
      alternatePortals={[
        { label: "Admin sign in", path: "/admin/login" },
        { label: "Cashier sign in", path: "/cashier/login" },
      ]}
    />
  );
}

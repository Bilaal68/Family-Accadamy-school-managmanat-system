import { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopbar from "@/components/layout/AdminTopbar";
import usePendingApprovalsCount from "@/features/admin/hooks/usePendingApprovalsCount";
import { useAuth } from "@/hooks/useAuth";

const baseNavItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/students", label: "Students" },
  { to: "/admin/teachers", label: "Teachers" },
  { to: "/admin/classes", label: "Classes" },
  { to: "/admin/attendance", label: "Attendance" },
  { to: "/admin/marks", label: "Marks" },
  { to: "/admin/approvals", label: "Approvals" },
  { to: "/admin/announcements", label: "Announcements" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/settings", label: "Settings" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pendingQ = usePendingApprovalsCount();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = useMemo(
    () =>
      baseNavItems.map((item) =>
        item.to === "/admin/approvals"
          ? { ...item, badge: pendingQ.data ?? 0 }
          : item
      ),
    [pendingQ.data]
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 md:relative md:translate-x-0 md:flex-shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar items={navItems} user={user} onLogout={handleLogout} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto bg-page p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

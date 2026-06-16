import { useMemo } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import {
  getEnrollmentStats,
} from "@/api/enrollment";

const baseNavItems = [
  { to: "/cashier/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { to: "/cashier/enrollments", label: "Enrollments", icon: "ClipboardList" },
  { to: "/cashier/enrollments/new", label: "New Enrollment", icon: "UserPlus" },
];

export default function CashierLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const statsQ = getEnrollmentStats();

  const navItems = useMemo(
    () =>
      baseNavItems.map((item) => {
        if (item.to === "/cashier/enrollments") {
          return { ...item, badge: statsQ.data?.pending ?? 0 };
        }
        return item;
      }),
    [statsQ.data?.pending]
  );

  const handleLogout = async () => {
    await logout();
    navigate("/cashier/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-20 flex h-full w-64 flex-col bg-[#10026B] text-white">
        {/* Logo */}
        <div className="border-b border-[#C2B30C] p-6">
          <h1 className="text-xl font-bold text-[#C2B30C]">Family Academy</h1>
          <p className="text-sm text-gray-300">Cashier Portal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center justify-between rounded px-3 py-2 text-sm font-medium hover:bg-[#1a0a8a] hover:text-[#C2B30C]"
            >
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="rounded-full bg-[#C2B30C] px-2 py-0.5 text-xs font-bold text-[#10026B]">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-[#C2B30C] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C2B30C] text-[#10026B] font-bold">
              {user?.full_name?.charAt(0) || "C"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-gray-400">Cashier</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="fixed top-0 right-0 z-10 flex h-16 items-center justify-between border-b bg-white px-8">
          <h2 className="text-lg font-semibold text-gray-900">Cashier Portal</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="mt-16 flex-1 overflow-y-auto bg-[#F9F9F9] p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

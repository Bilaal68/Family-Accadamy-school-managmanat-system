import { useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import TeacherSidebar from "@/components/layout/TeacherSidebar";
import TeacherTopbar from "@/components/layout/TeacherTopbar";
import TeacherUnassigned from "@/features/teacher/TeacherUnassigned";
import useTeacherUnreadNotifications from "@/features/teacher/hooks/useTeacherUnreadNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherClass } from "@/hooks/useTeacherClass";

const baseNavItems = [
  { to: "/teacher/dashboard", label: "Dashboard" },
  { to: "/teacher/class", label: "My Class" },
  { to: "/teacher/attendance", label: "Attendance" },
  { to: "/teacher/marks", label: "Marks" },
  { to: "/teacher/behaviour", label: "Behaviour" },
  { to: "/teacher/notifications", label: "Notifications" },
];

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const { className, hasClass } = useTeacherClass();
  const navigate = useNavigate();
  const unreadQ = useTeacherUnreadNotifications();

  const navItems = useMemo(
    () =>
      baseNavItems.map((item) => {
        if (item.to === "/teacher/class" && className) {
          return { ...item, subtitle: className };
        }
        if (item.to === "/teacher/notifications") {
          return { ...item, badge: unreadQ.data?.count ?? 0 };
        }
        return item;
      }),
    [className, unreadQ.data?.count]
  );

  const handleLogout = async () => {
    await logout();
    navigate("/teacher/login");
  };

  if (!hasClass) {
    return <TeacherUnassigned user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <TeacherSidebar
        items={navItems}
        user={user}
        className={className}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TeacherTopbar user={user} />

        <main className="flex-1 overflow-y-auto bg-page p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

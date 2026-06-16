import {
  CalendarCheck,
  CheckCircle,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  School,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

const ICONS = {
  "/admin/dashboard": LayoutDashboard,
  "/admin/students": Users,
  "/admin/teachers": GraduationCap,
  "/admin/classes": School,
  "/admin/attendance": CalendarCheck,
  "/admin/marks": ClipboardList,
  "/admin/approvals": CheckCircle,
  "/admin/announcements": Megaphone,
  "/admin/reports": FileText,
};

function initials(name) {
  if (!name) return "A";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminSidebar({ items, user, onLogout }) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col overflow-y-auto bg-primary">
      {/* School crest */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
          FS
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">Family Academy</p>
          <p className="text-[11px] font-medium text-accent">Management System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {items.map((item) => {
          const Icon = ICONS[item.to] || LayoutDashboard;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200",
                  isActive
                    ? "border-l-[3px] border-accent bg-primary-light pl-[9px] font-medium text-sidebar-textActive"
                    : "border-l-[3px] border-transparent text-sidebar-text hover:bg-primary-light hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-white" : "text-sidebar-text group-hover:text-white"
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom admin + logout */}
      <div className="mt-auto shrink-0 border-t border-accent/30 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            {initials(user?.full_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.full_name}</p>
            <p className="text-xs text-sidebar-text">Super Admin</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-text transition-colors hover:bg-primary-light hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

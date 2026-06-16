import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  fetchNotificationsList,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_META = {
  "/teacher/dashboard": { title: "Dashboard", crumb: "Teacher / Dashboard" },
  "/teacher/class": { title: "My Class", crumb: "Teacher / My Class" },
  "/teacher/attendance": { title: "Attendance", crumb: "Teacher / Attendance" },
  "/teacher/marks": { title: "Marks", crumb: "Teacher / Marks" },
  "/teacher/behaviour": { title: "Behaviour", crumb: "Teacher / Behaviour" },
  "/teacher/notifications": {
    title: "Notifications",
    crumb: "Teacher / Notifications",
  },
};

function initials(name) {
  if (!name) return "T";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TeacherTopbar({ user }) {
  const { pathname } = useLocation();
  const qc = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);

  const meta = useMemo(() => PAGE_META[pathname] ?? { title: "Teacher", crumb: "Teacher" }, [pathname]);

  const notificationsQ = useQuery({
    queryKey: ["teacher", "topbar", "notifications", "unread"],
    queryFn: () => fetchNotificationsList({ unread: true, limit: 5 }),
  });

  const unreadCount = notificationsQ.data?.count ?? 0;
  const notifications = notificationsQ.data?.results ?? [];

  const markReadMut = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher", "topbar", "notifications"] });
      qc.invalidateQueries({ queryKey: ["teacher", "notifications"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher", "topbar", "notifications"] });
      qc.invalidateQueries({ queryKey: ["teacher", "notifications"] });
      setNotifOpen(false);
    },
  });

  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-brand bg-card px-6">
      <div>
        <h1 className="text-lg font-bold text-heading">{meta.title}</h1>
        <p className="text-xs text-subtext">{meta.crumb}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-full p-2 transition-colors hover:bg-page"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-heading" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                aria-hidden
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-brand bg-card shadow-card-hover">
                <div className="border-b border-brand px-4 py-3">
                  <p className="text-sm font-semibold text-heading">Notifications</p>
                </div>
                {notificationsQ.isLoading ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-label">
                    Loading…
                  </p>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-8 text-center">
                    <Bell className="mb-2 h-8 w-8 text-muted-label/50" />
                    <p className="text-sm text-subtext">No new notifications</p>
                  </div>
                ) : (
                  <ul className="max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className={cn(
                          "border-b border-brand px-4 py-3 last:border-0",
                          !n.is_read && "bg-page"
                        )}
                      >
                        <p className="text-sm font-medium text-heading">{n.title}</p>
                        <p className="line-clamp-2 text-xs text-subtext">{n.message}</p>
                        <p className="mt-1 text-[11px] text-muted-label">
                          {n.created_at
                            ? formatDistanceToNow(parseISO(n.created_at), {
                                addSuffix: true,
                              })
                            : ""}
                        </p>
                        {!n.is_read && (
                          <button
                            type="button"
                            className="mt-2 text-xs font-medium text-primary hover:underline"
                            disabled={markReadMut.isPending}
                            onClick={() => markReadMut.mutate(n.id)}
                          >
                            Mark as read
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {unreadCount > 0 && (
                  <div className="border-t border-brand p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-heading"
                      disabled={markAllMut.isPending}
                      onClick={() => markAllMut.mutate()}
                    >
                      Mark all as read
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="hidden h-8 w-px bg-brand sm:block" />

        <div className="hidden items-center gap-2 sm:flex">
          <span className="max-w-[140px] truncate text-sm font-medium text-heading">
            {user?.full_name}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            {initials(user?.full_name)}
          </div>
        </div>
      </div>
    </header>
  );
}

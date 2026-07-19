import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Bell, BookOpen, GraduationCap, Search, Users, Menu } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  fetchNotificationsList,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notifications";
import { globalSearch } from "@/api/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_META = {
  "/admin/dashboard": { title: "Dashboard", crumb: "Admin / Dashboard" },
  "/admin/students": { title: "Students", crumb: "Admin / Students" },
  "/admin/teachers": { title: "Teachers", crumb: "Admin / Teachers" },
  "/admin/classes": { title: "Classes", crumb: "Admin / Classes" },
  "/admin/attendance": { title: "Attendance", crumb: "Admin / Attendance" },
  "/admin/marks": { title: "Marks", crumb: "Admin / Marks" },
  "/admin/approvals": { title: "Approvals", crumb: "Admin / Approvals" },
  "/admin/announcements": { title: "Announcements", crumb: "Admin / Announcements" },
  "/admin/reports": { title: "Reports", crumb: "Admin / Reports" },
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

function resolveMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (pathname.startsWith("/admin/students/")) {
    return { title: "Student details", crumb: "Admin / Students / Details" };
  }
  if (pathname.startsWith("/admin/teachers/")) {
    return { title: "Teacher details", crumb: "Admin / Teachers / Details" };
  }
  if (pathname.startsWith("/admin/classes/")) {
    return { title: "Class details", crumb: "Admin / Classes / Details" };
  }
  return { title: "Admin", crumb: "Admin" };
}

export default function AdminTopbar({ user, onMenuClick }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const meta = useMemo(() => resolveMeta(pathname), [pathname]);

  // Search query
  const searchQ = useQuery({
    queryKey: ["global-search", searchQuery],
    queryFn: () => globalSearch(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const notificationsQ = useQuery({
    queryKey: ["topbar", "notifications", "unread"],
    queryFn: () =>
      fetchNotificationsList({ scope: "admin", unread: true, limit: 5 }),
  });

  const unreadCount = notificationsQ.data?.count ?? 0;
  const notifications = notificationsQ.data?.results ?? [];

  const markReadMut = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topbar", "notifications"] });
      qc.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topbar", "notifications"] });
      qc.invalidateQueries({ queryKey: ["admin", "notifications"] });
      setNotifOpen(false);
    },
  });

  const handleSearchResultClick = (url) => {
    navigate(url);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const getResultIcon = (type) => {
    switch (type) {
      case "student":
        return <GraduationCap className="h-4 w-4" />;
      case "teacher":
        return <Users className="h-4 w-4" />;
      case "class":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <>
      <header className="z-10 flex h-16 shrink-0 flex-col justify-center border-b border-brand bg-card px-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onMenuClick}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-page transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6 text-heading" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-heading truncate">{meta.title}</h1>
              <p className="text-xs text-subtext hidden sm:block">{meta.crumb}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-brand bg-page px-4 py-2 text-sm text-muted-label transition-colors hover:border-primary/30 sm:flex md:w-64"
            >
              <Search className="h-4 w-4 shrink-0 text-heading" />
              <span>Search students, teachers…</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="rounded-full border border-brand p-2 sm:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4 text-heading" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-full p-2 transition-colors hover:bg-page min-h-10 min-w-10 flex items-center justify-center"
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
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="border-brand bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-heading">Search</DialogTitle>
            <DialogDescription className="text-subtext">
              Search for students, teachers, or classes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="border-brand"
            />

            {searchQuery && (
              <div className="max-h-96 overflow-y-auto">
                {searchQ.isLoading ? (
                  <div className="py-8 text-center text-sm text-muted-label">
                    Searching...
                  </div>
                ) : searchQ.data?.total === 0 ? (
                  <div className="py-8 text-center">
                    <Search className="mx-auto mb-2 h-8 w-8 text-muted-label/50" />
                    <p className="text-sm text-subtext">No results found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Students */}
                    {searchQ.data?.students?.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-label">
                          Students ({searchQ.data.students.length})
                        </h3>
                        <div className="space-y-1">
                          {searchQ.data.students.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => handleSearchResultClick(result.url)}
                              className="flex w-full items-center gap-3 rounded-lg border border-brand bg-card p-3 text-left transition-colors hover:bg-page"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                {getResultIcon(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-heading truncate">
                                  {result.title}
                                </p>
                                <p className="text-xs text-subtext truncate">
                                  {result.subtitle}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Teachers */}
                    {searchQ.data?.teachers?.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-label">
                          Teachers ({searchQ.data.teachers.length})
                        </h3>
                        <div className="space-y-1">
                          {searchQ.data.teachers.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => handleSearchResultClick(result.url)}
                              className="flex w-full items-center gap-3 rounded-lg border border-brand bg-card p-3 text-left transition-colors hover:bg-page"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                {getResultIcon(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-heading truncate">
                                  {result.title}
                                </p>
                                <p className="text-xs text-subtext truncate">
                                  {result.subtitle}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Classes */}
                    {searchQ.data?.classes?.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-label">
                          Classes ({searchQ.data.classes.length})
                        </h3>
                        <div className="space-y-1">
                          {searchQ.data.classes.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => handleSearchResultClick(result.url)}
                              className="flex w-full items-center gap-3 rounded-lg border border-brand bg-card p-3 text-left transition-colors hover:bg-page"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                {getResultIcon(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-heading truncate">
                                  {result.title}
                                </p>
                                <p className="text-xs text-subtext truncate">
                                  {result.subtitle}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!searchQuery && (
              <div className="py-8 text-center">
                <Search className="mx-auto mb-2 h-8 w-8 text-muted-label/50" />
                <p className="text-sm text-subtext">Start typing to search</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

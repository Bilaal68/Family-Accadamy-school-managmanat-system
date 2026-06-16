import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Bell } from "lucide-react";

import {
  fetchNotificationsList,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SectionError from "@/components/shared/SectionError";
import { ListSkeleton } from "@/components/shared/SectionSkeleton";
import { cn } from "@/lib/utils";

export default function TeacherNotificationsPage() {
  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: ["teacher", "notifications"],
    queryFn: () => fetchNotificationsList({ limit: 50 }),
  });

  const markReadMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher", "notifications"] });
      qc.invalidateQueries({ queryKey: ["teacher", "topbar", "notifications"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher", "notifications"] });
      qc.invalidateQueries({ queryKey: ["teacher", "topbar", "notifications"] });
    },
  });

  const items = listQ.data?.results ?? [];
  const unread = listQ.data?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-heading">Notifications</h2>
          <p className="text-sm text-subtext">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" disabled={markAllMut.isPending} onClick={() => markAllMut.mutate()}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          {listQ.isLoading && <ListSkeleton items={6} />}
          {listQ.isError && (
            <SectionError message="Could not load notifications." onRetry={() => listQ.refetch()} />
          )}
          {!listQ.isLoading && !listQ.isError && items.length === 0 && (
            <div className="flex flex-col items-center py-12">
              <Bell className="mb-2 h-10 w-10 text-muted-label/40" />
              <p className="text-sm text-subtext">No notifications</p>
            </div>
          )}
          {!listQ.isLoading && !listQ.isError && items.length > 0 && (
            <ul className="divide-y divide-brand">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn("py-4", !n.is_read && "rounded-md bg-page/80 px-3")}
                >
                  <p className="font-medium text-heading">{n.title}</p>
                  <p className="mt-1 text-sm text-subtext">{n.message}</p>
                  <p className="mt-2 text-xs text-muted-label">
                    {n.created_at
                      ? formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })
                      : ""}
                  </p>
                  {!n.is_read && (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-primary hover:underline"
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
        </CardContent>
      </Card>
    </div>
  );
}

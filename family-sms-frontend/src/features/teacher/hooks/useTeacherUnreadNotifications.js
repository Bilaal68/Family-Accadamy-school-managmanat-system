import { useQuery } from "@tanstack/react-query";

import { fetchNotificationsList } from "@/api/notifications";

export default function useTeacherUnreadNotifications() {
  return useQuery({
    queryKey: ["teacher", "topbar", "notifications", "unread"],
    queryFn: () => fetchNotificationsList({ unread: true, limit: 1 }),
    refetchInterval: 60_000,
  });
}

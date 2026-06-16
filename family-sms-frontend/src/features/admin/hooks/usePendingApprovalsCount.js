import { useQuery } from "@tanstack/react-query";

import { fetchAttendance } from "@/api/attendance";
import { fetchGrades } from "@/api/grades";

export const PENDING_APPROVALS_KEY = ["pending-approvals-count"];

const REFETCH_MS = 60_000;

export default function usePendingApprovalsCount() {
  return useQuery({
    queryKey: PENDING_APPROVALS_KEY,
    queryFn: async () => {
      const [marksRes, attRes] = await Promise.all([
        fetchGrades({ status: "pending" }),
        fetchAttendance({ status: "pending" }),
      ]);
      
      // Handle both paginated and non-paginated responses
      const marksData = marksRes.data?.results || marksRes.data || [];
      const attendanceData = attRes.data?.results || attRes.data || [];
      
      const marks = Array.isArray(marksData) ? marksData.length : 0;
      const attendance = Array.isArray(attendanceData) ? attendanceData.length : 0;
      
      return marks + attendance;
    },
    refetchInterval: REFETCH_MS,
  });
}

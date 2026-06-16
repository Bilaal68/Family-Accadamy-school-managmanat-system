import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  CalendarCheck,
  Check,
  ClipboardList,
  GraduationCap,
  Megaphone,
  School,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { approveAttendance, fetchAttendance } from "@/api/attendance";
import { fetchClassesList } from "@/api/classes";
import { approveGrade, fetchGrades } from "@/api/grades";
import { getEnrollmentStats } from "@/api/enrollment";
import { fetchNotificationsList } from "@/api/notifications";
import { fetchTeachersList } from "@/api/teachers";
import { PENDING_APPROVALS_KEY } from "@/features/admin/hooks/usePendingApprovalsCount";
import { fetchStudents } from "@/api/students";
import BulkImportModal from "@/features/admin/pages/students/BulkImportModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SectionError from "@/components/shared/SectionError";
import {
  ChartSkeleton,
  ListSkeleton,
  MetricCardsSkeleton,
  PanelSkeleton,
} from "@/components/shared/SectionSkeleton";
import { cn } from "@/lib/utils";
import { theme } from "@/utils/theme";

const QK = {
  studentsCount: ["admin", "metrics", "students-count"],
  teachersCount: ["admin", "metrics", "teachers-count"],
  classesCount: ["admin", "metrics", "classes-count"],
  todayAttendance: ["admin", "metrics", "today-attendance"],
  pendingApprovals: ["admin", "pending-approvals"],
  classesList: ["admin", "classes-list"],
  notifications: ["admin", "notifications"],
};

function pctPresentToday(records) {
  if (!records?.length) return 0;
  const present = records.filter((r) => r.status === "PRESENT").length;
  return Math.round((present / records.length) * 1000) / 10;
}

function MetricCard({ icon: Icon, value, label }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-brand bg-card shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-heading">{value}</p>
          <p className="text-sm text-subtext">{label}</p>
        </div>
      </div>
      <div className="h-[3px] w-full bg-accent" />
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-brand bg-card px-3 py-2 shadow-card">
      <p className="text-sm font-semibold text-heading">{row.name}</p>
      <p className="text-sm text-subtext">
        {row.marked ? `${payload[0].value}% attendance` : "Not marked"}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [bulkOpen, setBulkOpen] = useState(false);

  const studentsQ = useQuery({
    queryKey: QK.studentsCount,
    queryFn: async () => {
      const { data } = await fetchStudents({ page_size: 1 });
      return data.count ?? 0;
    },
  });

  const teachersQ = useQuery({
    queryKey: QK.teachersCount,
    queryFn: async () => {
      const { count } = await fetchTeachersList();
      return count;
    },
  });

  const classesQ = useQuery({
    queryKey: QK.classesList,
    queryFn: fetchClassesList,
  });

  const classesCount = classesQ.data?.count ?? 0;

  const todayAttendanceQ = useQuery({
    queryKey: QK.todayAttendance,
    queryFn: async () => {
      const { data } = await fetchAttendance({ date: "today" });
      const records = Array.isArray(data) ? data : [];
      if (!records.length) return null;
      return pctPresentToday(records);
    },
  });

  const pendingQ = useQuery({
    queryKey: QK.pendingApprovals,
    queryFn: async () => {
      const [marksRes, attRes] = await Promise.all([
        fetchGrades({ status: "pending" }),
        fetchAttendance({ status: "pending" }),
      ]);
      const marks = Array.isArray(marksRes.data) ? marksRes.data : [];
      const attendance = Array.isArray(attRes.data) ? attRes.data : [];
      const combined = [
        ...marks.map((m) => ({
          kind: "marks",
          id: m.id,
          className: m.class_name || "—",
          teacherName: m.submitted_by_name || "—",
          submittedAt: m.submitted_at,
        })),
        ...attendance.map((a) => ({
          kind: "attendance",
          id: a.id,
          className: a.class_name || "—",
          teacherName: a.marked_by_name || "—",
          submittedAt: a.submitted_at,
        })),
      ].filter((row) => row.submittedAt);
      combined.sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      return combined;
    },
  });

  const notificationsQ = useQuery({
    queryKey: QK.notifications,
    queryFn: async () => {
      const { results } = await fetchNotificationsList({
        scope: "admin",
        limit: 8,
      });
      return results;
    },
  });

  const enrollmentStatsQ = useQuery({
    queryKey: ["enrollment-stats"],
    queryFn: async () => {
      const { data } = await getEnrollmentStats();
      return data;
    },
  });

  const approveMarkMut = useMutation({
    mutationFn: (id) => approveGrade(id),
    onSuccess: () => {
      toast.success("Mark approved");
      qc.invalidateQueries({ queryKey: QK.pendingApprovals });
      qc.invalidateQueries({ queryKey: PENDING_APPROVALS_KEY });
      qc.invalidateQueries({ queryKey: ["topbar", "notifications"] });
      qc.invalidateQueries({ queryKey: QK.classesList });
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not approve mark."),
  });

  const approveAttMut = useMutation({
    mutationFn: (id) => approveAttendance(id),
    onSuccess: () => {
      toast.success("Attendance approved");
      qc.invalidateQueries({ queryKey: QK.pendingApprovals });
      qc.invalidateQueries({ queryKey: PENDING_APPROVALS_KEY });
      qc.invalidateQueries({ queryKey: ["topbar", "notifications"] });
      qc.invalidateQueries({ queryKey: QK.todayAttendance });
      qc.invalidateQueries({ queryKey: QK.classesList });
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not approve attendance."),
  });

  const chartData = (classesQ.data?.results ?? []).map((c) => ({
    name: c.name,
    marked: Boolean(c.attendance_marked_today),
    percent:
      c.attendance_marked_today && c.today_attendance_percent != null
        ? parseFloat(String(c.today_attendance_percent))
        : 0,
  }));

  const metricsLoading =
    studentsQ.isLoading ||
    teachersQ.isLoading ||
    classesQ.isLoading ||
    todayAttendanceQ.isLoading;

  const metricsError =
    studentsQ.isError ||
    teachersQ.isError ||
    classesQ.isError ||
    todayAttendanceQ.isError;

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <section>
        {metricsLoading && <MetricCardsSkeleton />}
        {metricsError && (
          <SectionError
            message="Could not load metrics."
            onRetry={() => {
              studentsQ.refetch();
              teachersQ.refetch();
              classesQ.refetch();
              todayAttendanceQ.refetch();
              enrollmentStatsQ.refetch();
            }}
          />
        )}
        {!metricsLoading && !metricsError && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard icon={Users} value={studentsQ.data ?? 0} label="Total students" />
            <MetricCard
              icon={GraduationCap}
              value={teachersQ.data ?? 0}
              label="Total teachers"
            />
            <MetricCard icon={School} value={classesCount} label="Total classes" />
            <MetricCard
              icon={CalendarCheck}
              value={
                todayAttendanceQ.data == null
                  ? "Not marked yet"
                  : `${todayAttendanceQ.data}%`
              }
              label="Today's attendance"
            />
            <Link to="/admin/approvals?tab=enrollments">
              <MetricCard
                icon={ClipboardList}
                value={(enrollmentStatsQ.data?.pending || 0) + (enrollmentStatsQ.data?.reviewed || 0)}
                label="Pending enrollments"
              />
            </Link>
          </div>
        )}
      </section>

      {/* Pending approvals */}
      <section>
        {pendingQ.isLoading && <PanelSkeleton rows={5} />}
        {pendingQ.isError && (
          <SectionError
            message="Could not load pending items."
            onRetry={() => pendingQ.refetch()}
          />
        )}
        {!pendingQ.isLoading && !pendingQ.isError && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Pending approvals</CardTitle>
              <Link
                to="/admin/approvals"
                className="brand-link text-sm font-semibold text-accent hover:text-accent-dark"
              >
                View All
              </Link>
            </CardHeader>
            <CardContent>
              {pendingQ.data?.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                    <Check className="h-7 w-7 text-accent" strokeWidth={2.5} />
                  </div>
                  <p className="font-medium text-heading">All caught up</p>
                </div>
              ) : (
                <ul className="divide-y divide-brand">
                  {pendingQ.data.map((row) => (
                    <li
                      key={`${row.kind}-${row.id}`}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex gap-3 border-l-[3px] border-accent pl-3">
                        <div>
                          <p className="font-semibold text-heading">{row.className}</p>
                          <p className="text-sm text-subtext">{row.teacherName}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge
                              variant={row.kind === "marks" ? "marks" : "attendance"}
                            >
                              {row.kind === "marks" ? "Marks" : "Attendance"}
                            </Badge>
                            <span className="text-xs text-muted-label">
                              {row.submittedAt
                                ? formatDistanceToNow(parseISO(row.submittedAt), {
                                    addSuffix: true,
                                  })
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-accent hover:text-accent-foreground"
                        disabled={
                          approveMarkMut.isPending || approveAttMut.isPending
                        }
                        onClick={() =>
                          row.kind === "marks"
                            ? approveMarkMut.mutate(row.id)
                            : approveAttMut.mutate(row.id)
                        }
                      >
                        Approve
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Chart */}
      <section>
        {classesQ.isLoading && <ChartSkeleton />}
        {classesQ.isError && (
          <SectionError
            message="Could not load chart data."
            onRetry={() => classesQ.refetch()}
          />
        )}
        {!classesQ.isLoading && !classesQ.isError && (
          <Card>
            <CardHeader>
              <CardTitle>Class attendance (today)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {chartData.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-muted-label">
                  No classes yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient id="attendanceBarGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={theme.primary} />
                        <stop offset="100%" stopColor={theme.accent} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fill: theme.textSecondary, fontSize: 12 }}
                      axisLine={{ stroke: theme.primary }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fill: theme.textPrimary, fontSize: 12 }}
                      axisLine={{ stroke: theme.primary }}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={false} />
                    <Bar dataKey="percent" radius={[0, 4, 4, 0]} barSize={18}>
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.marked
                              ? "url(#attendanceBarGrad)"
                              : theme.border
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Activity */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent activity</CardTitle>
            <Link
              to="/admin/announcements"
              className="brand-link text-sm font-semibold"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {notificationsQ.isLoading && <ListSkeleton items={6} />}
            {notificationsQ.isError && (
              <SectionError
                message="Could not load notifications."
                onRetry={() => notificationsQ.refetch()}
              />
            )}
            {!notificationsQ.isLoading && !notificationsQ.isError && (
              <>
                {notificationsQ.data?.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-label">
                    No recent activity
                  </p>
                ) : (
                  <ul>
                    {notificationsQ.data.map((n, i) => (
                      <li
                        key={n.id}
                        className={cn(
                          "flex gap-3 px-2 py-4",
                          i % 2 === 1 && "rounded-md bg-page/60"
                        )}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/25">
                          <Bell className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-heading">{n.title}</p>
                          <p className="text-sm text-subtext">{n.message}</p>
                          <p className="mt-1 text-xs text-muted-label">
                            {n.created_at
                              ? formatDistanceToNow(parseISO(n.created_at), {
                                  addSuffix: true,
                                })
                              : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtext">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={UserPlus}
            label="Register student"
            onClick={() => navigate("/admin/students")}
          />
          <QuickAction
            icon={GraduationCap}
            label="Register teacher"
            onClick={() => navigate("/admin/teachers")}
          />
          <QuickAction
            icon={School}
            label="Create class"
            onClick={() => navigate("/admin/classes")}
          />
          <QuickAction
            icon={Upload}
            label="Bulk import"
            onClick={() => setBulkOpen(true)}
          />
          <QuickAction
            icon={Megaphone}
            label="Send announcement"
            onClick={() => navigate("/admin/announcements")}
          />
          <QuickAction
            icon={ClipboardList}
            label="Export report"
            onClick={() => navigate("/admin/reports")}
          />
        </div>
      </section>

      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-3 rounded-lg border border-primary bg-card px-4 py-6 text-center shadow-card transition-all duration-200 hover:bg-primary hover:shadow-card-hover"
    >
      <Icon
        className="h-6 w-6 text-heading transition-colors group-hover:text-accent"
        strokeWidth={1.75}
      />
      <span className="text-sm font-medium text-heading transition-colors group-hover:text-primary-foreground">
        {label}
      </span>
    </button>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  Award,
  CalendarCheck,
  ClipboardList,
  Megaphone,
  Medal,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { fetchAttendance, markAttendance, submitAttendance } from "@/api/attendance";
import { fetchClassLeaderboard, fetchClassStudentsList } from "@/api/classes";
import { fetchGrades, fetchGradeAverages } from "@/api/grades";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SectionError from "@/components/shared/SectionError";
import { MetricCardsSkeleton, PanelSkeleton } from "@/components/shared/SectionSkeleton";
import ReportBehaviourModal from "@/features/teacher/components/ReportBehaviourModal";
import SendNotificationModal from "@/features/teacher/components/SendNotificationModal";
import { useTeacherClass } from "@/hooks/useTeacherClass";
import { cn } from "@/lib/utils";

const today = format(new Date(), "yyyy-MM-dd");

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function pctPresent(records) {
  if (!records?.length) return null;
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

function StatusToggle({ status, target, active, disabled, onClick }) {
  const styles = {
    PRESENT: active
      ? "bg-green-600 text-white border-green-600"
      : "border-neutral-300 text-neutral-500 hover:border-green-600",
    ABSENT: active
      ? "bg-red-600 text-white border-red-600"
      : "border-neutral-300 text-neutral-500 hover:border-red-600",
    LATE: active
      ? "bg-amber-500 text-white border-amber-500"
      : "border-neutral-300 text-neutral-500 hover:border-amber-500",
  };
  const labels = { PRESENT: "P", ABSENT: "A", LATE: "L" };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(target)}
      className={cn(
        "h-8 w-8 rounded-md border text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[target]
      )}
    >
      {labels[target]}
    </button>
  );
}

function submissionStatus(records) {
  if (!records?.length) return null;
  const allApproved = records.every((r) => r.approved_at);
  if (allApproved) return "Approved";
  return "Pending";
}

function lastAttendanceSubmission(records) {
  const submitted = records.filter((r) => r.submitted_at);
  if (!submitted.length) return null;
  const latest = submitted.reduce((a, b) =>
    new Date(a.submitted_at) > new Date(b.submitted_at) ? a : b
  );
  const batchDate = latest.date;
  const batch = submitted.filter((r) => r.date === batchDate);
  return {
    date: batchDate,
    count: batch.length,
    status: submissionStatus(batch),
  };
}

function lastMarksSubmission(marks) {
  const submitted = marks.filter((m) => m.submitted_at);
  if (!submitted.length) return null;
  const latest = submitted.reduce((a, b) =>
    new Date(a.submitted_at) > new Date(b.submitted_at) ? a : b
  );
  const latestKey = format(parseISO(latest.submitted_at), "yyyy-MM-dd'T'HH:mm");
  const batch = submitted.filter(
    (m) => format(parseISO(m.submitted_at), "yyyy-MM-dd'T'HH:mm") === latestKey
  );
  return {
    submittedAt: latest.submitted_at,
    count: batch.length,
    status: batch.every((m) => m.approved_at) ? "Approved" : "Pending",
  };
}

function RankBadge({ rank }) {
  if (rank === 1) return <Award className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-neutral-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return (
    <span className="flex h-6 w-6 items-center justify-center text-sm font-bold text-subtext">
      {rank}
    </span>
  );
}

export default function TeacherDashboard() {
  const { classId, className } = useTeacherClass();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const attendanceRef = useRef(null);
  const [behaviourOpen, setBehaviourOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const studentsQ = useQuery({
    queryKey: ["teacher", "class", classId, "students"],
    queryFn: () => fetchClassStudentsList(classId),
    enabled: !!classId,
  });

  const todayAttendanceQ = useQuery({
    queryKey: ["teacher", "attendance", classId, today],
    queryFn: async () => {
      const { data } = await fetchAttendance({ class: classId, date: "today" });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId,
  });

  const averagesQ = useQuery({
    queryKey: ["teacher", "averages", classId],
    queryFn: async () => {
      const { data } = await fetchGradeAverages({ class: classId });
      return data;
    },
    enabled: !!classId,
  });

  const pendingQ = useQuery({
    queryKey: ["teacher", "pending-submissions", classId],
    queryFn: async () => {
      const [marksRes, attRes] = await Promise.all([
        fetchGrades({ class: classId, status: "pending" }),
        fetchAttendance({ class: classId, status: "pending" }),
      ]);
      const marks = Array.isArray(marksRes.data) ? marksRes.data : [];
      const attendance = Array.isArray(attRes.data) ? attRes.data : [];
      return marks.length + attendance.length;
    },
    enabled: !!classId,
  });

  const leaderboardQ = useQuery({
    queryKey: ["teacher", "leaderboard", classId],
    queryFn: async () => {
      const { data } = await fetchClassLeaderboard(classId);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId,
  });

  const allMarksQ = useQuery({
    queryKey: ["teacher", "marks", classId],
    queryFn: async () => {
      const { data } = await fetchGrades({ class: classId });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId,
  });

  const attendanceHistoryQ = useQuery({
    queryKey: ["teacher", "attendance-history", classId],
    queryFn: async () => {
      const month = format(new Date(), "yyyy-MM");
      const { data } = await fetchAttendance({ class: classId, month });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId,
  });

  const students = studentsQ.data?.results ?? [];
  const todayRecords = todayAttendanceQ.data ?? [];
  const recordByStudent = useMemo(() => {
    const map = {};
    for (const r of todayRecords) {
      map[r.student_id] = r;
    }
    return map;
  }, [todayRecords]);

  const allStudentsMarked = students.length > 0 && students.every((s) => recordByStudent[s.id]?.status);
  const submittedToday =
    todayRecords.length > 0 && todayRecords.every((r) => r.submitted_at);
  const readOnlyAttendance = submittedToday;

  const markMut = useMutation({
    mutationFn: ({ studentId, status }) =>
      markAttendance([{ student_id: studentId, status }]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher", "attendance", classId, today] });
      qc.invalidateQueries({ queryKey: ["teacher", "pending-submissions", classId] });
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not save attendance."),
  });

  const submitMut = useMutation({
    mutationFn: submitAttendance,
    onSuccess: () => {
      toast.success("Attendance submitted for approval");
      qc.invalidateQueries({ queryKey: ["teacher", "attendance", classId] });
      qc.invalidateQueries({ queryKey: ["teacher", "pending-submissions", classId] });
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not submit attendance."),
  });

  const attendancePct = pctPresent(todayRecords);
  const classAverage = averagesQ.data?.class_average ?? "0.00";
  const topFive = (leaderboardQ.data ?? []).slice(0, 5);
  const maxScore = Math.max(...topFive.map((e) => Number(e.overall_average) || 0), 1);

  const lastAtt = lastAttendanceSubmission(attendanceHistoryQ.data ?? []);
  const lastMarks = lastMarksSubmission(allMarksQ.data ?? []);

  const metricsLoading =
    studentsQ.isLoading || todayAttendanceQ.isLoading || averagesQ.isLoading || pendingQ.isLoading;

  const scrollToAttendance = () => {
    attendanceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-heading">{className}</h2>
        <p className="text-sm text-subtext">Class teacher dashboard</p>
      </div>

      <section>
        {metricsLoading && <MetricCardsSkeleton />}
        {!metricsLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Users}
              value={studentsQ.data?.count ?? 0}
              label="Students in class"
            />
            <MetricCard
              icon={CalendarCheck}
              value={
                attendancePct == null ? "—" : `${attendancePct}%`
              }
              label="Today's attendance"
            />
            <MetricCard
              icon={ClipboardList}
              value={classAverage}
              label="Class average score"
            />
            <MetricCard
              icon={AlertCircle}
              value={pendingQ.data ?? 0}
              label="Pending submissions"
            />
          </div>
        )}
      </section>

      <section ref={attendanceRef}>
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendanceQ.isLoading && <PanelSkeleton rows={6} />}
            {todayAttendanceQ.isError && (
              <SectionError
                message="Could not load attendance."
                onRetry={() => todayAttendanceQ.refetch()}
              />
            )}
            {!todayAttendanceQ.isLoading && !todayAttendanceQ.isError && (
              <>
                {students.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-label">
                    No students in this class yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-brand">
                    {students.map((student) => {
                      const record = recordByStudent[student.id];
                      const current = record?.status;
                      return (
                        <li
                          key={student.id}
                          className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {initials(student.full_name)}
                            </div>
                            <div>
                              <p className="font-medium text-heading">{student.full_name}</p>
                              <p className="font-mono text-xs text-muted-label">
                                {student.student_id}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {["PRESENT", "ABSENT", "LATE"].map((st) => (
                              <StatusToggle
                                key={st}
                                status={current}
                                target={st}
                                active={current === st}
                                disabled={readOnlyAttendance || markMut.isPending}
                                onClick={() => {
                                  if (readOnlyAttendance) return;
                                  markMut.mutate({ studentId: student.id, status: st });
                                }}
                              />
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="mt-6 flex justify-end border-t border-brand pt-4">
                  {submittedToday ? (
                    <span className="inline-flex items-center rounded-md bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                      Submitted ✓
                    </span>
                  ) : (
                    <Button
                      disabled={!allStudentsMarked || submitMut.isPending}
                      onClick={() => submitMut.mutate()}
                      className="bg-primary hover:bg-accent hover:text-accent-foreground"
                    >
                      {submitMut.isPending ? "Submitting…" : "Submit to Admin"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Class leaderboard</CardTitle>
            <Link
              to="/teacher/class"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View full leaderboard
            </Link>
          </CardHeader>
          <CardContent>
            {leaderboardQ.isLoading && <PanelSkeleton rows={5} />}
            {leaderboardQ.isError && (
              <SectionError
                message="Could not load leaderboard."
                onRetry={() => leaderboardQ.refetch()}
              />
            )}
            {!leaderboardQ.isLoading && !leaderboardQ.isError && (
              <>
                {topFive.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-label">No marks yet</p>
                ) : (
                  <ul className="space-y-2">
                    {topFive.map((entry) => (
                      <li
                        key={entry.student_id}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2",
                          entry.rank === 1 && "bg-accent/15"
                        )}
                      >
                        <RankBadge rank={entry.rank} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-heading">
                            {entry.full_name}
                          </p>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-page">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${(Number(entry.overall_average) / maxScore) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-heading">
                          {entry.overall_average}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-brand p-4">
                <p className="text-xs font-semibold uppercase text-subtext">Attendance</p>
                {lastAtt ? (
                  <>
                    <p className="mt-2 font-medium text-heading">
                      {format(parseISO(lastAtt.date), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-subtext">{lastAtt.count} students</p>
                    <Badge
                      className={cn(
                        "mt-2",
                        lastAtt.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {lastAtt.status}
                    </Badge>
                    <Link
                      to="/teacher/attendance"
                      className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-label">No submissions yet</p>
                )}
              </div>
              <div className="rounded-lg border border-brand p-4">
                <p className="text-xs font-semibold uppercase text-subtext">Marks</p>
                {lastMarks ? (
                  <>
                    <p className="mt-2 font-medium text-heading">
                      {format(parseISO(lastMarks.submittedAt), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-subtext">{lastMarks.count} entries</p>
                    <Badge
                      className={cn(
                        "mt-2",
                        lastMarks.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {lastMarks.status}
                    </Badge>
                    <Link
                      to="/teacher/marks"
                      className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-label">No submissions yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtext">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={CalendarCheck}
            label="Mark today's attendance"
            onClick={scrollToAttendance}
          />
          <QuickAction
            icon={ClipboardList}
            label="Enter marks"
            onClick={() => navigate("/teacher/marks")}
          />
          <QuickAction
            icon={AlertCircle}
            label="Report behaviour"
            onClick={() => setBehaviourOpen(true)}
          />
          <QuickAction
            icon={Megaphone}
            label="Send notification"
            onClick={() => setNotifyOpen(true)}
          />
        </div>
      </section>

      <ReportBehaviourModal
        open={behaviourOpen}
        onClose={() => setBehaviourOpen(false)}
        classId={classId}
      />
      <SendNotificationModal
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        className={className}
      />
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

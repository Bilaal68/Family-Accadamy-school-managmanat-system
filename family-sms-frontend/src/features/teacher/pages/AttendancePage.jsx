import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { exportAttendance, fetchAttendance, markAttendance, submitAttendance } from "@/api/attendance";
import { fetchClassStudentsList } from "@/api/classes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SectionError from "@/components/shared/SectionError";
import { PanelSkeleton } from "@/components/shared/SectionSkeleton";
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

export default function AttendancePage() {
  const { classId, className } = useTeacherClass();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("mark");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedDay, setSelectedDay] = useState(null);

  const studentsQ = useQuery({
    queryKey: ["teacher", "class", classId, "students"],
    queryFn: () => fetchClassStudentsList(classId),
    enabled: !!classId,
  });

  const attendanceQ = useQuery({
    queryKey: ["teacher", "attendance", classId, selectedDate],
    queryFn: async () => {
      const { data } = await fetchAttendance({ class: classId, date: selectedDate });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId && !!selectedDate,
  });

  const monthAttendanceQ = useQuery({
    queryKey: ["teacher", "attendance", classId, selectedMonth],
    queryFn: async () => {
      const { data } = await fetchAttendance({ class: classId, month: selectedMonth });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId && !!selectedMonth && activeTab === "history",
  });

  const students = studentsQ.data?.results ?? [];
  const records = attendanceQ.data ?? [];
  const recordByStudent = records.reduce((map, r) => {
    map[r.student_id] = r;
    return map;
  }, {});

  const allStudentsMarked = students.length > 0 && students.every((s) => recordByStudent[s.id]?.status);
  const submitted = records.length > 0 && records.every((r) => r.submitted_at);
  const approved = records.length > 0 && records.every((r) => r.approved_at);
  const readOnly = submitted || approved;

  const isFutureDate = selectedDate > today;

  const markMut = useMutation({
    mutationFn: ({ studentId, status }) =>
      markAttendance([{ student_id: studentId, status, date: selectedDate }]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher", "attendance", classId, selectedDate] });
      qc.invalidateQueries({ queryKey: ["teacher", "pending-submissions", classId] });
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not save attendance."),
  });

  const submitMut = useMutation({
    mutationFn: () => submitAttendance({ date: selectedDate }),
    onSuccess: () => {
      toast.success("Attendance submitted for approval");
      qc.invalidateQueries({ queryKey: ["teacher", "attendance", classId, selectedDate] });
      qc.invalidateQueries({ queryKey: ["teacher", "pending-submissions", classId] });
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not submit attendance."),
  });

  const exportMut = useMutation({
    mutationFn: () => exportAttendance({ month: selectedMonth }),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${selectedMonth}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Attendance exported successfully");
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not export attendance."),
  });

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedDay(null);
  };

  const handleMonthChange = (direction) => {
    const date = new Date(selectedMonth + "-01");
    if (direction === "prev") {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    setSelectedMonth(format(date, "yyyy-MM"));
    setSelectedDay(null);
  };

  const getDayAttendance = (day) => {
    const dayRecords = monthAttendanceQ.data?.filter((r) => r.date === day) || [];
    if (dayRecords.length === 0) return null;
    const present = dayRecords.filter((r) => r.status === "PRESENT").length;
    const pct = Math.round((present / dayRecords.length) * 100);
    return { pct, records: dayRecords };
  };

  const getDayColor = (pct) => {
    if (pct === null) return "bg-neutral-100 text-neutral-400";
    if (pct > 80) return "bg-green-100 text-green-800";
    if (pct >= 60) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  const generateCalendarDays = () => {
    const date = new Date(selectedMonth + "-01");
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = format(new Date(year, month, day), "yyyy-MM-dd");
      days.push(dateStr);
    }

    return days;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-heading">{className}</h2>
        <p className="text-sm text-subtext">Attendance management</p>
      </div>

      <div className="flex gap-2 border-b border-brand">
        <button
          type="button"
          onClick={() => setActiveTab("mark")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "mark"
              ? "border-b-2 border-primary text-primary"
              : "text-subtext hover:text-heading"
          )}
        >
          Mark Attendance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "history"
              ? "border-b-2 border-primary text-primary"
              : "text-subtext hover:text-heading"
          )}
        >
          Attendance History
        </button>
      </div>

      {activeTab === "mark" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Mark Attendance</CardTitle>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={today}
                className="rounded-md border border-brand bg-card px-3 py-2 text-sm text-heading"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isFutureDate && (
              <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                Cannot mark attendance for future dates
              </div>
            )}

            {approved && (
              <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                Approved by Admin
              </div>
            )}

            {submitted && !approved && (
              <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                Pending Admin Approval
              </div>
            )}

            {attendanceQ.isLoading && <PanelSkeleton rows={6} />}
            {attendanceQ.isError && (
              <SectionError
                message="Could not load attendance."
                onRetry={() => attendanceQ.refetch()}
              />
            )}
            {!attendanceQ.isLoading && !attendanceQ.isError && (
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
                                disabled={readOnly || markMut.isPending || isFutureDate}
                                onClick={() => {
                                  if (readOnly || isFutureDate) return;
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
                  {submitted ? (
                    <span className="inline-flex items-center rounded-md bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                      Submitted ✓
                    </span>
                  ) : (
                    <Button
                      disabled={!allStudentsMarked || submitMut.isPending || isFutureDate}
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
      )}

      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Attendance History</CardTitle>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMonthChange("prev")}
                  className="rounded-md border border-brand p-2 hover:bg-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-heading">
                  {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                </span>
                <button
                  type="button"
                  onClick={() => handleMonthChange("next")}
                  className="rounded-md border border-brand p-2 hover:bg-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {monthAttendanceQ.isLoading && <PanelSkeleton rows={6} />}
            {monthAttendanceQ.isError && (
              <SectionError
                message="Could not load attendance history."
                onRetry={() => monthAttendanceQ.refetch()}
              />
            )}
            {!monthAttendanceQ.isLoading && !monthAttendanceQ.isError && (
              <>
                <div className="mb-6 grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-xs font-semibold text-subtext"
                    >
                      {day}
                    </div>
                  ))}
                  {generateCalendarDays().map((dateStr, idx) => {
                    if (!dateStr) {
                      return <div key={idx} className="h-10" />;
                    }
                    const dayData = getDayAttendance(dateStr);
                    const pct = dayData?.pct;
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDay(dateStr)}
                        className={cn(
                          "flex h-10 items-center justify-center rounded-md text-xs font-medium transition-colors",
                          getDayColor(pct),
                          selectedDay === dateStr && "ring-2 ring-primary ring-offset-2"
                        )}
                      >
                        {format(parseISO(dateStr), "d")}
                      </button>
                    );
                  })}
                </div>

                {selectedDay && (
                  <div className="mt-6 rounded-lg border border-brand bg-page p-4">
                    <h3 className="mb-3 font-semibold text-heading">
                      {format(parseISO(selectedDay), "MMMM d, yyyy")}
                    </h3>
                    {(() => {
                      const dayRecords = monthAttendanceQ.data?.filter(
                        (r) => r.date === selectedDay
                      ) || [];
                      if (dayRecords.length === 0) {
                        return (
                          <p className="text-sm text-muted-label">No attendance recorded</p>
                        );
                      }
                      return (
                        <ul className="divide-y divide-brand">
                          {dayRecords.map((record) => (
                            <li
                              key={record.id}
                              className="flex items-center justify-between py-2"
                            >
                              <span className="text-sm text-heading">{record.student_name}</span>
                              <Badge
                                className={
                                  record.status === "PRESENT"
                                    ? "bg-green-100 text-green-800"
                                    : record.status === "ABSENT"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                                }
                              >
                                {record.status}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    disabled={exportMut.isPending}
                    onClick={() => exportMut.mutate()}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Month
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

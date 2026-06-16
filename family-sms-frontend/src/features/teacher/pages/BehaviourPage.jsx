import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import toast from "react-hot-toast";
import { ErrorBoundary } from "react-error-boundary";

import { fetchBehaviourRemarks, reportBehaviour } from "@/api/behaviour";
import { fetchClassStudentsList } from "@/api/classes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SectionError from "@/components/shared/SectionError";
import { PanelSkeleton } from "@/components/shared/SectionSkeleton";
import { useTeacherClass } from "@/hooks/useTeacherClass";
import { cn } from "@/lib/utils";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p?.charAt(0) || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function BehaviourErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-red-500 font-medium">
        Something went wrong loading this page.
      </p>
      <p className="text-sm text-gray-500">{error?.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Try Again
      </button>
    </div>
  );
}

function BehaviourPage() {
  const { classId, className } = useTeacherClass();
  const qc = useQueryClient();
  const [studentId, setStudentId] = useState("");
  const [severity, setSeverity] = useState("LOW");
  const [description, setDescription] = useState("");
  const [filterStudent, setFilterStudent] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const studentsQ = useQuery({
    queryKey: ["teacher", "class", classId, "students"],
    queryFn: () => fetchClassStudentsList(classId),
    enabled: !!classId,
  });

  const behaviourQ = useQuery({
    queryKey: ["teacher", "behaviour", classId],
    queryFn: async () => {
      const { data } = await fetchBehaviourRemarks({ class: classId });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId,
  });

  const students = studentsQ.data?.results ?? [];
  const reports = behaviourQ.data ?? [];

  const filteredReports = reports.filter((r) => {
    if (filterStudent !== "all" && r.student_id !== filterStudent) return false;
    if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
    return true;
  });

  const sortedReports = [...filteredReports].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const reportMut = useMutation({
    mutationFn: (payload) => reportBehaviour(payload),
    onSuccess: () => {
      toast.success("Behaviour report logged");
      qc.invalidateQueries({ queryKey: ["teacher", "behaviour", classId] });
      setStudentId("");
      setSeverity("LOW");
      setDescription("");
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not log report."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId || !description.trim()) {
      toast.error("Please select a student and enter a description.");
      return;
    }
    if (description.trim().length < 20) {
      toast.error("Description must be at least 20 characters.");
      return;
    }
    reportMut.mutate({
      student_id: studentId,
      content: description.trim(),
      severity,
      note_type: "BEHAVIOUR",
    });
  };

  const getSeverityBadge = (sev) => {
    const styles = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-amber-100 text-amber-800",
      HIGH: "bg-red-100 text-red-800",
    };
    return styles[sev] || styles.LOW;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-heading">{className}</h2>
        <p className="text-sm text-subtext">Behaviour management</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log New Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {(students || []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s?.full_name || "Unknown"} ({s?.student_id || ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <div className="flex gap-2">
                  {["LOW", "MEDIUM", "HIGH"].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        severity === sev
                          ? sev === "LOW"
                            ? "border-gray-400 bg-gray-100 text-gray-800"
                            : sev === "MEDIUM"
                            ? "border-amber-400 bg-amber-100 text-amber-800"
                            : "border-red-400 bg-red-100 text-red-800"
                          : "border-brand text-subtext hover:bg-page"
                      )}
                    >
                      {sev?.charAt(0) + sev?.slice(1)?.toLowerCase() || sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the incident or observation in detail…"
                  className="w-full rounded-md border border-brand bg-card px-3 py-2 text-sm text-heading"
                />
                <p className="text-xs text-muted-label">
                  {description.length}/500 characters (minimum 20)
                </p>
              </div>

              <Button
                type="submit"
                disabled={reportMut.isPending}
                className="w-full bg-primary hover:bg-accent hover:text-accent-foreground"
              >
                {reportMut.isPending ? "Logging…" : "Log Report"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Filter by student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {(students || []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s?.full_name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {behaviourQ.isLoading && <PanelSkeleton rows={4} />}
            {behaviourQ.isError && (
              <SectionError
                message="Could not load reports."
                onRetry={() => behaviourQ.refetch()}
              />
            )}
            {!behaviourQ.isLoading && !behaviourQ.isError && (
              <>
                {sortedReports.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-label">
                    No behaviour reports yet.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {sortedReports
                      .filter((report) => report && report.id)
                      .map((report) => {
                        const student = students.find((s) => s.id === report.student_id);
                        return (
                          <div
                            key={report.id}
                            className="rounded-lg border border-brand bg-page p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                {student ? initials(student.full_name) : "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-heading">
                                    {student?.full_name || "Unknown"}
                                  </p>
                                  <Badge className={getSeverityBadge(report.severity)}>
                                    {report?.severity
                                      ? report?.severity?.charAt(0) + report?.severity?.slice(1)?.toLowerCase()
                                      : "Unknown"}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-sm text-subtext line-clamp-2">
                                  {report?.content || ""}
                                </p>
                                <p className="mt-2 text-xs text-muted-label">
                                  {report?.created_at
                                    ? format(parseISO(report.created_at), "MMM d, yyyy 'at' h:mm a")
                                    : ""}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BehaviourPageWrapper() {
  return (
    <ErrorBoundary FallbackComponent={BehaviourErrorFallback}>
      <BehaviourPage />
    </ErrorBoundary>
  );
}

export default BehaviourPageWrapper;

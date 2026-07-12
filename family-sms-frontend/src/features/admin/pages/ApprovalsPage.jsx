import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Check, ChevronDown, ChevronRight, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { approveAttendance, fetchAttendance } from "@/api/attendance";
import { approveGrade, fetchGrades } from "@/api/grades";
import { approveEnrollment, getEnrollments, rejectEnrollment } from "@/api/enrollment";
import { PENDING_APPROVALS_KEY } from "@/features/admin/hooks/usePendingApprovalsCount";
import EnrollmentDetailModal from "@/features/admin/pages/enrollments/EnrollmentDetailModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import SectionError from "@/components/shared/SectionError";
import { cn } from "@/lib/utils";

const REFETCH_MS = 15_000;

function groupMarks(marks) {
  // Safe fallback for undefined/null marks
  const safeMarks = marks || [];
  const map = new Map();
  for (const m of safeMarks) {
    const key = `${m.class_name || "unknown"}|${m.submitted_at || ""}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        className: m.class_name || "—",
        teacherName: m.submitted_by_name || "—",
        submittedAt: m.submitted_at,
        items: [],
      });
    }
    map.get(key).items.push(m);
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.submittedAt || 0).getTime() -
      new Date(a.submittedAt || 0).getTime()
  );
}

function groupAttendance(records) {
  // Safe fallback for undefined/null records
  const safeRecords = records || [];
  const map = new Map();
  for (const r of safeRecords) {
    const key = `${r.class_name}|${r.date}|${r.submitted_at || ""}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        className: r.class_name,
        teacherName: r.marked_by_name || "—",
        date: r.date,
        submittedAt: r.submitted_at,
        items: [],
      });
    }
    map.get(key).items.push(r);
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.submittedAt || 0).getTime() -
      new Date(a.submittedAt || 0).getTime()
  );
}

function EmptyApprovals() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <Check className="h-8 w-8 text-green-700" strokeWidth={2} />
      </div>
      <p className="text-lg font-medium text-black">Nothing pending — all up to date</p>
    </div>
  );
}

function MarksApprovalsTab() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState({});
  const [newItemKeys, setNewItemKeys] = useState(new Set());
  const prevDataRef = useRef([]);

  const marksQ = useQuery({
    queryKey: ["pending-approvals", "marks"],
    queryFn: async () => {
      const { data } = await fetchGrades({ status: "pending" });
      // Handle both paginated and non-paginated responses
      return data?.results || data || [];
    },
    refetchInterval: REFETCH_MS,
  });

  // Safe fallback for marks data
  const marksData = marksQ.data || [];
  const groups = useMemo(() => groupMarks(marksData), [marksData]);

  // Detect new items and show toast
  useEffect(() => {
    if (marksData && marksData.length > 0) {
      const currentKeys = groups.map((g) => g.key);
      const prevKeys = prevDataRef.current;
      
      const newKeys = currentKeys.filter((k) => !prevKeys.includes(k));
      
      if (newKeys.length > 0) {
        newKeys.forEach((key) => {
          const group = groups.find((g) => g.key === key);
          if (group) {
            setNewItemKeys((prev) => new Set([...prev, key]));
            toast(
              (t) => (
                <div className="flex items-center gap-3">
                  <span>New marks submission from {group.teacherName}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setExpanded((e) => ({ ...e, [key]: true }));
                      toast.dismiss(t.id);
                    }}
                  >
                    View
                  </Button>
                </div>
              ),
              { duration: 5000 }
            );
            
            // Remove highlight after 5 seconds
            setTimeout(() => {
              setNewItemKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
              });
            }, 5000);
          }
        });
      }
      
      prevDataRef.current = currentKeys;
    }
  }, [marksData, groups]);

  const approveOne = useMutation({
    mutationFn: (id) => approveGrade(id),
    onSuccess: () => {
      toast.success("Mark approved — parents can now view results");
      qc.invalidateQueries({ queryKey: ["pending-approvals"] });
      qc.invalidateQueries({ queryKey: PENDING_APPROVALS_KEY });
    },
    onError: () => toast.error("Approval failed."),
  });

  const approveAll = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map((id) => approveGrade(id)));
    },
    onSuccess: (_, ids) => {
      toast.success(`Approved ${ids.length} entries`);
      qc.invalidateQueries({ queryKey: ["pending-approvals"] });
      qc.invalidateQueries({ queryKey: PENDING_APPROVALS_KEY });
    },
    onError: () => toast.error("Some approvals failed."),
  });

  if (marksQ.isLoading) {
    return <div className="h-40 animate-pulse rounded-lg bg-neutral-200" />;
  }
  if (marksQ.isError) {
    return (
      <SectionError message="Could not load marks." onRetry={() => marksQ.refetch()} />
    );
  }
  if (groups.length === 0) return <EmptyApprovals />;

  return (
    <ul className="space-y-3">
      {(groups || []).map((group) => {
        const isOpen = expanded[group.key];
        const ids = (group.items || []).map((m) => m.id);
        const isNew = newItemKeys.has(group.key);
        const subject = group.items?.[0]?.subject || "";
        const semester = group.items?.[0]?.semester_display || group.items?.[0]?.semester || "";
        const assessmentType = group.items?.[0]?.assessment_type_display || group.items?.[0]?.assessment_type || "";
        
        return (
          <li
            key={group.key}
            className={cn(
              "rounded-lg border bg-white transition-colors",
              isNew ? "border-amber-400 bg-amber-50" : "border-[#E5E5E5]"
            )}
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="flex flex-1 items-start gap-2 text-left"
                onClick={() =>
                  setExpanded((e) => ({ ...e, [group.key]: !e[group.key] }))
                }
              >
                {isOpen ? (
                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-black">{group.className}</p>
                  <p className="text-sm text-neutral-600">
                    {group.teacherName} · {subject} · {semester} {assessmentType ? `· ${assessmentType}` : ""} · {(group.items || []).length} student
                    {(group.items || []).length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Submitted{" "}
                    {group.submittedAt
                      ? formatDistanceToNow(parseISO(group.submittedAt), {
                          addSuffix: true,
                        })
                      : "—"}
                  </p>
                </div>
              </button>
              <Button
                size="sm"
                disabled={approveAll.isPending || approveOne.isPending}
                onClick={() => approveAll.mutate(ids)}
              >
                Approve All
              </Button>
            </div>
            {isOpen && (
              <div className="border-t border-[#E5E5E5] px-4 pb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Assessment Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(group.items || []).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.student_name}</TableCell>
                        <TableCell>{m.subject}</TableCell>
                        <TableCell>{m.assessment_type_display || m.assessment_type || "—"}</TableCell>
                        <TableCell>{m.score}</TableCell>
                        <TableCell>{m.semester_display || m.semester}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approveOne.isPending}
                            onClick={() => approveOne.mutate(m.id)}
                          >
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function EnrollmentsApprovalsTab() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState({});
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const enrollmentsQ = useQuery({
    queryKey: ["enrollments", "REVIEWED"],
    queryFn: async () => {
      const { data } = await getEnrollments({ status: "REVIEWED" });
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: REFETCH_MS,
  });

  const handleViewDetails = (enrollmentId) => {
    setSelectedEnrollmentId(enrollmentId);
    setDetailModalOpen(true);
  };

  const handleModalSuccess = () => {
    qc.invalidateQueries({ queryKey: ["enrollments"] });
    qc.invalidateQueries({ queryKey: ["enrollment-stats"] });
  };

  if (enrollmentsQ.isLoading) {
    return <div className="h-40 animate-pulse rounded-lg bg-neutral-200" />;
  }
  if (enrollmentsQ.isError) {
    return (
      <SectionError
        message="Could not load enrollments."
        onRetry={() => enrollmentsQ.refetch()}
      />
    );
  }
  if (enrollmentsQ.data?.length === 0) return <EmptyApprovals />;

  return (
    <>
      <ul className="space-y-3">
        {enrollmentsQ.data?.map((enrollment) => {
          const isOpen = expanded[enrollment.id];
          return (
            <li
              key={enrollment.id}
              className="rounded-lg border border-[#E5E5E5] bg-white"
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="flex flex-1 items-start gap-2 text-left"
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [enrollment.id]: !e[enrollment.id] }))
                  }
                >
                  {isOpen ? (
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-black">{enrollment.full_name}</p>
                    <p className="text-sm text-neutral-600">
                      {enrollment.admission_number} · {enrollment.grade_applying} ·{" "}
                      {enrollment.student_type || (enrollment.is_transfer ? "Transfer Student" : "New Student")} ·{" "}
                      {enrollment.reviewed_by_name || "Cashier"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {enrollment.cashier_notes ? enrollment.cashier_notes.substring(0, 50) + (enrollment.cashier_notes.length > 50 ? "..." : "") : "No notes"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Payment: {enrollment.payment_status} · Fee:{" "}
                      {enrollment.registration_fee_paid || 0} · {enrollment.documents?.length || 0} docs
                    </p>
                  </div>
                </button>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(enrollment.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-[#E5E5E5] px-4 pb-4">
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-medium text-neutral-700">Basic Details</p>
                      <p>DOB: {enrollment.date_of_birth}</p>
                      <p>Gender: {enrollment.gender}</p>
                      <p>Phone: {enrollment.phone_number || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">Parent Info</p>
                      <p>Father: {enrollment.father_name || "—"}</p>
                      <p>Mother: {enrollment.mother_name || "—"}</p>
                      <p>Guardian: {enrollment.guardian_name || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">Address</p>
                      <p>{enrollment.city || "—"}, {enrollment.region || "—"}</p>
                      <p className="whitespace-pre-line">{enrollment.full_address || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">Academic</p>
                      <p>Year: {enrollment.academic_year}</p>
                      <p>Type: {enrollment.student_type || (enrollment.is_transfer ? "Transfer Student" : "New Student")}</p>
                      {enrollment.is_transfer && (
                        <p>Previous School: {enrollment.previous_school || "—"}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <EnrollmentDetailModal
        enrollmentId={selectedEnrollmentId}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}

function AttendanceApprovalsTab() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState({});

  const attQ = useQuery({
    queryKey: ["pending-approvals", "attendance"],
    queryFn: async () => {
      const { data } = await fetchAttendance({ status: "pending" });
      // Handle both paginated and non-paginated responses
      return data?.results || data || [];
    },
    refetchInterval: REFETCH_MS,
  });

  // Safe fallback for attendance data
  const attendanceData = attQ.data || [];
  const groups = useMemo(() => groupAttendance(attendanceData), [attendanceData]);

  const approveOne = useMutation({
    mutationFn: (id) => approveAttendance(id),
    onSuccess: () => {
      toast.success("Attendance approved");
      qc.invalidateQueries({ queryKey: ["pending-approvals"] });
      qc.invalidateQueries({ queryKey: PENDING_APPROVALS_KEY });
    },
    onError: () => toast.error("Approval failed."),
  });

  const approveAll = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map((id) => approveAttendance(id)));
    },
    onSuccess: (_, ids) => {
      toast.success(`Approved ${ids.length} records`);
      qc.invalidateQueries({ queryKey: ["pending-approvals"] });
      qc.invalidateQueries({ queryKey: PENDING_APPROVALS_KEY });
    },
    onError: () => toast.error("Some approvals failed."),
  });

  if (attQ.isLoading) {
    return <div className="h-40 animate-pulse rounded-lg bg-neutral-200" />;
  }
  if (attQ.isError) {
    return (
      <SectionError
        message="Could not load attendance."
        onRetry={() => attQ.refetch()}
      />
    );
  }
  if (groups.length === 0) return <EmptyApprovals />;

  return (
    <ul className="space-y-3">
      {(groups || []).map((group) => {
        const isOpen = expanded[group.key];
        const ids = (group.items || []).map((r) => r.id);
        return (
          <li
            key={group.key}
            className="rounded-lg border border-[#E5E5E5] bg-white"
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="flex flex-1 items-start gap-2 text-left"
                onClick={() =>
                  setExpanded((e) => ({ ...e, [group.key]: !e[group.key] }))
                }
              >
                {isOpen ? (
                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-black">{group.className}</p>
                  <p className="text-sm text-neutral-600">
                    {group.teacherName} · {group.date} · {(group.items || []).length}{" "}
                    records
                  </p>
                  <p className="text-xs text-neutral-500">
                    Submitted{" "}
                    {group.submittedAt
                      ? formatDistanceToNow(parseISO(group.submittedAt), {
                          addSuffix: true,
                        })
                      : "—"}
                  </p>
                </div>
              </button>
              <Button
                size="sm"
                disabled={approveAll.isPending || approveOne.isPending}
                onClick={() => approveAll.mutate(ids)}
              >
                Approve All
              </Button>
            </div>
            {isOpen && (
              <div className="border-t border-[#E5E5E5] px-4 pb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(group.items || []).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.student_name}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              r.status === "PRESENT"
                                ? "bg-green-100 text-green-800"
                                : r.status === "ABSENT"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                            }
                          >
                            {r.status === "PRESENT"
                              ? "P"
                              : r.status === "ABSENT"
                                ? "A"
                                : "L"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approveOne.isPending}
                            onClick={() => approveOne.mutate(r.id)}
                          >
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Approvals</h1>
          <p className="text-sm text-neutral-600">
            Review teacher submissions. This page refreshes every 15 seconds.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <Tabs defaultValue="marks">
        <TabsList className="bg-neutral-100">
          <TabsTrigger value="marks">Marks Approvals</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Approvals</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>
        <TabsContent value="marks" className="mt-6">
          <MarksApprovalsTab />
        </TabsContent>
        <TabsContent value="attendance" className="mt-6">
          <AttendanceApprovalsTab />
        </TabsContent>
        <TabsContent value="enrollments" className="mt-6">
          <EnrollmentsApprovalsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

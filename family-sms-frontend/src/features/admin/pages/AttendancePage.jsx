import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, subDays } from "date-fns";
import { Download, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  exportAttendance,
  fetchAttendance,
} from "@/api/attendance";
import { fetchClassStudentsList, fetchClassesList } from "@/api/classes";
import { fetchTeachersList } from "@/api/teachers";
import client from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionError from "@/components/shared/SectionError";

function StatusBadge({ status }) {
  if (!status) return <span className="text-neutral-300">—</span>;
  const map = {
    PRESENT: { label: "P", className: "bg-green-100 text-green-800" },
    ABSENT: { label: "A", className: "bg-red-100 text-red-800" },
    LATE: { label: "L", className: "bg-amber-100 text-amber-800" },
  };
  const cfg = map[status] || { label: "?", className: "bg-neutral-100" };
  return (
    <Badge className={`${cfg.className} cursor-pointer font-semibold`}>
      {cfg.label}
    </Badge>
  );
}

function TeacherStatusBadge({ status }) {
  if (!status) return <span className="text-neutral-300">—</span>;
  const map = {
    PRESENT: { label: "Present", className: "bg-green-100 text-green-800" },
    ABSENT: { label: "Absent", className: "bg-red-100 text-red-800" },
    LATE: { label: "Late", className: "bg-amber-100 text-amber-800" },
    ON_LEAVE: { label: "On Leave", className: "bg-blue-100 text-blue-800" },
  };
  const cfg = map[status] || { label: status, className: "bg-neutral-100" };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

function computeMonthlySummary(students, records) {
  return students
    .map((student) => {
      const studentRecords = records.filter((r) => r.student_id === student.id);
      const present = studentRecords.filter((r) => r.status === "PRESENT").length;
      const absent = studentRecords.filter((r) => r.status === "ABSENT").length;
      const late = studentRecords.filter((r) => r.status === "LATE").length;
      const total = studentRecords.length;
      const pct = total ? Math.round((present / total) * 1000) / 10 : 0;
      return {
        student,
        present,
        absent,
        late,
        pct,
      };
    })
    .sort((a, b) => a.pct - b.pct);
}

export default function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "students";
  
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [classId, setClassId] = useState("");
  const [popover, setPopover] = useState(null);
  const [sendOpen, setSendOpen] = useState(false);

  const handleTabChange = (value) => {
    setSearchParams({ tab: value });
  };

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { results } = await fetchClassesList();
      return results;
    },
  });

  const classes = Array.isArray(classesQ.data)
    ? classesQ.data
    : (classesQ.data?.results ?? []);

  const gridDays = useMemo(() => {
    const end = parseISO(selectedDate);
    return Array.from({ length: 7 }, (_, i) =>
      format(subDays(end, 6 - i), "yyyy-MM-dd")
    );
  }, [selectedDate]);

  const gridQ = useQuery({
    queryKey: ["attendance", "grid", classId, selectedDate],
    queryFn: async () => {
      const { data } = await fetchAttendance({
        class: classId,
        date_range: "last7days",
        date: selectedDate,
      });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId,
  });

  const monthKey = selectedDate.slice(0, 7);
  const monthQ = useQuery({
    queryKey: ["attendance", "month", classId, monthKey],
    queryFn: async () => {
      const { data } = await fetchAttendance({
        class: classId,
        month: monthKey,
      });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId,
  });

  const studentsQ = useQuery({
    queryKey: ["class", classId, "students"],
    queryFn: async () => {
      const { results } = await fetchClassStudentsList(classId);
      return results;
    },
    enabled: !!classId,
  });

  const exportMut = useMutation({
    mutationFn: () =>
      exportAttendance({
        class_id: classId,
        date_from: gridDays[0],
        date_to: gridDays[gridDays.length - 1],
      }),
    onSuccess: (response) => {
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_export_${selectedDate}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    },
    onError: () => toast.error("Export failed."),
  });

  const sendMut = useMutation({
    mutationFn: async () => {
      // Placeholder for send to parents functionality
      toast.success("Attendance sent to parents");
      setSendOpen(false);
    },
  });

  const monthlySummary = useMemo(() => {
    if (!studentsQ.data || !monthQ.data) return [];
    return computeMonthlySummary(studentsQ.data, monthQ.data);
  }, [studentsQ.data, monthQ.data]);

  const recordMap = useMemo(() => {
    const map = {};
    for (const r of gridQ.data ?? []) {
      map[`${r.student_id}-${r.date}`] = r;
    }
    return map;
  }, [gridQ.data]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-black">Attendance Management</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-neutral-100">
          <TabsTrigger value="students">📚 Student Attendance</TabsTrigger>
          <TabsTrigger value="teachers">🎓 Teacher Attendance</TabsTrigger>
        </TabsList>

        {/* STUDENT ATTENDANCE TAB */}
        <TabsContent value="students" className="space-y-8 mt-6">
          <StudentAttendanceTab
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            classId={classId}
            setClassId={setClassId}
            classes={classes}
            gridDays={gridDays}
            gridQ={gridQ}
            monthQ={monthQ}
            studentsQ={studentsQ}
            exportMut={exportMut}
            sendMut={sendMut}
            monthlySummary={monthlySummary}
            recordMap={recordMap}
            popover={popover}
            setPopover={setPopover}
            sendOpen={sendOpen}
            setSendOpen={setSendOpen}
            monthKey={monthKey}
          />
        </TabsContent>

        {/* TEACHER ATTENDANCE TAB */}
        <TabsContent value="teachers" className="space-y-8 mt-6">
          <TeacherAttendanceTab selectedDate={selectedDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Student Attendance Tab Component
function StudentAttendanceTab({
  selectedDate,
  setSelectedDate,
  classId,
  setClassId,
  classes,
  gridDays,
  gridQ,
  monthQ,
  studentsQ,
  exportMut,
  sendMut,
  monthlySummary,
  recordMap,
  popover,
  setPopover,
  sendOpen,
  setSendOpen,
  monthKey,
}) {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="att-date">Date</Label>
            <Input
              id="att-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white"
            disabled={!classId || exportMut.isPending}
            onClick={() => exportMut.mutate()}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportMut.isPending ? "Exporting…" : "Export"}
          </Button>
        </div>
      </div>

      {!classId && (
        <p className="text-sm text-neutral-500">Select a class to view attendance.</p>
      )}

      {classId && gridQ.isError && (
        <SectionError message="Could not load attendance." onRetry={() => gridQ.refetch()} />
      )}

      {classId && (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-4">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
            Last 7 days
          </h2>
          {gridQ.isLoading && (
            <div className="h-48 animate-pulse rounded bg-neutral-100" />
          )}
          {!gridQ.isLoading && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Student</TableHead>
                    {gridDays.map((d) => (
                      <TableHead key={d} className="text-center">
                        {format(parseISO(d), "EEE d")}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(studentsQ.data ?? []).map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      {gridDays.map((d) => {
                        const record = recordMap[`${student.id}-${d}`];
                        return (
                          <TableCell key={d} className="relative text-center">
                            <button
                              type="button"
                              className="inline-flex"
                              onClick={() =>
                                record
                                  ? setPopover({
                                      record,
                                      x: 0,
                                      studentName: student.full_name,
                                    })
                                  : null
                              }
                            >
                              <StatusBadge status={record?.status} />
                            </button>
                            {popover &&
                              record &&
                              popover.record?.id === record.id && (
                              <div className="absolute left-1/2 top-full z-20 mt-1 w-48 -translate-x-1/2 rounded-md border border-[#E5E5E5] bg-white p-3 text-left text-xs shadow-lg">
                                <p className="font-medium text-black">
                                  {popover.studentName}
                                </p>
                                <p className="mt-1 text-neutral-600">
                                  Marked by {record.marked_by_name || "—"}
                                </p>
                                <p className="text-neutral-500">
                                  {record.created_at
                                    ? format(
                                        parseISO(record.created_at),
                                        "MMM d, yyyy h:mm a"
                                      )
                                    : "—"}
                                </p>
                                <button
                                  type="button"
                                  className="mt-2 text-neutral-500 underline"
                                  onClick={() => setPopover(null)}
                                >
                                  Close
                                </button>
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {classId && (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-4">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
            Monthly summary ({monthKey})
          </h2>
          <p className="mb-3 text-xs text-neutral-500">
            Sorted by attendance % ascending (spot problem cases first)
          </p>
          {monthQ.isLoading && (
            <div className="h-32 animate-pulse rounded bg-neutral-100" />
          )}
          {!monthQ.isLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Late</TableHead>
                  <TableHead className="text-right">Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlySummary.map((row) => (
                  <TableRow key={row.student.id}>
                    <TableCell>{row.student.full_name}</TableCell>
                    <TableCell className="text-right text-green-700">
                      {row.present}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {row.absent}
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      {row.late}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {row.pct}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="border-[#E5E5E5] bg-white">
          <DialogHeader>
            <DialogTitle>Send to parents</DialogTitle>
            <DialogDescription>
              Email approved attendance for {gridDays[0]} to{" "}
              {gridDays[gridDays.length - 1]} to primary parent contacts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={sendMut.isPending}
              onClick={() => sendMut.mutate()}
            >
              {sendMut.isPending ? "Sending…" : "Confirm send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Teacher Attendance Tab Component
function TeacherAttendanceTab({ selectedDate }) {
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [markDate, setMarkDate] = useState(today);
  const [selectedTeachers, setSelectedTeachers] = useState({});

  // Fetch all teachers
  const teachersQ = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const data = await fetchTeachersList();
      return data.teachers || [];
    },
  });

  // Fetch teacher attendance for selected date
  const attendanceQ = useQuery({
    queryKey: ["teacher-attendance", markDate],
    queryFn: async () => {
      const { data } = await client.get(`/attendance/teachers/?date=${markDate}`);
      return data || [];
    },
  });

  // Mark teacher attendance mutation
  const markMut = useMutation({
    mutationFn: async (entries) => {
      const { data } = await client.post("/attendance/teachers/mark/", { entries });
      return data;
    },
    onSuccess: () => {
      toast.success("Teacher attendance marked successfully");
      qc.invalidateQueries({ queryKey: ["teacher-attendance"] });
      qc.invalidateQueries({ queryKey: ["teacher-att-today"] });
      setSelectedTeachers({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to mark attendance");
    },
  });

  // Build attendance map
  const attendanceMap = useMemo(() => {
    const map = {};
    (attendanceQ.data || []).forEach((record) => {
      map[record.teacher_id] = record;
    });
    return map;
  }, [attendanceQ.data]);

  const handleStatusChange = (teacherId, status) => {
    setSelectedTeachers((prev) => ({
      ...prev,
      [teacherId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const updates = {};
    (teachersQ.data || []).forEach((teacher) => {
      updates[teacher.id] = status;
    });
    setSelectedTeachers(updates);
  };

  const handleSubmit = () => {
    const entries = Object.entries(selectedTeachers).map(([teacher_id, status]) => ({
      teacher_id,
      status,
      notes: "",
    }));

    if (entries.length === 0) {
      toast.error("Please select at least one teacher");
      return;
    }

    markMut.mutate(entries);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor="teacher-att-date">Date</Label>
          <Input
            id="teacher-att-date"
            type="date"
            value={markDate}
            onChange={(e) => setMarkDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("PRESENT")}
            className="bg-green-50 border-green-200 hover:bg-green-100"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Mark All Present
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedTeachers({})}
          >
            Clear Selection
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={markMut.isPending || Object.keys(selectedTeachers).length === 0}
            className="bg-[#10026B] hover:bg-[#1a0494]"
          >
            {markMut.isPending ? "Saving..." : `Save Attendance (${Object.keys(selectedTeachers).length})`}
          </Button>
        </div>
      </div>

      {/* Teacher List */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-4">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Mark Teacher Attendance - {format(parseISO(markDate), "EEEE, MMMM d, yyyy")}
        </h2>

        {teachersQ.isLoading && (
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded bg-neutral-100" />
            <div className="h-12 animate-pulse rounded bg-neutral-100" />
            <div className="h-12 animate-pulse rounded bg-neutral-100" />
            <p className="text-center text-sm text-neutral-500 py-4">Loading teachers...</p>
          </div>
        )}

        {teachersQ.isError && (
          <SectionError
            message="Could not load teachers."
            onRetry={() => teachersQ.refetch()}
          />
        )}

        {!teachersQ.isLoading && !teachersQ.isError && (
          <>
            {(teachersQ.data || []).length === 0 ? (
              <div className="text-center py-12 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700 font-medium mb-2">No teachers found</p>
                <p className="text-sm text-amber-600">
                  Please add teachers first in the Teachers section.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff ID</TableHead>
                      <TableHead>Teacher Name</TableHead>
                      <TableHead>Assigned Class</TableHead>
                      <TableHead className="text-center">Current Status</TableHead>
                      <TableHead className="text-center">Mark As</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(teachersQ.data || []).map((teacher) => {
                      const existingRecord = attendanceMap[teacher.id];
                      const currentStatus = selectedTeachers[teacher.id] || existingRecord?.status || "";

                      return (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-mono text-sm">
                            {teacher.staff_id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {teacher.full_name}
                          </TableCell>
                          <TableCell className="text-sm text-neutral-600">
                            {teacher.assigned_class_name || (
                              <span className="text-amber-600">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {existingRecord ? (
                              <TeacherStatusBadge status={existingRecord.status} />
                            ) : (
                              <span className="text-neutral-400 text-sm">Not marked</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant={currentStatus === "PRESENT" ? "default" : "outline"}
                                onClick={() => handleStatusChange(teacher.id, "PRESENT")}
                                className={currentStatus === "PRESENT" ? "bg-green-600 hover:bg-green-700" : ""}
                              >
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === "ABSENT" ? "default" : "outline"}
                                onClick={() => handleStatusChange(teacher.id, "ABSENT")}
                                className={currentStatus === "ABSENT" ? "bg-red-600 hover:bg-red-700" : ""}
                              >
                                Absent
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === "LATE" ? "default" : "outline"}
                                onClick={() => handleStatusChange(teacher.id, "LATE")}
                                className={currentStatus === "LATE" ? "bg-amber-600 hover:bg-amber-700" : ""}
                              >
                                Late
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === "ON_LEAVE" ? "default" : "outline"}
                                onClick={() => handleStatusChange(teacher.id, "ON_LEAVE")}
                                className={currentStatus === "ON_LEAVE" ? "bg-blue-600 hover:bg-blue-700" : ""}
                              >
                                On Leave
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

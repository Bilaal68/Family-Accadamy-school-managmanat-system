import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  fetchStudentAttendance,
  fetchStudentGrades,
  fetchStudentRemarks,
  getStudent,
} from "@/api/students";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ListSkeleton } from "@/components/shared/SectionSkeleton";

import StudentAvatar from "./StudentAvatar";

const GENDER_LABELS = { M: "Male", F: "Female", OTHER: "Other" };
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function statusColor(status) {
  if (status === "PRESENT") return "bg-green-500";
  if (status === "ABSENT") return "bg-red-500";
  if (status === "LATE") return "bg-amber-500";
  return "bg-neutral-100";
}

function gradeStatus(row) {
  if (row.approved_at) return { label: "Approved", className: "bg-green-100 text-green-800" };
  if (row.submitted_at) return { label: "Pending", className: "bg-amber-100 text-amber-800" };
  return { label: "Draft", className: "bg-neutral-200 text-neutral-700" };
}

function AttendanceHeatmap({ records, month }) {
  const { cells, monthLabel } = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const leading = getDay(start);
    const padded = [...Array(leading).fill(null), ...days];
    return {
      cells: padded,
      monthLabel: format(month, "MMMM yyyy"),
    };
  }, [records, month]);

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-black">{monthLabel}</p>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`pad-${i}`} className="aspect-square" />;
          }
          const key = format(day, "yyyy-MM-dd");
          const status = records?.find((r) => r.date === key)?.status;
          return (
            <div
              key={key}
              title={status ? `${key}: ${status}` : key}
              className={`aspect-square rounded-sm ${statusColor(status)}`}
            />
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-600">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-green-500" /> Present
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-red-500" /> Absent
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-amber-500" /> Late
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-neutral-100" /> No record
        </span>
      </div>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const [heatmapMonth, setHeatmapMonth] = useState(() => startOfMonth(new Date()));

  const studentQ = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data } = await getStudent(id);
      return data;
    },
  });

  const attendanceQ = useQuery({
    queryKey: ["student", id, "attendance"],
    queryFn: async () => {
      const { data } = await fetchStudentAttendance(id);
      return Array.isArray(data) ? data : [];
    },
  });

  const gradesQ = useQuery({
    queryKey: ["student", id, "grades"],
    queryFn: async () => {
      const { data } = await fetchStudentGrades(id);
      return Array.isArray(data) ? data : [];
    },
  });

  const remarksQ = useQuery({
    queryKey: ["student", id, "remarks"],
    queryFn: async () => {
      const { data } = await fetchStudentRemarks(id);
      return Array.isArray(data) ? data : [];
    },
  });

  const monthAttendance = useMemo(() => {
    if (!attendanceQ.data) return [];
    const start = format(startOfMonth(heatmapMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(heatmapMonth), "yyyy-MM-dd");
    return attendanceQ.data.filter((r) => r.date >= start && r.date <= end);
  }, [attendanceQ.data, heatmapMonth]);

  if (studentQ.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-lg bg-neutral-200" />
          <div className="h-80 animate-pulse rounded-lg bg-neutral-200" />
        </div>
      </div>
    );
  }

  if (studentQ.isError) {
    return (
      <SectionError
        message="Could not load student."
        onRetry={() => studentQ.refetch()}
      />
    );
  }

  const student = studentQ.data;

  return (
    <div className="space-y-6">
      <Link
        to="/admin/students"
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to students
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="border-[#E5E5E5] bg-white">
          <CardContent className="flex flex-col items-center pt-8 text-center">
            <StudentAvatar
              photo={student.photo}
              name={student.full_name}
              className="h-32 w-32"
            />
            <p className="mt-4 font-mono text-sm text-neutral-500">{student.student_id}</p>
            <h1 className="text-xl font-semibold text-black">{student.full_name}</h1>
            <dl className="mt-6 w-full space-y-3 text-left text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Class</dt>
                <dd className="font-medium text-black">{student.class_name}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Date of birth</dt>
                <dd className="font-medium text-black">
                  {student.date_of_birth
                    ? format(parseISO(student.date_of_birth), "MMM d, yyyy")
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Gender</dt>
                <dd className="font-medium text-black">
                  {GENDER_LABELS[student.gender] || student.gender}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Enrolled</dt>
                <dd className="font-medium text-black">
                  {student.enrolled_at
                    ? format(parseISO(student.enrolled_at), "MMM d, yyyy")
                    : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border-[#E5E5E5] bg-white">
          <CardHeader>
            <CardTitle>Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="attendance">
              <TabsList className="mb-4 bg-neutral-100">
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="remarks">Remarks</TabsTrigger>
              </TabsList>

              <TabsContent value="attendance" className="space-y-4">
                {attendanceQ.isLoading && <ListSkeleton items={4} />}
                {attendanceQ.isError && (
                  <SectionError
                    message="Could not load attendance."
                    onRetry={() => attendanceQ.refetch()}
                  />
                )}
                {!attendanceQ.isLoading && !attendanceQ.isError && (
                  <>
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setHeatmapMonth((m) => subMonths(startOfMonth(m), 1))
                        }
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setHeatmapMonth((m) => addMonths(startOfMonth(m), 1))
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <AttendanceHeatmap records={monthAttendance} month={heatmapMonth} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="grades">
                {gradesQ.isLoading && <ListSkeleton items={4} />}
                {gradesQ.isError && (
                  <SectionError
                    message="Could not load grades."
                    onRetry={() => gradesQ.refetch()}
                  />
                )}
                {!gradesQ.isLoading && !gradesQ.isError && (
                  <>
                    {gradesQ.data.length === 0 ? (
                      <p className="py-8 text-center text-sm text-neutral-500">
                        No grades recorded.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {gradesQ.data.map((g) => {
                            const st = gradeStatus(g);
                            return (
                              <TableRow key={g.id}>
                                <TableCell>{g.subject}</TableCell>
                                <TableCell>{g.score}</TableCell>
                                <TableCell>{g.term}</TableCell>
                                <TableCell>
                                  <Badge className={st.className}>{st.label}</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="remarks">
                {remarksQ.isLoading && <ListSkeleton items={4} />}
                {remarksQ.isError && (
                  <SectionError
                    message="Could not load remarks."
                    onRetry={() => remarksQ.refetch()}
                  />
                )}
                {!remarksQ.isLoading && !remarksQ.isError && (
                  <>
                    {remarksQ.data.length === 0 ? (
                      <p className="py-8 text-center text-sm text-neutral-500">
                        No remarks or behaviour notes yet.
                      </p>
                    ) : (
                      <ul className="space-y-4">
                        {remarksQ.data.map((note) => (
                          <li
                            key={note.id}
                            className="rounded-md border border-[#E5E5E5] p-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="outline">
                                {note.note_type === "BEHAVIOUR" ? "Behaviour" : "Remark"}
                              </Badge>
                              <span className="text-xs text-neutral-500">
                                {note.created_at
                                  ? format(parseISO(note.created_at), "MMM d, yyyy")
                                  : ""}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-black">{note.content}</p>
                            {note.author_name && (
                              <p className="mt-1 text-xs text-neutral-500">
                                — {note.author_name}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ArrowLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";
import React from "react";
import { Link, useParams } from "react-router-dom";

import { fetchAttendance } from "@/api/attendance";
import {
  fetchClassLeaderboard,
  fetchClassStudentsList,
  getClass,
} from "@/api/classes";
import { fetchGrades } from "@/api/grades";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import useDebouncedValue from "@/hooks/useDebouncedValue";

function AttendanceBadge({ status }) {
  if (!status) {
    return <span className="text-neutral-300">—</span>;
  }
  const map = {
    PRESENT: { label: "P", className: "bg-green-100 text-green-800" },
    ABSENT: { label: "A", className: "bg-red-100 text-red-800" },
    LATE: { label: "L", className: "bg-amber-100 text-amber-800" },
  };
  const cfg = map[status] || { label: "?", className: "bg-neutral-100" };
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function buildSubjectAverages(marks) {
  const approved = marks.filter((m) => m.approved_at);
  const bySubject = {};
  for (const m of approved) {
    if (!bySubject[m.subject]) bySubject[m.subject] = [];
    bySubject[m.subject].push(Number(m.score));
  }
  return Object.entries(bySubject)
    .map(([subject, scores]) => ({
      subject,
      average:
        Math.round(
          (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
        ) / 100,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

export default function ClassDetail() {
  const { id } = useParams();
  const [studentSearch, setStudentSearch] = useState("");
  const debouncedSearch = useDebouncedValue(studentSearch, 300);

  const classQ = useQuery({
    queryKey: ["class", id],
    queryFn: async () => {
      const { data } = await getClass(id);
      return data;
    },
  });

  const leaderboardQ = useQuery({
    queryKey: ["class", id, "leaderboard"],
    queryFn: async () => {
      const { data } = await fetchClassLeaderboard(id);
      return Array.isArray(data) ? data : [];
    },
  });

  const studentsQ = useQuery({
    queryKey: ["class", id, "students"],
    queryFn: async () => {
      const { results } = await fetchClassStudentsList(id);
      return results;
    },
  });

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(
    (d) => {
      const day = d.getDay();
      return day >= 1 && day <= 5;
    }
  );
  const monthKey = format(new Date(), "yyyy-MM");

  const attendanceQ = useQuery({
    queryKey: ["class", id, "attendance", monthKey],
    queryFn: async () => {
      const { data } = await fetchAttendance({ class: id, month: monthKey });
      return Array.isArray(data) ? data : [];
    },
  });

  const gradesQ = useQuery({
    queryKey: ["class", id, "grades"],
    queryFn: async () => {
      const { data } = await fetchGrades({ class: id });
      return Array.isArray(data) ? data : [];
    },
  });

  const filteredStudents = useMemo(() => {
    const list = studentsQ.data ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.student_id?.toLowerCase().includes(q)
    );
  }, [studentsQ.data, debouncedSearch]);

  const subjectAverages = useMemo(
    () => buildSubjectAverages(gradesQ.data ?? []),
    [gradesQ.data]
  );

  if (classQ.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-neutral-200" />
          <div className="h-64 animate-pulse rounded-lg bg-neutral-200" />
        </div>
      </div>
    );
  }

  if (classQ.isError) {
    return (
      <SectionError
        message="Could not load class."
        onRetry={() => classQ.refetch()}
      />
    );
  }

  const cls = classQ.data;
  const studentCount = cls.students?.length ?? studentsQ.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <Link
        to="/admin/classes"
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to classes
      </Link>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Card className="border-[#E5E5E5] bg-white">
            <CardHeader>
              <CardTitle>{cls.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Teacher</span>
                <span className="font-medium">
                  {cls.teacher?.full_name || (
                    <span className="text-amber-600">Unassigned</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Students</span>
                <span className="font-medium">{studentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Grade</span>
                <span>
                  {cls.grade} · {cls.section}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E5E5E5] bg-white">
            <CardHeader>
              <CardTitle className="text-base">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardQ.isLoading && <ListSkeleton items={4} />}
              {leaderboardQ.isError && (
                <SectionError
                  message="Could not load leaderboard."
                  onRetry={() => leaderboardQ.refetch()}
                />
              )}
              {!leaderboardQ.isLoading && leaderboardQ.data?.length === 0 && (
                <p className="text-sm text-neutral-500">No graded students yet.</p>
              )}
              <ul className="space-y-3">
                {leaderboardQ.data?.map((entry) => (
                  <li
                    key={entry.student_id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold">
                        {entry.rank}
                      </span>
                      <Link
                        to={`/admin/students/${entry.student_id}`}
                        className="font-medium hover:underline"
                      >
                        {entry.full_name}
                      </Link>
                    </div>
                    <Badge className="bg-black text-white">
                      {entry.overall_average}%
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#E5E5E5] bg-white">
          <CardContent className="pt-6">
            <Tabs defaultValue="students">
              <TabsList className="mb-4 bg-neutral-100">
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    className="pl-9"
                    placeholder="Search students…"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                {studentsQ.isLoading && <ListSkeleton items={5} />}
                {!studentsQ.isLoading && filteredStudents.length === 0 && (
                  <p className="text-sm text-neutral-500">No students in this class.</p>
                )}
                {!studentsQ.isLoading && filteredStudents.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Average</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">
                            {s.student_id}
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/admin/students/${s.id}`}
                              className="font-medium hover:underline"
                            >
                              {s.full_name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {Number(s.overall_average || 0).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="attendance">
                {attendanceQ.isLoading && <ListSkeleton items={4} />}
                {attendanceQ.isError && (
                  <SectionError
                    message="Could not load attendance."
                    onRetry={() => attendanceQ.refetch()}
                  />
                )}
                {!attendanceQ.isLoading && !attendanceQ.isError && (
                  <>
                    <p className="mb-3 text-sm text-neutral-600">
                      This week ({format(weekStart, "MMM d")} –{" "}
                      {format(weekEnd, "MMM d")})
                    </p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[140px]">Student</TableHead>
                            {weekDays.map((d) => (
                              <TableHead key={d.toISOString()} className="text-center">
                                {format(d, "EEE")}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(studentsQ.data ?? []).map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="text-sm font-medium">
                                {student.full_name}
                              </TableCell>
                              {weekDays.map((d) => {
                                const dateKey = format(d, "yyyy-MM-dd");
                                const record = (attendanceQ.data ?? []).find(
                                  (r) =>
                                    r.student_id === student.id &&
                                    r.date === dateKey
                                );
                                return (
                                  <TableCell
                                    key={dateKey}
                                    className="text-center"
                                  >
                                    <AttendanceBadge status={record?.status} />
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
                {!gradesQ.isLoading && subjectAverages.length === 0 && (
                  <p className="text-sm text-neutral-500">
                    No approved grades for this class yet.
                  </p>
                )}
                {!gradesQ.isLoading && subjectAverages.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Class average</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectAverages.map((row) => (
                        <TableRow key={row.subject}>
                          <TableCell className="font-medium">{row.subject}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.average}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="results">
                {gradesQ.isLoading && <ListSkeleton items={4} />}
                {gradesQ.isError && (
                  <SectionError
                    message="Could not load results."
                    onRetry={() => gradesQ.refetch()}
                  />
                )}
                {!gradesQ.isLoading && !gradesQ.isError && (
                  <>
                    {(studentsQ.data ?? []).length === 0 ? (
                      <p className="text-sm text-neutral-500">No students in this class.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[140px]">Student</TableHead>
                              {subjectAverages.map((sub) => (
                                <React.Fragment key={sub.subject}>
                                  <TableHead className="text-center min-w-[80px]">
                                    {sub.subject}<br />
                                    <span className="text-xs text-neutral-500">Sem 1</span>
                                  </TableHead>
                                  <TableHead className="text-center min-w-[80px]">
                                    <span className="text-xs text-neutral-500">Sem 2</span>
                                  </TableHead>
                                  <TableHead className="text-center min-w-[80px] font-bold">
                                    Final
                                  </TableHead>
                                </React.Fragment>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(studentsQ.data ?? []).map((student) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.full_name}</TableCell>
                                {subjectAverages.map((sub) => {
                                  const sem1 = (gradesQ.data ?? []).find(
                                    (g) => g.student_id === student.id && g.subject === sub.subject && g.semester === "SEMESTER_1" && g.approved_at
                                  );
                                  const sem2 = (gradesQ.data ?? []).find(
                                    (g) => g.student_id === student.id && g.subject === sub.subject && g.semester === "SEMESTER_2" && g.approved_at
                                  );
                                  const final = (gradesQ.data ?? []).find(
                                    (g) => g.student_id === student.id && g.subject === sub.subject && g.semester === "FINAL" && g.approved_at
                                  );
                                  return (
                                    <React.Fragment key={`${student.id}-${sub.subject}`}>
                                      <TableCell className="text-center">
                                        {sem1 ? (
                                          <div>
                                            <span className="font-medium">{sem1.score}</span>
                                            <div className="text-xs text-green-600">Approved</div>
                                          </div>
                                        ) : (
                                          <span className="text-neutral-300">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {sem2 ? (
                                          <div>
                                            <span className="font-medium">{sem2.score}</span>
                                            <div className="text-xs text-green-600">Approved</div>
                                          </div>
                                        ) : (
                                          <span className="text-neutral-300">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {final ? (
                                          <div>
                                            <span className="font-bold text-primary">{final.score}</span>
                                            <div className="text-xs text-green-600">Approved</div>
                                          </div>
                                        ) : (
                                          <span className="text-neutral-300">—</span>
                                        )}
                                      </TableCell>
                                    </React.Fragment>
                                  );
                                })}
                              </TableRow>
                            ))}
                            <TableRow className="bg-neutral-50">
                              <TableCell className="font-bold">Class Average</TableCell>
                              {subjectAverages.map((sub) => {
                                const sem1Grades = (gradesQ.data ?? []).filter(
                                  (g) => g.subject === sub.subject && g.semester === "SEMESTER_1" && g.approved_at
                                );
                                const sem2Grades = (gradesQ.data ?? []).filter(
                                  (g) => g.subject === sub.subject && g.semester === "SEMESTER_2" && g.approved_at
                                );
                                const finalGrades = (gradesQ.data ?? []).filter(
                                  (g) => g.subject === sub.subject && g.semester === "FINAL" && g.approved_at
                                );
                                const sem1Avg = sem1Grades.length > 0 
                                  ? (sem1Grades.reduce((a, b) => a + Number(b.score), 0) / sem1Grades.length).toFixed(1)
                                  : "—";
                                const sem2Avg = sem2Grades.length > 0 
                                  ? (sem2Grades.reduce((a, b) => a + Number(b.score), 0) / sem2Grades.length).toFixed(1)
                                  : "—";
                                const finalAvg = finalGrades.length > 0 
                                  ? (finalGrades.reduce((a, b) => a + Number(b.score), 0) / finalGrades.length).toFixed(1)
                                  : "—";
                                return (
                                  <React.Fragment key={`avg-${sub.subject}`}>
                                    <TableCell className="text-center font-medium">{sem1Avg}%</TableCell>
                                    <TableCell className="text-center font-medium">{sem2Avg}%</TableCell>
                                    <TableCell className="text-center font-bold text-primary">{finalAvg}%</TableCell>
                                  </React.Fragment>
                                );
                              })}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
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

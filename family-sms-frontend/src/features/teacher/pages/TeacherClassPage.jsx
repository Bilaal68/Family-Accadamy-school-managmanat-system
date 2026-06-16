import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Link } from "react-router-dom";

import { fetchClassLeaderboard, fetchClassStudentsList, getClass } from "@/api/classes";
import { fetchGrades } from "@/api/grades";
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
import { PanelSkeleton } from "@/components/shared/SectionSkeleton";
import { useTeacherClass } from "@/hooks/useTeacherClass";

export default function TeacherClassPage() {
  const { classId, className } = useTeacherClass();

  const classQ = useQuery({
    queryKey: ["teacher", "class-detail", classId],
    queryFn: async () => {
      const { data } = await getClass(classId);
      return data;
    },
    enabled: !!classId,
  });

  const studentsQ = useQuery({
    queryKey: ["teacher", "class", classId, "students"],
    queryFn: () => fetchClassStudentsList(classId),
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

  const gradesQ = useQuery({
    queryKey: ["teacher", "class", classId, "grades"],
    queryFn: async () => {
      const { data } = await fetchGrades({ class: classId });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId,
  });

  const subjectAverages = React.useMemo(() => {
    const approved = (gradesQ.data ?? []).filter((m) => m.approved_at);
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
  }, [gradesQ.data]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-heading">{className}</h2>
        <p className="text-sm text-subtext">
          {classQ.data?.grade && classQ.data?.section
            ? `${classQ.data.grade} · Section ${classQ.data.section}`
            : "Your assigned class"}
        </p>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="bg-neutral-100">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Students ({studentsQ.data?.count ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {studentsQ.isLoading && <PanelSkeleton rows={5} />}
              {studentsQ.isError && (
                <SectionError message="Could not load students." onRetry={() => studentsQ.refetch()} />
              )}
              {!studentsQ.isLoading && !studentsQ.isError && (
                <ul className="divide-y divide-brand">
                  {(studentsQ.data?.results ?? []).map((s) => (
                    <li key={s.id} className="flex justify-between py-3 text-sm">
                      <span className="font-medium text-heading">{s.full_name}</span>
                      <span className="font-mono text-muted-label">{s.student_id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardQ.isLoading && <PanelSkeleton rows={5} />}
              {!leaderboardQ.isLoading && (
                <ol className="space-y-2">
                  {(leaderboardQ.data ?? []).map((e) => (
                    <li
                      key={e.student_id}
                      className="flex items-center justify-between rounded-md bg-page/60 px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="mr-2 font-bold text-accent">#{e.rank}</span>
                        {e.full_name}
                      </span>
                      <span className="font-semibold tabular-nums">{e.overall_average}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {gradesQ.isLoading && <PanelSkeleton rows={5} />}
              {gradesQ.isError && (
                <SectionError
                  message="Could not load results."
                  onRetry={() => gradesQ.refetch()}
                />
              )}
              {!gradesQ.isLoading && !gradesQ.isError && (
                <>
                  {(studentsQ.data?.results ?? []).length === 0 ? (
                    <p className="text-sm text-neutral-500">No students in this class.</p>
                  ) : subjectAverages.length === 0 ? (
                    <p className="text-sm text-neutral-500">No approved grades yet.</p>
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
                          {(studentsQ.data?.results ?? []).map((student) => (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

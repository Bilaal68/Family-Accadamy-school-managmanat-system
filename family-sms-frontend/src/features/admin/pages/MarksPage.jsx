import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { fetchClassStudentsList, fetchClassesList } from "@/api/classes";
import { fetchGrades } from "@/api/grades";
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
import SectionError from "@/components/shared/SectionError";

function scoreClass(score) {
  const n = Number(score);
  if (n >= 80) return "font-semibold text-black";
  if (n >= 60) return "text-neutral-600";
  return "font-medium text-red-600";
}

function buildMarksTable(students, marks, subjectFilter) {
  const subjects = [
    ...new Set(marks.map((m) => m.subject).filter(Boolean)),
  ].sort();
  const visibleSubjects =
    subjectFilter && subjectFilter !== "all"
      ? subjects.filter((s) => s === subjectFilter)
      : subjects;

  const byStudentSubject = {};
  for (const m of marks) {
    byStudentSubject[`${m.student_id}-${m.subject}`] = m.score;
  }

  const rows = students.map((student) => {
    const scores = visibleSubjects.map(
      (sub) => byStudentSubject[`${student.id}-${sub}`]
    );
    const nums = scores.filter((s) => s != null).map(Number);
    const avg = nums.length
      ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
      : null;
    return { student, scores, avg, subjects: visibleSubjects };
  });

  const subjectAvgs = visibleSubjects.map((sub, colIdx) => {
    const vals = rows
      .map((r) => r.scores[colIdx])
      .filter((s) => s != null)
      .map(Number);
    return vals.length
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : null;
  });

  return { rows, subjects: visibleSubjects, subjectAvgs };
}

export default function MarksPage() {
  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState("all");
  const [subject, setSubject] = useState("all");

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { results } = await fetchClassesList();
      return results;
    },
  });

  const gradesQ = useQuery({
    queryKey: ["marks", classId, term],
    queryFn: async () => {
      const params = { class: classId };
      if (term !== "all") params.term = term;
      const { data } = await fetchGrades(params);
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

  const terms = useMemo(() => {
    const set = new Set((gradesQ.data ?? []).map((m) => m.term).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [gradesQ.data]);

  const subjects = useMemo(() => {
    const set = new Set(
      (gradesQ.data ?? []).map((m) => m.subject).filter(Boolean)
    );
    return ["all", ...Array.from(set).sort()];
  }, [gradesQ.data]);

  const table = useMemo(() => {
    if (!studentsQ.data) return null;
    return buildMarksTable(studentsQ.data, gradesQ.data ?? [], subject);
  }, [studentsQ.data, gradesQ.data, subject]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-black">Marks</h1>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classesQ.data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Term</Label>
          <Select value={term} onValueChange={setTerm} disabled={!classId}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {terms.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "all" ? "All terms" : t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Subject</Label>
          <Select value={subject} onValueChange={setSubject} disabled={!classId}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All subjects" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!classId && (
        <p className="text-sm text-neutral-500">Select a class to view marks.</p>
      )}

      {classId && gradesQ.isError && (
        <SectionError message="Could not load marks." onRetry={() => gradesQ.refetch()} />
      )}

      {classId && gradesQ.isLoading && (
        <div className="h-64 animate-pulse rounded-lg bg-neutral-200" />
      )}

      {classId && !gradesQ.isLoading && table && (
        <div className="overflow-x-auto rounded-lg border border-[#E5E5E5] bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Student</TableHead>
                {table.subjects.map((sub) => (
                  <TableHead key={sub} className="text-center">
                    {sub}
                  </TableHead>
                ))}
                <TableHead className="text-right">Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row) => (
                <TableRow key={row.student.id}>
                  <TableCell className="font-medium">
                    {row.student.full_name}
                  </TableCell>
                  {row.scores.map((score, i) => (
                    <TableCell key={i} className="text-center tabular-nums">
                      {score != null ? (
                        <span className={scoreClass(score)}>{score}</span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium tabular-nums">
                    {row.avg != null ? (
                      <span className={scoreClass(row.avg)}>{row.avg}</span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-neutral-50 font-medium">
                <TableCell>Class average</TableCell>
                {table.subjectAvgs.map((avg, i) => (
                  <TableCell key={i} className="text-center tabular-nums">
                    {avg != null ? (
                      <span className={scoreClass(avg)}>{avg}</span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                ))}
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

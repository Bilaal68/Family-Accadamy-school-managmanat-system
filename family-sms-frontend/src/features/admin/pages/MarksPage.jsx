import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { fetchClassStudentsList, fetchClassesList } from "@/api/classes";
import { fetchGrades, fetchSubjects } from "@/api/grades";
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
  const [assessmentType, setAssessmentType] = useState("all");

  // Define all available semester and assessment type options
  const SEMESTER_OPTIONS = [
    { value: "all", label: "All terms" },
    { value: "SEMESTER_1", label: "Semester 1" },
    { value: "SEMESTER_2", label: "Semester 2" },
    { value: "FINAL", label: "Final" },
  ];

  const ASSESSMENT_TYPE_OPTIONS = [
    { value: "all", label: "All assessment types" },
    { value: "TEST", label: "Test" },
    { value: "QUIZ", label: "Quiz" },
    { value: "ASSIGNMENT", label: "Assignment" },
    { value: "PROJECT", label: "Project" },
    { value: "MID_EXAM", label: "Mid Exam" },
    { value: "FINAL_EXAM", label: "Final Exam" },
    { value: "HOMEWORK", label: "Homework" },
    { value: "PARTICIPATION", label: "Class Participation" },
    { value: "OTHER", label: "Other" },
  ];

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { results } = await fetchClassesList();
      return results;
    },
  });

  const gradesQ = useQuery({
    queryKey: ["marks", classId, term, assessmentType],
    queryFn: async () => {
      const params = { class: classId };
      if (term !== "all") params.term = term;
      if (assessmentType !== "all") params.assessment_type = assessmentType;
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

  // Fetch official subjects from the teacher subjects table
  const subjectsQ = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data } = await fetchSubjects();
      return Array.isArray(data) ? data : [];
    },
  });

  const subjects = useMemo(() => {
    // Get official subject names from the database
    const officialSubjectNames = new Set(
      (subjectsQ.data ?? []).map((s) => s.name).filter(Boolean)
    );
    
    // Filter marks subjects to only include official subjects
    const marksSubjectNames = new Set(
      (gradesQ.data ?? [])
        .map((m) => m.subject)
        .filter((s) => s && officialSubjectNames.has(s))
    );
    
    return ["all", ...Array.from(marksSubjectNames).sort()];
  }, [gradesQ.data, subjectsQ.data]);

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
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTER_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Subject</Label>
          <Select value={subject} onValueChange={setSubject} disabled={!classId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select subject" />
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
        <div className="space-y-1">
          <Label>Assessment Type</Label>
          <Select value={assessmentType} onValueChange={setAssessmentType} disabled={!classId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select assessment type" />
            </SelectTrigger>
            <SelectContent>
              {ASSESSMENT_TYPE_OPTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
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

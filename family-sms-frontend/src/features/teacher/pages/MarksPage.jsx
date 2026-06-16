import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { fetchClassStudentsList } from "@/api/classes";
import { fetchGrades, fetchGradeAverages } from "@/api/grades";
import apiClient from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SectionError from "@/components/shared/SectionError";
import { PanelSkeleton } from "@/components/shared/SectionSkeleton";
import { useTeacherClass } from "@/hooks/useTeacherClass";
import { cn } from "@/lib/utils";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MarksPage() {
  const { classId, className } = useTeacherClass();
  const qc = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState("SEMESTER_1");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [localScores, setLocalScores] = useState({});
  const [localRemarks, setLocalRemarks] = useState({});

  const studentsQ = useQuery({
    queryKey: ["teacher", "class", classId, "students"],
    queryFn: () => fetchClassStudentsList(classId),
    enabled: !!classId,
  });

  const gradesQ = useQuery({
    queryKey: ["teacher", "grades", classId, selectedSemester, selectedSubject],
    queryFn: async () => {
      const { data } = await fetchGrades({ class: classId, semester: selectedSemester, subject: selectedSubject });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId,
  });

  const students = studentsQ.data?.results ?? [];
  const grades = gradesQ.data ?? [];
  const gradeByStudent = grades.reduce((map, g) => {
    map[g.student_id] = g;
    return map;
  }, {});

  // Initialize local state with existing grades
  useState(() => {
    const scores = {};
    const remarks = {};
    students.forEach((s) => {
      const grade = gradeByStudent[s.id];
      if (grade) {
        scores[s.id] = grade.score;
        remarks[s.id] = grade.remarks || "";
      }
    });
    setLocalScores(scores);
    setLocalRemarks(remarks);
  });

  const marksEntered = students.filter((s) => {
    const grade = gradeByStudent[s.id];
    return grade && grade.score !== null && grade.score !== undefined;
  }).length;

  const allMarksEntered = marksEntered === students.length && students.length > 0;

  const anySubmitted = grades.length > 0 && grades.some((g) => g.submitted_at);
  const allApproved = grades.length > 0 && grades.every((g) => g.approved_at);
  const readOnly = anySubmitted;

  const saveAllMut = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const student of students) {
        const score = localScores[student.id];
        const remarks = localRemarks[student.id] || "";
        
        if (score === undefined || score === null || score === "") continue;
        
        const existing = gradeByStudent[student.id];
        const payload = {
          student: student.id,  // Changed from student_id to student
          subject: selectedSubject,
          semester: selectedSemester,
          score: parseFloat(score),
          remarks,
        };

        try {
          let response;
          if (existing) {
            response = await apiClient.put(`/grades/${existing.id}/`, payload);
          } else {
            response = await apiClient.post("/grades/", payload);
          }
          results.push({ studentId: student.id, success: true });
        } catch (error) {
          console.error('Save failed - Error:', error);
          console.error('Save failed - Payload:', payload);
          const errorMessage = error.response?.data?.detail || error.message || "Failed to save";
          results.push({ studentId: student.id, success: false, error: errorMessage });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const failed = results.filter((r) => !r.success);
      if (failed.length === 0) {
        toast.success("Marks saved successfully");
      } else {
        toast.error(`${failed.length} marks failed to save`);
        failed.forEach((f) => {
          console.error(`Failed to save mark for student ${f.studentId}:`, f.error);
        });
      }
      qc.invalidateQueries({ queryKey: ["teacher", "grades", classId, selectedSemester, selectedSubject] });
      qc.invalidateQueries({ queryKey: ["teacher", "averages", classId] });
    },
    onError: (e) => {
      toast.error("Could not save marks");
    },
  });

  const submitMut = useMutation({
    mutationFn: () => {
      return apiClient.post("/grades/submit/", {
        semester: selectedSemester,
        subject: selectedSubject,
      });
    },
    onSuccess: () => {
      toast.success("Marks submitted to admin for approval");
      qc.invalidateQueries({ queryKey: ["teacher", "grades", classId, selectedSemester, selectedSubject] });
      qc.invalidateQueries({ queryKey: ["teacher", "pending-submissions", classId] });
      setShowSubmitDialog(false);
    },
    onError: (e) => {
      toast.error(e.response?.data?.detail || "Could not submit marks.");
    },
  });

  const handleScoreChange = (studentId, value) => {
    const numValue = parseFloat(value);
    if (value === "" || isNaN(numValue)) {
      setLocalScores((prev) => ({ ...prev, [studentId]: "" }));
      return;
    }
    if (numValue < 0 || numValue > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }
    setLocalScores((prev) => ({ ...prev, [studentId]: numValue }));
  };

  const handleRemarksChange = (studentId, value) => {
    setLocalRemarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const hasUnsavedChanges = (studentId) => {
    const grade = gradeByStudent[studentId];
    const localScore = localScores[studentId];
    const localRemark = localRemarks[studentId] || "";
    
    if (!grade) {
      return localScore !== undefined && localScore !== "" && localScore !== null;
    }
    
    return grade.score !== localScore || (grade.remarks || "") !== localRemark;
  };

  const getSemesterDisplay = (value) => {
    const map = {
      "SEMESTER_1": "Semester 1",
      "SEMESTER_2": "Semester 2",
    };
    return map[value] || value;
  };

  const handleSubmit = () => {
    submitMut.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-heading">{className}</h2>
        <p className="text-sm text-subtext">Marks entry</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Marks Entry</CardTitle>
            <div className="flex gap-3">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                disabled={readOnly}
                className="rounded-md border border-brand bg-card px-3 py-2 text-sm text-heading"
              >
                <option value="SEMESTER_1">Semester 1</option>
                <option value="SEMESTER_2">Semester 2</option>
              </select>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={readOnly}
                className="rounded-md border border-brand bg-card px-3 py-2 text-sm text-heading"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Science">Science</option>
                <option value="Social Studies">Social Studies</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-subtext">
            <span>{marksEntered} of {students.length} students have marks entered</span>
          </div>
        </CardHeader>
        <CardContent>
          {allApproved && (
            <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              Approved by Admin
            </div>
          )}

          {anySubmitted && !allApproved && (
            <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Submitted — Pending Admin Approval
            </div>
          )}

          {studentsQ.isLoading && <PanelSkeleton rows={6} />}
          {studentsQ.isError && (
            <SectionError
              message="Could not load students."
              onRetry={() => studentsQ.refetch()}
            />
          )}
          {!studentsQ.isLoading && !studentsQ.isError && (
            <>
              {students.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-label">
                  No students in this class yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand">
                        <th className="py-3 text-left text-sm font-semibold text-heading">Student</th>
                        <th className="py-3 text-left text-sm font-semibold text-heading">Student ID</th>
                        <th className="py-3 text-left text-sm font-semibold text-heading">Score (0-100)</th>
                        <th className="py-3 text-left text-sm font-semibold text-heading">Remarks</th>
                        <th className="py-3 text-left text-sm font-semibold text-heading">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const grade = gradeByStudent[student.id];
                        const unsaved = hasUnsavedChanges(student.id);
                        return (
                          <tr key={student.id} className="border-b border-brand">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {initials(student.full_name)}
                                </div>
                                <span className="text-sm font-medium text-heading">
                                  {student.full_name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="font-mono text-xs text-muted-label">
                                {student.student_id}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={localScores[student.id] ?? ""}
                                  onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                  disabled={readOnly || saveAllMut.isPending}
                                  className={cn(
                                    "w-20 rounded-md border px-2 py-1 text-sm text-heading",
                                    unsaved ? "border-accent" : "border-brand",
                                    readOnly && "bg-page cursor-not-allowed"
                                  )}
                                />
                                {unsaved && (
                                  <div className="h-2 w-2 rounded-full bg-accent" />
                                )}
                              </div>
                            </td>
                            <td className="py-3">
                              <input
                                type="text"
                                value={localRemarks[student.id] ?? ""}
                                onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                disabled={readOnly || saveAllMut.isPending}
                                placeholder="Optional"
                                className={cn(
                                  "w-32 rounded-md border px-2 py-1 text-sm text-heading",
                                  unsaved ? "border-accent" : "border-brand",
                                  readOnly && "bg-page cursor-not-allowed"
                                )}
                              />
                            </td>
                            <td className="py-3">
                              {grade?.score !== null && grade?.score !== undefined ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Saved
                                </span>
                              ) : (
                                <span className="text-xs text-muted-label">Not entered</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 border-t border-brand bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-subtext">
            {marksEntered} of {students.length} students have marks entered
          </span>
          <div className="flex gap-3">
            {!anySubmitted && (
              <Button
                variant="outline"
                disabled={saveAllMut.isPending}
                onClick={() => saveAllMut.mutate()}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {saveAllMut.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save All"
                )}
              </Button>
            )}
            {anySubmitted ? (
              <span className="inline-flex items-center rounded-md bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
                {allApproved ? "Approved" : "Submitted ✓"}
              </span>
            ) : (
              <Button
                disabled={!allMarksEntered || submitMut.isPending}
                onClick={() => setShowSubmitDialog(true)}
                className="bg-primary hover:bg-accent hover:text-accent-foreground"
                title={!allMarksEntered ? "Save marks for all students before submitting" : ""}
              >
                {submitMut.isPending ? "Submitting…" : "Submit to Admin"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="border-brand bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-heading">Submit marks to admin?</DialogTitle>
            <DialogDescription className="text-subtext">
              Submit {getSemesterDisplay(selectedSemester)} — {selectedSubject} marks to admin? You will not be able to edit after submission.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitMut.isPending}
              onClick={() => setShowSubmitDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={submitMut.isPending}
              onClick={handleSubmit}
            >
              {submitMut.isPending ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

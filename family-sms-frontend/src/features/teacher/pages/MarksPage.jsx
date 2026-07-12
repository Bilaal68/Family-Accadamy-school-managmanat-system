import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, Plus, X, Edit2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

import { fetchClassStudentsList } from "@/api/classes";
import { fetchGrades, fetchSubjects, createSubject, updateSubject, deleteSubject } from "@/api/grades";
import apiClient from "@/api/client";
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
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedAssessmentType, setSelectedAssessmentType] = useState("TEST");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [showEditSubjectDialog, setShowEditSubjectDialog] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
  const [editSubjectName, setEditSubjectName] = useState("");
  const [localScores, setLocalScores] = useState({});
  const [localRemarks, setLocalRemarks] = useState({});

  // Assessment type options
  const ASSESSMENT_TYPES = [
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

  // Fetch subjects from database
  const subjectsQ = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data } = await fetchSubjects();
      return Array.isArray(data) ? data : [];
    },
  });

  const subjects = subjectsQ.data ?? [];

  // Set initial selected subject when subjects load
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].name);
    }
  }, [subjects]);

  const studentsQ = useQuery({
    queryKey: ["teacher", "class", classId, "students"],
    queryFn: () => fetchClassStudentsList(classId),
    enabled: !!classId,
  });

  const gradesQ = useQuery({
    queryKey: ["teacher", "grades", classId, selectedSemester, selectedSubject, selectedAssessmentType],
    queryFn: async () => {
      const { data } = await fetchGrades({ 
        class: classId, 
        semester: selectedSemester, 
        subject: selectedSubject,
        assessment_type: selectedAssessmentType 
      });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!classId,
  });

  const students = studentsQ.data?.results ?? [];
  const grades = gradesQ.data ?? [];
  
  // Memoize gradeByStudent to prevent infinite re-renders
  const gradeByStudent = useMemo(() => {
    return grades.reduce((map, g) => {
      map[g.student_id] = g;
      return map;
    }, {});
  }, [grades]);

  // Initialize local state with existing grades
  useEffect(() => {
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
  }, [students, gradeByStudent]);

  const marksEntered = students.filter((s) => {
    const grade = gradeByStudent[s.id];
    return grade && grade.score !== null && grade.score !== undefined;
  }).length;

  const someMarksEntered = marksEntered > 0 && students.length > 0;

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
          student: student.id,
          subject: selectedSubject,
          semester: selectedSemester,
          assessment_type: selectedAssessmentType,
          score: parseFloat(score),
          remarks,
        };

        try {
          if (existing) {
            await apiClient.put(`/grades/${existing.id}/`, payload);
          } else {
            await apiClient.post("/grades/", payload);
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
      qc.invalidateQueries({ queryKey: ["teacher", "grades", classId, selectedSemester, selectedSubject, selectedAssessmentType] });
      qc.invalidateQueries({ queryKey: ["teacher", "averages", classId] });
    },
    onError: () => {
      toast.error("Could not save marks");
    },
  });

  const submitMut = useMutation({
    mutationFn: () => {
      return apiClient.post("/grades/submit/", {
        semester: selectedSemester,
        subject: selectedSubject,
        assessment_type: selectedAssessmentType,
      });
    },
    onSuccess: () => {
      toast.success("Marks submitted to admin for approval");
      qc.invalidateQueries({ queryKey: ["teacher", "grades", classId, selectedSemester, selectedSubject, selectedAssessmentType] });
      qc.invalidateQueries({ queryKey: ["teacher", "pending-submissions", classId] });
      setShowSubmitDialog(false);
    },
    onError: (e) => {
      const errorDetail = e.response?.data?.detail || "Could not submit marks.";
      const debugInfo = e.response?.data?.debug;
      
      console.error("Submit error:", {
        detail: errorDetail,
        debug: debugInfo,
        fullResponse: e.response?.data,
      });
      
      // Show error with debug info if available
      if (debugInfo) {
        toast.error(`${errorDetail}\n\nDebug: Found ${debugInfo.marks_found} total marks for this subject/semester/type`);
      } else {
        toast.error(errorDetail);
      }
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

  // Add Subject Mutation
  const addSubjectMut = useMutation({
    mutationFn: (name) => createSubject({ name }),
    onSuccess: (response) => {
      const newSubject = response.data;
      toast.success(`Subject "${newSubject.name}" added successfully`);
      qc.invalidateQueries({ queryKey: ["subjects"] });
      setNewSubjectName("");
      setShowAddSubjectDialog(false);
      // Auto-select the new subject if it's the first one
      if (subjects.length === 0) {
        setSelectedSubject(newSubject.name);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to add subject");
    },
  });

  const handleAddSubject = () => {
    const trimmed = newSubjectName.trim();
    if (!trimmed) {
      toast.error("Subject name cannot be empty");
      return;
    }
    addSubjectMut.mutate(trimmed);
  };

  // Delete Subject Mutation
  const deleteSubjectMut = useMutation({
    mutationFn: (subjectId) => deleteSubject(subjectId),
    onSuccess: (_, deletedSubjectId) => {
      const deletedSubject = subjects.find((s) => s.id === deletedSubjectId);
      toast.success(`Subject "${deletedSubject?.name}" removed`);
      qc.invalidateQueries({ queryKey: ["subjects"] });
      // Switch to first remaining subject if deleting the selected one
      if (selectedSubject === deletedSubject?.name) {
        const remaining = subjects.filter((s) => s.id !== deletedSubjectId);
        setSelectedSubject(remaining.length > 0 ? remaining[0].name : "");
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to remove subject");
    },
  });

  const handleRemoveSubject = (subject) => {
    deleteSubjectMut.mutate(subject.id);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setEditSubjectName(subject.name);
    setShowEditSubjectDialog(true);
  };

  // Update Subject Mutation
  const updateSubjectMut = useMutation({
    mutationFn: ({ id, name }) => updateSubject({ id, name }),
    onSuccess: (response) => {
      const updatedSubject = response.data;
      toast.success(`Subject renamed to "${updatedSubject.name}"`);
      qc.invalidateQueries({ queryKey: ["subjects"] });
      // Update selected subject if it was the one being edited
      if (selectedSubject === editingSubject.name) {
        setSelectedSubject(updatedSubject.name);
      }
      setShowEditSubjectDialog(false);
      setEditingSubject(null);
      setEditSubjectName("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to update subject");
    },
  });

  const handleSaveEditSubject = () => {
    const trimmed = editSubjectName.trim();
    if (!trimmed) {
      toast.error("Subject name cannot be empty");
      return;
    }
    updateSubjectMut.mutate({ id: editingSubject.id, name: trimmed });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-heading">{className}</h2>
        <p className="text-sm text-subtext">Marks entry</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Marks Entry</CardTitle>
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  disabled={readOnly}
                  className="rounded-md border border-brand bg-card px-3 py-2 text-sm text-heading"
                >
                  <option value="SEMESTER_1">Semester 1</option>
                  <option value="SEMESTER_2">Semester 2</option>
                </select>
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={readOnly || subjects.length === 0}
                    className="rounded-md border border-brand bg-card px-3 py-2 text-sm text-heading min-w-[150px]"
                  >
                    {subjects.length === 0 ? (
                      <option value="">No subjects yet</option>
                    ) : (
                      subjects.map((subject) => (
                        <option key={subject.id} value={subject.name}>
                          {subject.name}
                        </option>
                      ))
                    )}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddSubjectDialog(true)}
                    className="border-primary text-primary hover:bg-primary hover:text-white"
                    title="Add new subject"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <select
                  value={selectedAssessmentType}
                  onChange={(e) => setSelectedAssessmentType(e.target.value)}
                  disabled={readOnly}
                  className="rounded-md border border-brand bg-card px-3 py-2 text-sm text-heading min-w-[150px]"
                >
                  {ASSESSMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {subjects.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-sm text-subtext mb-2">No subjects created yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddSubjectDialog(true)}
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Subject
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-subtext">
                    {marksEntered} of {students.length} students have marks entered
                  </span>
                  <span className="text-xs text-muted-label">
                    {subjects.length} subject{subjects.length !== 1 ? "s" : ""} created
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <span
                      key={subject.id}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      {subject.name}
                      <button
                        onClick={() => handleEditSubject(subject)}
                        className="hover:text-accent transition-colors ml-1"
                        title="Edit subject"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveSubject(subject)}
                        className="hover:text-red-600 transition-colors"
                        title="Delete subject"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-label">
              Create a subject to start entering marks
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>

      {subjects.length > 0 && (
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
                  disabled={!someMarksEntered || submitMut.isPending}
                  onClick={() => setShowSubmitDialog(true)}
                  className="bg-primary hover:bg-accent hover:text-accent-foreground"
                  title={!someMarksEntered ? "Save marks for at least one student before submitting" : ""}
                >
                  {submitMut.isPending ? "Submitting…" : "Submit to Admin"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="border-brand bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-heading">Submit marks to admin?</DialogTitle>
            <DialogDescription className="text-subtext">
              Submit {getSemesterDisplay(selectedSemester)} — {selectedSubject} — {ASSESSMENT_TYPES.find(t => t.value === selectedAssessmentType)?.label} marks to admin? You will not be able to edit after submission.
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

      <Dialog open={showAddSubjectDialog} onOpenChange={setShowAddSubjectDialog}>
        <DialogContent className="border-brand bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-heading">Add New Subject</DialogTitle>
            <DialogDescription className="text-subtext">
              Create a new subject for marks entry. You can edit or delete it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-heading mb-2">
              Subject Name
            </label>
            <input
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddSubject();
                }
              }}
              placeholder="e.g., Mathematics, English, Science, Art"
              className="w-full rounded-md border border-brand bg-card px-3 py-2 text-sm text-heading focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddSubjectDialog(false);
                setNewSubjectName("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddSubject}
              className="bg-primary hover:bg-accent"
            >
              Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditSubjectDialog} onOpenChange={setShowEditSubjectDialog}>
        <DialogContent className="border-brand bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-heading">Edit Subject Name</DialogTitle>
            <DialogDescription className="text-subtext">
              Rename this subject. All existing marks will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-heading mb-2">
              Subject Name
            </label>
            <input
              type="text"
              value={editSubjectName}
              onChange={(e) => setEditSubjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveEditSubject();
                }
              }}
              className="w-full rounded-md border border-brand bg-card px-3 py-2 text-sm text-heading focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditSubjectDialog(false);
                setEditingSubject(null);
                setEditSubjectName("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEditSubject}
              className="bg-primary hover:bg-accent"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

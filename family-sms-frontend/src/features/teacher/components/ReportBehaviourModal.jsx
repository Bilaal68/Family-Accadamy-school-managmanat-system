import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

import { reportBehaviour } from "@/api/behaviour";
import { fetchClassStudentsList } from "@/api/classes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ReportBehaviourModal({ open, onClose, classId }) {
  const qc = useQueryClient();
  const [studentId, setStudentId] = useState("");
  const [content, setContent] = useState("");

  const studentsQ = useQuery({
    queryKey: ["teacher", "class", classId, "students"],
    queryFn: () => fetchClassStudentsList(classId),
    enabled: open && !!classId,
  });

  const students = studentsQ.data?.results ?? [];

  const reportMut = useMutation({
    mutationFn: (payload) => reportBehaviour(payload),
    onSuccess: () => {
      toast.success("Behaviour report saved");
      qc.invalidateQueries({ queryKey: ["teacher", "behaviour"] });
      setStudentId("");
      setContent("");
      onClose();
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not save report."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId || !content.trim()) {
      toast.error("Select a student and enter a description.");
      return;
    }
    reportMut.mutate({
      student_id: studentId,
      content: content.trim(),
      note_type: "BEHAVIOUR",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !reportMut.isPending && onClose()}>
      <DialogContent className="border-brand bg-card sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-heading">Report behaviour</DialogTitle>
            <DialogDescription className="text-subtext">
              Record a behaviour note for a student in your class. Parents and admins can
              view this on the student profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} ({s.student_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="behaviour-content">Description</Label>
              <Textarea
                id="behaviour-content"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the incident or observation…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={reportMut.isPending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={reportMut.isPending}>
              {reportMut.isPending ? "Saving…" : "Save report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

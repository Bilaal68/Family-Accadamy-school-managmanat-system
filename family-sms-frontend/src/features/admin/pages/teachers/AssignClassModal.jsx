import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { fetchClassesList } from "@/api/classes";
import { assignClass, removeClassAssignment } from "@/api/teachers";
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

export default function AssignClassModal({ open, onClose, teacher }) {
  const qc = useQueryClient();
  const [classId, setClassId] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { results } = await fetchClassesList();
      return results;
    },
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setClassId("");
      setConfirmRemove(false);
    }
  }, [open]);

  const availableClasses =
    classesQ.data?.filter((c) => {
      if (c.id === teacher?.assigned_class_id) return true;
      return !c.teacher_name;
    }) ?? [];

  const classHasTeacher = (id) => {
    const cls = classesQ.data?.find((c) => c.id === id);
    if (!cls?.teacher_name) return false;
    return cls.id !== teacher?.assigned_class_id;
  };

  const assignMut = useMutation({
    mutationFn: () => assignClass(teacher.id, classId),
    onSuccess: () => {
      toast.success("Class assigned");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Assignment failed.");
    },
  });

  const removeMut = useMutation({
    mutationFn: () => removeClassAssignment(teacher.id),
    onSuccess: () => {
      toast.success("Class assignment removed");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Could not remove assignment.");
    },
  });

  if (!teacher) return null;

  const handleAssign = (e) => {
    e.preventDefault();
    if (!classId) {
      toast.error("Select a class.");
      return;
    }
    if (classHasTeacher(classId)) {
      toast.error("This class already has a teacher assigned.");
      return;
    }
    assignMut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-[#E5E5E5] bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign class</DialogTitle>
          <DialogDescription>
            {teacher.assigned_class_name
              ? `Currently assigned to ${teacher.assigned_class_name}. Remove before assigning a different class.`
              : "Choose an unassigned class for this teacher."}
          </DialogDescription>
        </DialogHeader>

        {teacher.assigned_class_id && !confirmRemove ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Assigned class:{" "}
              <span className="font-medium text-black">
                {teacher.assigned_class_name}
              </span>
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              onClick={() => setConfirmRemove(true)}
            >
              Remove assignment
            </Button>
          </div>
        ) : confirmRemove ? (
          <div className="space-y-4">
            <p className="text-sm text-red-600">
              Remove {teacher.full_name} from {teacher.assigned_class_name}?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirmRemove(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={removeMut.isPending}
                onClick={() => removeMut.mutate()}
              >
                {removeMut.isPending ? "Removing…" : "Confirm remove"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.teacher_name && c.id !== teacher.assigned_class_id
                        ? ` (${c.teacher_name})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {classId && classHasTeacher(classId) && (
              <p className="text-sm text-amber-600">
                Warning: this class already has a teacher assigned.
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-black text-black"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assignMut.isPending || !classId}
              >
                {assignMut.isPending ? "Assigning…" : "Assign"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {(teacher.assigned_class_id && confirmRemove) || !teacher.assigned_class_id ? null : (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

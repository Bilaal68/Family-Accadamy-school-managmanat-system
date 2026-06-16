import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { createClass } from "@/api/classes";
import { fetchTeachersList } from "@/api/teachers";
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

const schema = z.object({
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  teacher_id: z.string().optional(),
});

export default function CreateClassModal({ open, onClose }) {
  const qc = useQueryClient();

  const teachersQ = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { results } = await fetchTeachersList();
      return results;
    },
    enabled: open,
  });

  const unassignedTeachers =
    teachersQ.data?.filter((t) => !t.assigned_class_id) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { grade: "", section: "", teacher_id: "" },
  });

  const teacherId = watch("teacher_id");

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values) => {
      const grade = values.grade.trim();
      const section = values.section.trim();
      const payload = {
        name: `${grade}${section}`,
        grade,
        section,
      };
      if (values.teacher_id) payload.teacher_id = values.teacher_id;
      return createClass(payload);
    },
    onSuccess: () => {
      toast.success("Class created");
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["teachers"] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Could not create class.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-[#E5E5E5] bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create class</DialogTitle>
          <DialogDescription>
            Grade and section are combined into the class name (e.g. Grade 3A).
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <Input id="grade" placeholder="Grade 3" {...register("grade")} />
            {errors.grade && (
              <p className="text-xs text-red-600">{errors.grade.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Input id="section" placeholder="A" {...register("section")} />
            {errors.section && (
              <p className="text-xs text-red-600">{errors.section.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Assign teacher (optional)</Label>
            <Select
              value={teacherId || "none"}
              onValueChange={(v) =>
                setValue("teacher_id", v === "none" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No teacher</SelectItem>
                {unassignedTeachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

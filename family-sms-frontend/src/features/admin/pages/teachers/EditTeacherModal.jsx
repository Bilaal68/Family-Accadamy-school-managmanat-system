import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { updateTeacher } from "@/api/teachers";
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

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  joined_at: z.string().min(1, "Joined date is required"),
  is_active: z.boolean(),
});

export default function EditTeacherModal({ open, onClose, teacher }) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      joined_at: "",
      is_active: true,
    },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (open && teacher) {
      reset({
        full_name: teacher.full_name,
        email: teacher.email,
        joined_at: teacher.joined_at,
        is_active: teacher.is_active ?? true,
      });
    }
  }, [open, teacher, reset]);

  const mutation = useMutation({
    mutationFn: (values) => updateTeacher(teacher.id, values),
    onSuccess: () => {
      toast.success("Teacher updated");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["teacher", teacher.id] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Update failed.");
    },
  });

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-[#E5E5E5] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit teacher</DialogTitle>
          <DialogDescription>{teacher.staff_id}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="edit_t_name">Full name</Label>
            <Input id="edit_t_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-red-600">{errors.full_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_t_email">Email</Label>
            <Input id="edit_t_email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_t_joined">Joined date</Label>
            <Input id="edit_t_joined" type="date" {...register("joined_at")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setValue("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Active account
          </label>
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
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { fetchClassesList } from "@/api/classes";
import { createTeacher } from "@/api/teachers";
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
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  class_id: z.string().optional(),
});

export default function RegisterTeacherModal({ open, onClose }) {
  const qc = useQueryClient();

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { results } = await fetchClassesList();
      return results;
    },
    enabled: open,
  });

  const unassignedClasses =
    classesQ.data?.filter((c) => !c.teacher_name) ?? [];

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
      password: "",
      class_id: "",
    },
  });

  const classId = watch("class_id");

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values) => {
      const payload = {
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      };
      if (values.class_id) payload.class_id = values.class_id;
      return createTeacher(payload);
    },
    onSuccess: () => {
      toast.success("Teacher registered");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      onClose();
    },
    onError: (err) => {
      const data = err.response?.data;
      toast.error(
        data?.detail ||
          data?.email?.[0] ||
          data?.class_id?.[0] ||
          "Registration failed."
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-[#E5E5E5] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register teacher</DialogTitle>
          <DialogDescription>Create a class teacher account.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="t_full_name">Full name</Label>
            <Input id="t_full_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-red-600">{errors.full_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="t_email">Email</Label>
            <Input id="t_email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="t_password">Password</Label>
            <Input id="t_password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Assign to class (optional)</Label>
            <Select
              value={classId || "none"}
              onValueChange={(v) =>
                setValue("class_id", v === "none" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {unassignedClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
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
              {mutation.isPending ? "Saving…" : "Register"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

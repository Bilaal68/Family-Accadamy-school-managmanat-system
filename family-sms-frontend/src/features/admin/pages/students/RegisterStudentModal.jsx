import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { fetchClassesList } from "@/api/classes";
import { createStudent } from "@/api/students";
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
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["M", "F", "OTHER"], { message: "Select gender" }),
  class_id: z.string().min(1, "Select a class"),
});

export default function RegisterStudentModal({ open, onClose }) {
  const qc = useQueryClient();
  const [preview, setPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { results } = await fetchClassesList();
      return results;
    },
    enabled: open,
  });

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
      date_of_birth: "",
      gender: "M",
      class_id: "",
    },
  });

  const gender = watch("gender");
  const classId = watch("class_id");

  useEffect(() => {
    if (!open) {
      reset();
      setPreview(null);
      setPhotoFile(null);
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values) =>
      createStudent({
        ...values,
        photo: photoFile,
      }),
    onSuccess: () => {
      toast.success("Student registered");
      qc.invalidateQueries({ queryKey: ["students"] });
      onClose();
    },
    onError: (err) => {
      const data = err.response?.data;
      const message =
        data?.detail ||
        data?.full_name?.[0] ||
        data?.class_id?.[0] ||
        "Registration failed.";
      toast.error(message);
    },
  });

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Photo must be an image file.");
      return;
    }
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#E5E5E5] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register student</DialogTitle>
          <DialogDescription>Add a new student to the school.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of birth</Label>
            <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
            {errors.date_of_birth && (
              <p className="text-xs text-red-600">{errors.date_of_birth.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={gender} onValueChange={(v) => setValue("gender", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-xs text-red-600">{errors.gender.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={(v) => setValue("class_id", v)}>
              <SelectTrigger>
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
            {errors.class_id && (
              <p className="text-xs text-red-600">{errors.class_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="h-24 w-24 rounded-full object-cover border border-[#E5E5E5]"
              />
            )}
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

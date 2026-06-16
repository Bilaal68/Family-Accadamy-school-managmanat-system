import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { fetchClassesList } from "@/api/classes";
import { updateStudent } from "@/api/students";
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
import { mediaUrl } from "@/lib/media";

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["M", "F", "OTHER"]),
  class_id: z.string().min(1, "Select a class"),
  is_active: z.boolean(),
});

export default function EditStudentModal({ open, onClose, student }) {
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
      is_active: true,
    },
  });

  const gender = watch("gender");
  const classId = watch("class_id");
  const isActive = watch("is_active");

  useEffect(() => {
    if (open && student) {
      reset({
        full_name: student.full_name,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        class_id: student.class_id,
        is_active: student.is_active,
      });
      setPreview(mediaUrl(student.photo));
      setPhotoFile(null);
    }
  }, [open, student, reset]);

  const mutation = useMutation({
    mutationFn: (values) =>
      updateStudent(student.id, {
        ...values,
        photo: photoFile,
      }),
    onSuccess: () => {
      toast.success("Student updated");
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student", student.id] });
      onClose();
    },
    onError: (err) => {
      const data = err.response?.data;
      toast.error(data?.detail || "Update failed.");
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

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#E5E5E5] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit student</DialogTitle>
          <DialogDescription>Update {student.student_id} details.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="edit_full_name">Full name</Label>
            <Input id="edit_full_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_dob">Date of birth</Label>
            <Input id="edit_dob" type="date" {...register("date_of_birth")} />
            {errors.date_of_birth && (
              <p className="text-xs text-red-600">{errors.date_of_birth.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={gender} onValueChange={(v) => setValue("gender", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={(v) => setValue("class_id", v)}>
              <SelectTrigger>
                <SelectValue />
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

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setValue("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Active student
          </label>

          <div className="space-y-2">
            <Label htmlFor="edit_photo">Photo</Label>
            <Input id="edit_photo" type="file" accept="image/*" onChange={onPhotoChange} />
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
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

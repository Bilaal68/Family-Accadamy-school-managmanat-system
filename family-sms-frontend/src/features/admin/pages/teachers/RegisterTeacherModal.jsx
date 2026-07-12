import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Upload, X } from "lucide-react";

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
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone_number: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  class_id: z.string().optional(),
});

export default function RegisterTeacherModal({ open, onClose }) {
  const qc = useQueryClient();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [qualificationDoc, setQualificationDoc] = useState(null);

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
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      password: "",
      class_id: "",
    },
  });

  const classId = watch("class_id");

  useEffect(() => {
    if (!open) {
      reset();
      setPhoto(null);
      setPhotoPreview(null);
      setQualificationDoc(null);
    }
  }, [open, reset]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQualificationChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setQualificationDoc(file);
    }
  };

  const mutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData();
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("email", values.email);
      formData.append("password", values.password);
      
      if (values.phone_number) {
        formData.append("phone_number", values.phone_number);
      }
      
      if (values.class_id) {
        formData.append("class_id", values.class_id);
      }
      
      if (photo) {
        formData.append("photo", photo);
      }
      
      if (qualificationDoc) {
        formData.append("qualification_document", qualificationDoc);
      }
      
      try {
        const response = await createTeacher(formData);
        return response;
      } catch (error) {
        console.error("Registration error:", error.response?.data);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Teacher registered successfully");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      onClose();
    },
    onError: (err) => {
      const data = err.response?.data;
      console.error("Full error response:", data);
      
      // Show specific field errors if available
      if (data && typeof data === 'object') {
        const errorMessages = [];
        
        if (data.first_name) errorMessages.push(`First name: ${data.first_name[0]}`);
        if (data.last_name) errorMessages.push(`Last name: ${data.last_name[0]}`);
        if (data.email) errorMessages.push(`Email: ${data.email[0]}`);
        if (data.phone_number) errorMessages.push(`Phone: ${data.phone_number[0]}`);
        if (data.password) errorMessages.push(`Password: ${data.password[0]}`);
        if (data.class_id) errorMessages.push(`Class: ${data.class_id[0]}`);
        if (data.photo) errorMessages.push(`Photo: ${data.photo[0]}`);
        if (data.qualification_document) errorMessages.push(`Document: ${data.qualification_document[0]}`);
        
        if (errorMessages.length > 0) {
          toast.error(errorMessages.join(", "));
          return;
        }
      }
      
      toast.error(
        data?.detail ||
          data?.error ||
          "Registration failed. Please check all fields."
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-[#E5E5E5] bg-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Teacher</DialogTitle>
          <DialogDescription>Create a new class teacher account with all required details.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Teacher Photo</Label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-full object-cover border-2 border-[#10026B]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a passport-size photo (JPG, PNG)
                </p>
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="t_first_name">First Name *</Label>
              <Input id="t_first_name" {...register("first_name")} />
              {errors.first_name && (
                <p className="text-xs text-red-600">{errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="t_last_name">Last Name *</Label>
              <Input id="t_last_name" {...register("last_name")} />
              {errors.last_name && (
                <p className="text-xs text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="t_email">Email *</Label>
              <Input id="t_email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="t_phone_number">Phone Number</Label>
              <Input 
                id="t_phone_number" 
                type="tel" 
                placeholder="09XXXXXXXX"
                {...register("phone_number")} 
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="t_password">Password *</Label>
            <Input id="t_password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-500">Minimum 8 characters</p>
          </div>

          {/* Qualification Document */}
          <div className="space-y-2">
            <Label>Qualification Document</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleQualificationChange}
              className="cursor-pointer"
            />
            {qualificationDoc && (
              <p className="text-sm text-green-600 flex items-center gap-2">
                ✓ {qualificationDoc.name}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Upload degree, certificate, or teaching credentials (PDF, DOC, or image)
            </p>
          </div>

          {/* Class Assignment */}
          <div className="space-y-2">
            <Label>Assign to Class (optional)</Label>
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
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-[#10026B] hover:bg-[#1a0a8a]"
            >
              {mutation.isPending ? "Registering…" : "Register Teacher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

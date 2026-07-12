import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { KeyRound, Save, User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { changePassword, fetchMe, updateProfile } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Validation schemas
const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch current user
  const userQ = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  // Profile form
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: userQ.data?.full_name || "",
      email: userQ.data?.email || "",
      phone: userQ.data?.phone || "",
    },
  });

  // Password form
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  // Update profile mutation
  const updateProfileMut = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      toast.success("Profile updated successfully");
      qc.setQueryData(["me"], data);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      const data = err.response?.data;
      if (data?.email) {
        toast.error(`Email: ${data.email[0]}`);
      } else if (data?.phone) {
        toast.error(`Phone: ${data.phone[0]}`);
      } else {
        toast.error(data?.detail || "Failed to update profile");
      }
    },
  });

  // Change password mutation
  const changePasswordMut = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully");
      passwordForm.reset();
    },
    onError: (err) => {
      const data = err.response?.data;
      if (data?.current_password) {
        toast.error(`Current password: ${data.current_password[0]}`);
      } else if (data?.new_password) {
        toast.error(`New password: ${data.new_password[0]}`);
      } else {
        toast.error(data?.detail || "Failed to change password");
      }
    },
  });

  const handleProfileSubmit = profileForm.handleSubmit((values) => {
    updateProfileMut.mutate(values);
  });

  const handlePasswordSubmit = passwordForm.handleSubmit((values) => {
    changePasswordMut.mutate(values);
  });

  if (userQ.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-b-2 ${
            activeTab === "profile"
              ? "border-[#10026B] text-[#10026B]"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <User className="h-4 w-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-b-2 ${
            activeTab === "password"
              ? "border-[#10026B] text-[#10026B]"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Password
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card className="border-[#E5E5E5]">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information. This will be visible across the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  {...profileForm.register("full_name")}
                />
                {profileForm.formState.errors.full_name && (
                  <p className="text-xs text-red-600">
                    {profileForm.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...profileForm.register("email")}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-xs text-red-600">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Used for login and notifications
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09XXXXXXXX"
                  {...profileForm.register("phone")}
                />
                {profileForm.formState.errors.phone && (
                  <p className="text-xs text-red-600">
                    {profileForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="border-t my-4" />

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Role</p>
                  <p className="text-sm text-gray-600">
                    {userQ.data?.role === "SUPER_ADMIN" && "Administrator"}
                    {userQ.data?.role === "CLASS_TEACHER" && "Teacher"}
                    {userQ.data?.role === "CASHIER" && "Cashier"}
                  </p>
                </div>
                <div className="text-sm text-gray-500">Cannot be changed</div>
              </div>

              {userQ.data?.assigned_class && (
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assigned Class</p>
                    <p className="text-sm text-gray-600">
                      {userQ.data.assigned_class.name}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => profileForm.reset()}
                  disabled={updateProfileMut.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMut.isPending}
                  className="bg-[#10026B] hover:bg-[#1a0a8a]"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateProfileMut.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <Card className="border-[#E5E5E5]">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password *</Label>
                <Input
                  id="current_password"
                  type="password"
                  {...passwordForm.register("current_password")}
                />
                {passwordForm.formState.errors.current_password && (
                  <p className="text-xs text-red-600">
                    {passwordForm.formState.errors.current_password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">New Password *</Label>
                <Input
                  id="new_password"
                  type="password"
                  {...passwordForm.register("new_password")}
                />
                {passwordForm.formState.errors.new_password && (
                  <p className="text-xs text-red-600">
                    {passwordForm.formState.errors.new_password.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password *</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  {...passwordForm.register("confirm_password")}
                />
                {passwordForm.formState.errors.confirm_password && (
                  <p className="text-xs text-red-600">
                    {passwordForm.formState.errors.confirm_password.message}
                  </p>
                )}
              </div>

              <div className="border-t my-4" />

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> After changing your password, you will need to log in again on all devices.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => passwordForm.reset()}
                  disabled={changePasswordMut.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMut.isPending}
                  className="bg-[#10026B] hover:bg-[#1a0a8a]"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {changePasswordMut.isPending ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

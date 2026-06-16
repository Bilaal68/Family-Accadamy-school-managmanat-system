import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const emailSchema = z.object({
  identifier: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

const phoneSchema = z.object({
  identifier: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

const ROLE_PORTAL = {
  SUPER_ADMIN: { label: "Admin", path: "/admin/login" },
  CLASS_TEACHER: { label: "Teacher", path: "/teacher/login" },
};

export default function LoginForm({
  title,
  subtitle,
  identifierLabel,
  identifierType = "email",
  expectedRole,
  onSuccess,
  alternatePortals = [],
}) {
  const { login, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const schema = identifierType === "phone" ? phoneSchema : emailSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const user = await login(values.identifier, values.password);
      if (user.role !== expectedRole) {
        await logout();
        const portal = ROLE_PORTAL[user.role];
        if (portal) {
          toast.error(
            `This is a ${portal.label} account. Open ${portal.path} to sign in.`
          );
        } else {
          toast.error("This account cannot sign in here.");
        }
        return;
      }
      toast.success(`Welcome, ${user.full_name}`);
      onSuccess(user);
    } catch (error) {
      const data = error.response?.data;
      let message = null;

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length) {
        const first = data.non_field_errors[0];
        message = typeof first === "string" ? first : String(first);
      } else if (data && typeof data === "object") {
        for (const key of Object.keys(data)) {
          const val = data[key];
          if (Array.isArray(val) && val.length) {
            const first = val[0];
            message = typeof first === "string" ? first : String(first);
            break;
          }
        }
      }

      if (!message) {
        if (error.code === "ERR_NETWORK" || !error.response) {
          message =
            "Cannot reach the API. Start the Django server on port 8000 and set VITE_API_URL in .env (then restart npm run dev).";
        } else if (error.response?.status === 404) {
          message =
            "Login URL not found. Check VITE_API_URL in .env matches http://localhost:8000/api/v1 and restart the dev server.";
        } else {
          message = "Invalid credentials. Please try again.";
        }
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F9F9] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Family Academy
          </p>
          <CardTitle className="mt-2">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">{identifierLabel}</Label>
              <Input
                id="identifier"
                type={identifierType === "phone" ? "tel" : "email"}
                autoComplete={identifierType === "phone" ? "tel" : "email"}
                {...register("identifier")}
              />
              {errors.identifier && (
                <p className="text-sm text-destructive">{errors.identifier.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          {alternatePortals.length > 0 && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {alternatePortals.map((item, i) => (
                <span key={item.path}>
                  {i > 0 && " · "}
                  <Link to={item.path} className="font-medium text-primary hover:underline">
                    {item.label}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

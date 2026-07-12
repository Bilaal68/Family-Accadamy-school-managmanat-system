import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { BookOpen, GraduationCap, Users, School, Sparkles, Star } from "lucide-react";

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

// Floating Animation Component
function FloatingIcon({ icon: Icon, delay = 0, duration = 3, top, left, size = 24 }) {
  return (
    <div
      className="absolute animate-float opacity-20"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      <Icon size={size} className="text-[#10026B]" />
    </div>
  );
}

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
    <div className="flex min-h-screen overflow-hidden">
      {/* Left Side - Illustration & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#10026B] via-[#1a0494] to-[#10026B] relative overflow-hidden">
        {/* Animated Background Elements */}
        <FloatingIcon icon={BookOpen} delay={0} top={10} left={15} size={32} />
        <FloatingIcon icon={GraduationCap} delay={0.5} top={20} left={80} size={28} />
        <FloatingIcon icon={Users} delay={1} top={70} left={10} size={24} />
        <FloatingIcon icon={School} delay={1.5} top={60} left={85} size={36} />
        <FloatingIcon icon={Sparkles} delay={2} top={35} left={25} size={20} />
        <FloatingIcon icon={Star} delay={2.5} top={80} left={70} size={22} />
        <FloatingIcon icon={BookOpen} delay={3} top={45} left={90} size={26} />
        <FloatingIcon icon={GraduationCap} delay={3.5} top={15} left={50} size={30} />

        {/* Decorative Circles */}
        <div className="absolute w-96 h-96 bg-[#C2B30C] opacity-10 rounded-full -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-white opacity-5 rounded-full bottom-0 right-0 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {/* Logo/Icon */}
          <div className="mb-8 relative">
            <div className="w-24 h-24 bg-[#C2B30C] rounded-2xl flex items-center justify-center transform rotate-6 hover:rotate-12 transition-transform duration-300">
              <School size={48} className="text-[#10026B]" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
          </div>

          {/* School Name */}
          <h1 className="text-5xl font-bold mb-4 text-center animate-fade-in">
            Family Academy
          </h1>
          <p className="text-xl text-[#C2B30C] mb-8 font-semibold animate-fade-in" style={{ animationDelay: '0.2s' }}>
            School Management System
          </p>

          {/* Illustration */}
          <div className="mt-8 space-y-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {/* Student Illustrations */}
            <div className="flex items-center justify-center space-x-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0s' }}>
                <Users size={32} className="text-white" />
              </div>
              <div className="w-20 h-20 bg-[#C2B30C]/30 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                <GraduationCap size={40} className="text-white" />
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.4s' }}>
                <BookOpen size={32} className="text-white" />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center space-x-2 opacity-90">
                <div className="w-2 h-2 bg-[#C2B30C] rounded-full"></div>
                <p className="text-sm">Manage Students & Teachers</p>
              </div>
              <div className="flex items-center justify-center space-x-2 opacity-90">
                <div className="w-2 h-2 bg-[#C2B30C] rounded-full"></div>
                <p className="text-sm">Track Attendance & Grades</p>
              </div>
              <div className="flex items-center justify-center space-x-2 opacity-90">
                <div className="w-2 h-2 bg-[#C2B30C] rounded-full"></div>
                <p className="text-sm">Process Enrollments & Payments</p>
              </div>
            </div>
          </div>

          {/* Bottom Decoration */}
          <div className="mt-auto pt-12">
            <p className="text-sm opacity-70">
              © {new Date().getFullYear()} Family Academy. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8 relative overflow-hidden">
        {/* Mobile Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute w-full h-full" style={{
            backgroundImage: `radial-gradient(circle, #10026B 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        {/* Mobile Logo (shows only on small screens) */}
        <div className="lg:hidden absolute top-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-[#10026B] rounded-lg flex items-center justify-center">
              <School size={24} className="text-[#C2B30C]" />
            </div>
            <span className="text-xl font-bold text-[#10026B]">Family Academy</span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-md shadow-2xl border-0 animate-slide-up relative z-10">
          <CardHeader className="text-center pb-4">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#10026B] to-[#1a0494] rounded-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-lg">
                <GraduationCap size={32} className="text-[#C2B30C]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#10026B]">{title}</CardTitle>
            <CardDescription className="text-base">{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-gray-700 font-medium">
                  {identifierLabel}
                </Label>
                <Input
                  id="identifier"
                  type={identifierType === "phone" ? "tel" : "email"}
                  autoComplete={identifierType === "phone" ? "tel" : "email"}
                  className="h-12 border-gray-300 focus:border-[#10026B] focus:ring-[#10026B] transition-all"
                  placeholder={`Enter your ${identifierLabel.toLowerCase()}`}
                  {...register("identifier")}
                />
                {errors.identifier && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.identifier.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-12 border-gray-300 focus:border-[#10026B] focus:ring-[#10026B] transition-all"
                  placeholder="Enter your password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-[#10026B] to-[#1a0494] hover:from-[#1a0494] hover:to-[#10026B] text-white font-semibold text-base transition-all duration-300 transform hover:scale-105 shadow-lg" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <span className="text-lg">→</span>
                  </span>
                )}
              </Button>
            </form>
            
            {alternatePortals.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600 mb-3">
                  Looking for a different portal?
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {alternatePortals.map((item) => (
                    <Link 
                      key={item.path}
                      to={item.path} 
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#10026B] bg-[#10026B]/5 hover:bg-[#10026B]/10 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      {item.label}
                      <span className="ml-2">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#C2B30C] opacity-10 rounded-tl-full"></div>
        <div className="absolute top-0 left-0 w-24 h-24 bg-[#10026B] opacity-10 rounded-br-full"></div>
      </div>

      {/* Global Styles for Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

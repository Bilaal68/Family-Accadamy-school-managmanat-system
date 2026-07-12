import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Search, CheckCircle, Clock, XCircle, Eye } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { getEnrollmentStatus } from "@/api/enrollment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PublicLayout from "@/components/PublicLayout";

const STATUS_CONFIG = {
  PENDING: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: Clock,
    iconColor: "text-amber-400",
    title: "Application Under Review",
    message:
      "Your application is being reviewed by our team. We will contact you soon.",
  },
  REVIEWED: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: Eye,
    iconColor: "text-blue-400",
    title: "Application Verified",
    message:
      "Your application has been verified and is awaiting final approval.",
  },
  APPROVED: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: CheckCircle,
    iconColor: "text-green-400",
    title: "Application Approved!",
    message:
      "Congratulations! Your application has been approved. Please visit the school to complete registration.",
  },
  REJECTED: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: XCircle,
    iconColor: "text-red-400",
    title: "Application Not Approved",
    message: "Unfortunately your application was not approved.",
  },
};

export default function ApplicationStatus() {
  const location = useLocation();
  const [admissionNumber, setAdmissionNumber] = useState(
    location.state?.admissionNumber || ""
  );
  const [result, setResult] = useState(null);

  const statusMut = useMutation({
    mutationFn: async (number) => {
      const { data } = await getEnrollmentStatus(number.trim());
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: () => {
      setResult(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!admissionNumber.trim()) return;
    statusMut.mutate(admissionNumber);
  };

  const config = result ? STATUS_CONFIG[result.status] : null;
  const StatusIcon = config?.icon;

  return (
    <PublicLayout>
      {/* Branded Header */}
      <div className="bg-[#10026B] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <img
              src="/logo.PNG"
              alt="Family Academy"
              className="w-9 h-9 object-contain"
            />
            <div>
              <p className="text-white font-bold text-sm leading-tight">Family Academy</p>
              <p className="text-[#C2B30C] text-xs leading-tight">Akkadaamii Faamilii</p>
            </div>
          </Link>
          <Link to="/" className="text-white/70 hover:text-white text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Dark Background */}
      <div className="min-h-screen bg-[#0a0220]">
        <div className="mx-auto max-w-md px-6 py-16">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#C2B30C]/20 border border-[#C2B30C]/30 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-[#C2B30C]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check Application Status</h1>
            <p className="text-white/60 text-sm">
              Enter your admission number to see your application status.
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admission_number" className="text-white font-medium">Admission Number</Label>
                <Input
                  id="admission_number"
                  className="mt-2 font-mono w-full bg-white/5 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2B30C] focus:border-transparent transition-all"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ADM-00001"
                />
              </div>
              <Button
                type="submit"
                disabled={statusMut.isPending || !admissionNumber.trim()}
                className="w-full bg-[#C2B30C] text-[#10026B] font-semibold px-8 py-3 rounded-xl hover:bg-[#d4c40e] transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Search className="mr-2 h-4 w-4" />
                {statusMut.isPending ? "Checking..." : "Check Status"}
              </Button>
            </form>

            {statusMut.isError && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 text-center">
                No application found with that admission number. Please check the number
                and try again.
              </div>
            )}

            {result && config && (
              <div
                className={`mt-6 rounded-xl border p-6 text-center ${config.bg} ${config.border}`}
              >
                {/* Status Icon */}
                <div className="flex justify-center mb-4">
                  <StatusIcon className={`w-10 h-10 ${config.iconColor}`} />
                </div>

                <p className="font-bold text-lg text-white mb-2">{config.title}</p>
                <p className="text-sm text-white/70 mb-4">{config.message}</p>

                <div className="mt-4 space-y-2 text-sm text-left bg-white/5 rounded-lg p-4 border border-white/10">
                  <p>
                    <span className="font-medium text-white">Admission Number:</span>{" "}
                    <span className="font-mono text-white/80">{result.admission_number}</span>
                  </p>
                  {result.full_name && (
                    <p>
                      <span className="font-medium text-white">Student:</span>{" "}
                      <span className="text-white/80">{result.full_name}</span>
                    </p>
                  )}
                  {result.status === "APPROVED" && result.student_id && (
                    <p className="mt-3 rounded-lg bg-green-500/20 border border-green-500/40 px-3 py-2 font-mono text-base font-bold text-green-300 text-center">
                      Student ID: {result.student_id}
                    </p>
                  )}
                  {result.status === "REJECTED" && result.rejection_reason && (
                    <p className="mt-3 text-red-300">
                      <span className="font-medium">Reason:</span>{" "}
                      {result.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

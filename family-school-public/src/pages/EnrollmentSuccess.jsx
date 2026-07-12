import { CheckCircle } from "lucide-react";
import { Link, useLocation, Navigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/PublicLayout";

export default function EnrollmentSuccess() {
  const location = useLocation();
  const admissionNumber = location.state?.admissionNumber;

  if (!admissionNumber) {
    return <Navigate to="/enroll" replace />;
  }

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
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          {/* Success Icon with Animation */}
          <div
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 border border-green-500/30"
            style={{ animation: 'scaleIn 0.6s ease-out' }}
          >
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            Application Submitted Successfully!
          </h1>
          <p className="text-white/60 mb-8">
            Save this number — you will need it to check your application status.
          </p>

          {/* Admission Number Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
            <p className="text-white/70 text-sm mb-1">Admission Number</p>
            <p className="text-3xl font-bold text-[#C2B30C] tracking-wider">
              {admissionNumber}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              to="/enroll/status"
              state={{ admissionNumber }}
              className="bg-[#C2B30C] text-[#10026B] font-semibold py-3 rounded-xl hover:bg-[#d4c40e] transition-all text-center hover:-translate-y-0.5 hover:shadow-xl"
            >
              Check Status
            </Link>
            <Link
              to="/enroll"
              className="border-2 border-white/20 text-white font-semibold py-3 rounded-xl hover:border-white/40 hover:bg-white/5 transition-all text-center"
            >
              Apply for Another Child
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

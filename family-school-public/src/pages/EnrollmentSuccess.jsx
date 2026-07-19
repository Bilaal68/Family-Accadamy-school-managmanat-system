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
      <div className="bg-[#10026B] py-3 sm:py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-base sm:text-lg">
            <img
              src="/logo.PNG"
              alt="Family Academy"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
            />
            <div>
              <p className="text-white font-bold text-xs sm:text-sm leading-tight">Family Academy</p>
              <p className="text-[#C2B30C] text-xs leading-tight">Akkadaamii Faamilii</p>
            </div>
          </Link>
          <Link to="/" className="text-white/70 hover:text-white text-xs sm:text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Dark Background */}
      <div className="min-h-screen bg-[#0a0220]">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          {/* Success Icon with Animation */}
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-green-500/30"
            style={{ animation: 'scaleIn 0.6s ease-out' }}
          >
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
            Application Submitted Successfully!
          </h1>
          <p className="text-white/60 text-sm mb-6 sm:mb-8">
            Save this number — you will need it to check your application status.
          </p>

          {/* Admission Number Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-2xl">
            <p className="text-white/70 text-xs sm:text-sm mb-1">Admission Number</p>
            <p className="text-2xl sm:text-3xl font-bold text-[#C2B30C] tracking-wider break-all">
              {admissionNumber}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <Link
              to="/enroll/status"
              state={{ admissionNumber }}
              className="w-full bg-[#C2B30C] text-[#10026B] font-semibold py-2.5 sm:py-3 rounded-xl hover:bg-[#d4c40e] transition-all text-center hover:-translate-y-0.5 hover:shadow-xl text-sm sm:text-base min-h-11"
            >
              Check Status
            </Link>
            <Link
              to="/enroll"
              className="w-full border-2 border-white/20 text-white font-semibold py-2.5 sm:py-3 rounded-xl hover:border-white/40 hover:bg-white/5 transition-all text-center text-sm sm:text-base min-h-11"
            >
              Apply for Another Child
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

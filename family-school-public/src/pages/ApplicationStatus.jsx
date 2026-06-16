import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Search } from "lucide-react";
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
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "Application Under Review",
    message:
      "Your application is being reviewed by our team. We will contact you soon.",
  },
  REVIEWED: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    title: "Application Verified",
    message:
      "Your application has been verified and is awaiting final approval.",
  },
  APPROVED: {
    bg: "bg-green-50",
    border: "border-green-200",
    title: "Application Approved!",
    message:
      "Congratulations! Your application has been approved. Please visit the school to complete registration.",
  },
  REJECTED: {
    bg: "bg-red-50",
    border: "border-red-200",
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

  return (
    <PublicLayout>
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-[#6b63a3] hover:text-[#10026B]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-[#10026B] sm:text-3xl">
          Check Application Status
        </h1>
        <p className="mt-2 text-[#6b63a3]">
          Enter the admission number you received when you submitted your application.
        </p>

        <Card className="mt-8 border-[#E8E6FF]">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admission_number">Admission Number</Label>
                <Input
                  id="admission_number"
                  className="mt-1 font-mono"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ADM-00001"
                />
              </div>
              <Button
                type="submit"
                disabled={statusMut.isPending || !admissionNumber.trim()}
                className="w-full bg-[#10026B] hover:bg-[#1a0a8a]"
              >
                <Search className="mr-2 h-4 w-4" />
                {statusMut.isPending ? "Checking..." : "Check Status"}
              </Button>
            </form>

            {statusMut.isError && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                No application found with that admission number. Please check the number
                and try again.
              </div>
            )}

            {result && config && (
              <div
                className={`mt-6 rounded-lg border p-5 ${config.bg} ${config.border}`}
              >
                <p className="font-semibold text-[#10026B]">{config.title}</p>
                <p className="mt-2 text-sm text-[#6b63a3]">{config.message}</p>

                <div className="mt-4 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Admission Number:</span>{" "}
                    <span className="font-mono">{result.admission_number}</span>
                  </p>
                  {result.full_name && (
                    <p>
                      <span className="font-medium">Student:</span> {result.full_name}
                    </p>
                  )}
                  {result.status === "APPROVED" && result.student_id && (
                    <p className="mt-3 rounded-md bg-white/60 px-3 py-2 font-mono text-lg font-bold text-green-800">
                      Student ID: {result.student_id}
                    </p>
                  )}
                  {result.status === "REJECTED" && result.rejection_reason && (
                    <p className="mt-3 text-red-700">
                      <span className="font-medium">Reason:</span>{" "}
                      {result.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

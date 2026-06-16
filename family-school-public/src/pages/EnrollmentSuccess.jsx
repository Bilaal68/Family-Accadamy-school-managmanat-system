import { CheckCircle } from "lucide-react";
import { Link, useLocation, Navigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "@/components/PublicLayout";

export default function EnrollmentSuccess() {
  const location = useLocation();
  const admissionNumber = location.state?.admissionNumber;

  if (!admissionNumber) {
    return <Navigate to="/enroll" replace />;
  }

  return (
    <PublicLayout>
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg border-[#E8E6FF] text-center">
          <CardContent className="pt-10 pb-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-[#10026B] sm:text-3xl">
              Application Submitted Successfully!
            </h1>

            <p className="mt-6 text-sm text-[#6b63a3]">Your Admission Number</p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-wider text-[#10026B] sm:text-4xl">
              {admissionNumber}
            </p>

            <p className="mx-auto mt-6 max-w-sm text-sm text-[#6b63a3]">
              Save this number — you will need it to check your application status.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="bg-[#10026B] hover:bg-[#1a0a8a]"
              >
                <Link to="/enroll/status" state={{ admissionNumber }}>
                  Check Status
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
              >
                <Link to="/enroll">Apply for Another Child</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

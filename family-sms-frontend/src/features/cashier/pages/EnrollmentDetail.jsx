import { useMutation, useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getEnrollmentDetail, reviewEnrollment } from "@/api/enrollment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import EnrollmentUploadedFiles from "@/components/shared/EnrollmentUploadedFiles";
import SectionError from "@/components/shared/SectionError";
import { ListSkeleton } from "@/components/shared/SectionSkeleton";

const GENDER_LABELS = { M: "Male", F: "Female", OTHER: "Other" };

export default function EnrollmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cashierNotes, setCashierNotes] = useState("");
  const [registrationFeePaid, setRegistrationFeePaid] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const enrollmentQ = useQuery({
    queryKey: ["enrollment", id],
    queryFn: async () => {
      const { data } = await getEnrollmentDetail(id);
      return data;
    },
  });

  const reviewMut = useMutation({
    mutationFn: (payload) => reviewEnrollment(id, payload),
    onSuccess: () => {
      toast.success("Sent to admin for approval");
      navigate("/cashier/enrollments");
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Failed to submit review");
    },
  });

  if (enrollmentQ.isLoading) {
    return <ListSkeleton items={4} />;
  }

  if (enrollmentQ.isError) {
    return (
      <SectionError
        message="Could not load enrollment details."
        onRetry={() => enrollmentQ.refetch()}
      />
    );
  }

  const enrollment = enrollmentQ.data;

  if (!enrollment) {
    return <div>Enrollment not found</div>;
  }

  const handleSubmit = () => {
    if (!cashierNotes.trim()) {
      toast.error("Cashier notes are required");
      return;
    }
    if (!paymentStatus) {
      toast.error("Payment status is required");
      return;
    }

    reviewMut.mutate({
      cashier_notes: cashierNotes,
      payment_status: paymentStatus,
      registration_fee_paid: registrationFeePaid || 0,
    });
  };

  const getStatusBanner = () => {
    if (enrollment.status === "PENDING") {
      return (
        <div className="mb-4 rounded-lg bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Awaiting your review</p>
        </div>
      );
    }
    if (enrollment.status === "REVIEWED") {
      return (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 text-blue-800">
          <p className="font-medium">
            Submitted to admin — awaiting approval
          </p>
        </div>
      );
    }
    if (enrollment.status === "APPROVED") {
      return (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
          <p className="font-medium">
            Approved — Student created in system
          </p>
          {enrollment.student && (
            <Link
              to={`/admin/students/${enrollment.student}`}
              className="text-sm underline"
            >
              View student profile
            </Link>
          )}
        </div>
      );
    }
    if (enrollment.status === "REJECTED") {
      return (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-medium">Rejected</p>
          <p className="text-sm">{enrollment.rejection_reason}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Link
        to="/cashier/enrollments"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to enrollments
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">
          {enrollment.full_name || `${enrollment.first_name} ${enrollment.middle_name} ${enrollment.last_name}`.trim()}
        </h1>
        <Badge className={enrollment.is_transfer ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
          {enrollment.student_type || (enrollment.is_transfer ? "Transfer Student" : "New Student")}
        </Badge>
        <Badge variant="outline">{enrollment.admission_number}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Student Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollment.photo_url && (
                <img
                  src={enrollment.photo_url}
                  alt="Student photo"
                  className="h-32 w-32 rounded-full border object-cover"
                />
              )}
              <div>
                <Label>Full Name</Label>
                <p className="font-medium">
                  {enrollment.full_name ||
                    `${enrollment.first_name} ${enrollment.middle_name} ${enrollment.last_name}`.trim()}
                </p>
              </div>
              <div>
                <Label>Admission Number</Label>
                <p className="font-mono text-sm">{enrollment.admission_number}</p>
              </div>
              <div>
                <Label>Gender</Label>
                <p>{GENDER_LABELS[enrollment.gender] || enrollment.gender}</p>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <p>
                  {enrollment.date_of_birth
                    ? format(parseISO(enrollment.date_of_birth), "MMM d, yyyy")
                    : ""}
                </p>
              </div>
              <div>
                <Label>Nationality</Label>
                <p>{enrollment.nationality}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Academic Year</Label>
                <p>{enrollment.academic_year}</p>
              </div>
              <div>
                <Label>Grade Applying For</Label>
                <p>{enrollment.grade_applying}</p>
              </div>
              <div>
                <Label>Student Type</Label>
                <Badge className={enrollment.is_transfer ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                  {enrollment.student_type || (enrollment.is_transfer ? "Transfer Student" : "New Student")}
                </Badge>
              </div>
              {enrollment.is_transfer && (
                <div>
                  <Label>Previous School</Label>
                  <p>{enrollment.previous_school || "—"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parent/Guardian Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Father
                </Label>
                <p className="font-medium">{enrollment.father_name || "—"}</p>
                <p className="text-sm text-gray-600">
                  {enrollment.father_phone || ""}
                </p>
                <p className="text-sm text-gray-600">
                  {enrollment.father_occupation || ""}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Mother
                </Label>
                <p className="font-medium">{enrollment.mother_name || "—"}</p>
                <p className="text-sm text-gray-600">
                  {enrollment.mother_phone || ""}
                </p>
                <p className="text-sm text-gray-600">
                  {enrollment.mother_occupation || ""}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Guardian
                </Label>
                <p className="font-medium">{enrollment.guardian_name || "—"}</p>
                <p className="text-sm text-gray-600">
                  {enrollment.guardian_relationship || ""}
                </p>
                <p className="text-sm text-gray-600">
                  {enrollment.guardian_phone || ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Country</Label>
                <p>{enrollment.country}</p>
              </div>
              <div>
                <Label>Region</Label>
                <p>{enrollment.region || "—"}</p>
              </div>
              <div>
                <Label>City</Label>
                <p>{enrollment.city || "—"}</p>
              </div>
              <div>
                <Label>Sub-city</Label>
                <p>{enrollment.sub_city || "—"}</p>
              </div>
              <div>
                <Label>Full Address</Label>
                <p className="whitespace-pre-line">{enrollment.full_address || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <p>{enrollment.emergency_contact_name || "—"}</p>
              </div>
              <div>
                <Label>Relationship</Label>
                <p>{enrollment.emergency_contact_relationship || "—"}</p>
              </div>
              <div>
                <Label>Phone</Label>
                <p>{enrollment.emergency_contact_phone || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <EnrollmentUploadedFiles enrollment={enrollment} />
        </div>

        {/* Right Column - Cashier Review Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cashier Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {getStatusBanner()}

              {enrollment.status === "PENDING" && (
                <>
                  <div className="space-y-4">
                    <h3 className="font-medium">Payment Information</h3>
                    <div>
                      <Label>Registration Fee Paid</Label>
                      <Input
                        type="number"
                        value={registrationFeePaid}
                        onChange={(e) => setRegistrationFeePaid(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Payment Status</Label>
                      <Select
                        value={paymentStatus}
                        onValueChange={setPaymentStatus}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNPAID">Unpaid</SelectItem>
                          <SelectItem value="PARTIAL">Partial</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Cashier Notes *</Label>
                    <Textarea
                      value={cashierNotes}
                      onChange={(e) => setCashierNotes(e.target.value)}
                      placeholder="Add notes about this enrollment..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={reviewMut.isPending || !cashierNotes.trim() || !paymentStatus}
                      className="flex-1 bg-[#10026B] hover:bg-[#1a0a8a]"
                    >
                      Submit to Admin
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                    >
                      Flag Issue
                    </Button>
                  </div>
                </>
              )}

              {enrollment.status === "REVIEWED" && enrollment.cashier_notes && (
                <div>
                  <Label>Your Notes</Label>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {enrollment.cashier_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

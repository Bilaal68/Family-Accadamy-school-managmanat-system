import { useMutation, useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CheckCircle, Download, X, XCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import { approveEnrollment, getEnrollmentDetail, rejectEnrollment } from "@/api/enrollment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EnrollmentUploadedFiles from "@/components/shared/EnrollmentUploadedFiles";
import SectionError from "@/components/shared/SectionError";
import { ListSkeleton } from "@/components/shared/SectionSkeleton";

const GENDER_LABELS = { M: "Male", F: "Female", OTHER: "Other" };

function statusColor(status) {
  if (status === "PENDING") return "bg-amber-100 text-amber-800";
  if (status === "REVIEWED") return "bg-blue-100 text-blue-800";
  if (status === "APPROVED") return "bg-green-100 text-green-800";
  if (status === "REJECTED") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

function paymentStatusColor(status) {
  if (status === "PAID") return "bg-green-100 text-green-800";
  if (status === "PARTIAL") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function EnrollmentDetailModal({ enrollmentId, open, onClose, onSuccess }) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);

  const enrollmentQ = useQuery({
    queryKey: ["enrollment", enrollmentId],
    queryFn: async () => {
      const { data } = await getEnrollmentDetail(enrollmentId);
      return data;
    },
    enabled: open && !!enrollmentId,
  });

  const approveMut = useMutation({
    mutationFn: () => approveEnrollment(enrollmentId),
    onSuccess: (data) => {
      toast.success(
        `${enrollmentQ.data?.first_name} ${enrollmentQ.data?.last_name} approved — Student ID: ${data.student_student_id || data.student_id}`,
        {
          duration: 5000,
        }
      );
      setApproveConfirmOpen(false);
      onClose();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Approval failed");
    },
  });

  const rejectMut = useMutation({
    mutationFn: () =>
      rejectEnrollment(enrollmentId, { rejection_reason: rejectReason }),
    onSuccess: () => {
      toast.success("Enrollment rejected");
      setRejectModalOpen(false);
      setRejectReason("");
      onClose();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Rejection failed");
    },
  });

  const handleApprove = () => {
    approveMut.mutate();
  };

  const handleReject = () => {
    if (!rejectReason.trim() || rejectReason.length < 20) {
      toast.error("Rejection reason must be at least 20 characters");
      return;
    }
    rejectMut.mutate();
  };

  if (enrollmentQ.isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <VisuallyHidden.Root>
            <DialogTitle>Loading Enrollment Details</DialogTitle>
          </VisuallyHidden.Root>
          <ListSkeleton items={8} />
        </DialogContent>
      </Dialog>
    );
  }

  if (enrollmentQ.isError) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl" aria-describedby={undefined}>
          <VisuallyHidden.Root>
            <DialogTitle>Error Loading Enrollment</DialogTitle>
          </VisuallyHidden.Root>
          <SectionError
            message="Could not load enrollment details"
            onRetry={() => enrollmentQ.refetch()}
          />
        </DialogContent>
      </Dialog>
    );
  }

  const enrollment = enrollmentQ.data;
  if (!enrollment) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-[#10026B]">
                  {enrollment.admission_number}
                </DialogTitle>
                <div className="mt-2 flex items-center gap-3">
                  <Badge className={statusColor(enrollment.status)}>
                    {enrollment.status}
                  </Badge>
                  <Badge className={enrollment.is_transfer ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                    {enrollment.student_type || (enrollment.is_transfer ? "Transfer Student" : "New Student")}
                  </Badge>
                  {enrollment.created_at && (
                    <span className="text-sm text-gray-600">
                      Submitted {format(parseISO(enrollment.created_at), "MMM d, yyyy")}
                    </span>
                  )}
                  {enrollment.reviewed_by_name && (
                    <span className="text-sm text-gray-600">
                      Reviewed by {enrollment.reviewed_by_name}
                    </span>
                  )}
                </div>
              </div>
              {enrollment.status === "REVIEWED" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                    onClick={() => setRejectModalOpen(true)}
                  >
                    Reject
                  </Button>
                  <Button
                    className="bg-[#10026B] text-[#C2B30C] hover:bg-[#1a0a8a]"
                    onClick={() => setApproveConfirmOpen(true)}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Card 1: Student Photo & Basic Details */}
            <Card>
              <CardHeader>
                <CardTitle>Student Photo & Basic Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  {enrollment.photo_url && (
                    <img
                      src={enrollment.photo_url}
                      alt="Student photo"
                      className="h-32 w-32 rounded-full object-cover"
                    />
                  )}
                  <div className="grid gap-3 sm:grid-cols-2 flex-1">
                    <div>
                      <Label>Full Name</Label>
                      <p className="font-medium">
                        {enrollment.first_name} {enrollment.middle_name} {enrollment.last_name}
                      </p>
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Academic Year</Label>
                  <p>{enrollment.academic_year}</p>
                </div>
                <div>
                  <Label>Grade Applying For</Label>
                  <p>{enrollment.grade_applying}</p>
                </div>
                <div className="sm:col-span-2">
                  <Label>Student Type</Label>
                  <Badge className={enrollment.is_transfer ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                    {enrollment.student_type || (enrollment.is_transfer ? "Transfer Student" : "New Student")}
                  </Badge>
                </div>
                {enrollment.is_transfer && (
                  <div className="sm:col-span-2">
                    <Label>Previous School</Label>
                    <p>{enrollment.previous_school || "—"}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 3: Parent & Guardian Information */}
            <Card>
              <CardHeader>
                <CardTitle>Parent & Guardian Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Father</h4>
                  <div>
                    <Label className="text-xs">Name</Label>
                    <p className="text-sm">{enrollment.father_name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <p className="text-sm">{enrollment.father_phone || ""}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Occupation</Label>
                    <p className="text-sm">{enrollment.father_occupation || ""}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Mother</h4>
                  <div>
                    <Label className="text-xs">Name</Label>
                    <p className="text-sm">{enrollment.mother_name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <p className="text-sm">{enrollment.mother_phone || ""}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Occupation</Label>
                    <p className="text-sm">{enrollment.mother_occupation || ""}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Guardian</h4>
                  <div>
                    <Label className="text-xs">Name</Label>
                    <p className="text-sm">{enrollment.guardian_name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Relationship</Label>
                    <p className="text-sm">{enrollment.guardian_relationship || ""}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <p className="text-sm">{enrollment.guardian_phone || ""}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Address & Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Address & Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Address</h4>
                  <div>
                    <Label className="text-xs">Country</Label>
                    <p className="text-sm">{enrollment.country}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Region</Label>
                    <p className="text-sm">{enrollment.region || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs">City</Label>
                    <p className="text-sm">{enrollment.city || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Sub-city</Label>
                    <p className="text-sm">{enrollment.sub_city || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Full Address</Label>
                    <p className="text-sm whitespace-pre-line">{enrollment.full_address || "—"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Emergency Contact</h4>
                  <div>
                    <Label className="text-xs">Name</Label>
                    <p className="text-sm">{enrollment.emergency_contact_name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Relationship</Label>
                    <p className="text-sm">{enrollment.emergency_contact_relationship || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <p className="text-sm">{enrollment.emergency_contact_phone || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Registration Fee Paid</Label>
                  <p className="font-medium">
                    {enrollment.registration_fee_paid ? `ETB ${enrollment.registration_fee_paid}` : "ETB 0"}
                  </p>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <Badge className={paymentStatusColor(enrollment.payment_status)}>
                    {enrollment.payment_status}
                  </Badge>
                </div>
                {enrollment.fee_receipt_url && (
                  <div className="sm:col-span-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(enrollment.fee_receipt_url, "_blank")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      View Receipt
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 6: Cashier Review Notes */}
            {enrollment.cashier_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Cashier Review Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-l-4 border-[#C2B30C] bg-amber-50 p-4">
                    {enrollment.reviewed_by_name && (
                      <p className="text-sm font-medium text-gray-700">
                        {enrollment.reviewed_by_name}
                        {enrollment.reviewed_at && (
                          <span className="ml-2 text-gray-500">
                            {format(parseISO(enrollment.reviewed_at), "MMM d, yyyy")}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                      {enrollment.cashier_notes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <EnrollmentUploadedFiles enrollment={enrollment} />

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between border-t pt-4">
              <Button variant="ghost" onClick={onClose}>
                ← Back to Approvals
              </Button>
              {enrollment.status === "REVIEWED" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                    onClick={() => setRejectModalOpen(true)}
                  >
                    Reject
                  </Button>
                  <Button
                    className="bg-[#10026B] hover:bg-[#1a0a8a]"
                    onClick={() => setApproveConfirmOpen(true)}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Enrollment</DialogTitle>
            <DialogDescription>
              Confirm approval and create student account
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Approve enrollment for {enrollment.first_name} {enrollment.last_name}?
            </p>
            <p className="mt-2 text-sm text-gray-600">
              A student account will be created automatically.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setApproveConfirmOpen(false)}
              disabled={approveMut.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#10026B] hover:bg-[#1a0a8a]"
              onClick={handleApprove}
              disabled={approveMut.isPending}
            >
              {approveMut.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Enrollment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this enrollment request
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason (minimum 20 characters)..."
                rows={4}
              />
              <p className="mt-1 text-xs text-gray-500">
                {rejectReason.length}/20 characters minimum
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectReason("");
              }}
              disabled={rejectMut.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMut.isPending || rejectReason.length < 20}
            >
              {rejectMut.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

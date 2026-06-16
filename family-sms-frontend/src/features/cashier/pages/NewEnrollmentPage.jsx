import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle, GraduationCap, Printer, School } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { applyEnrollment } from "@/api/enrollment";
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

const ACADEMIC_YEARS = ["2025/2026", "2026/2027", "2027/2028"];

const STEPS = [
  "Application Type",
  "Student Information",
  "Parent & Guardian",
  "Documents",
  "Fee & Review",
];

const GRADES = Array.from({ length: 8 }, (_, i) => `Grade ${i + 1}`);

const NEW_STUDENT_DOCS = [
  { key: "birth_certificate", label: "Birth Certificate", required: true },
];

const TRANSFER_STUDENT_DOCS = [
  { key: "birth_certificate", label: "Birth Certificate", required: true },
  { key: "transcript", label: "Previous School Report Card", required: true },
  { key: "transfer_letter", label: "Transfer Letter", required: true },
];

const INITIAL_FORM = {
  first_name: "",
  middle_name: "",
  last_name: "",
  gender: "",
  date_of_birth: "",
  place_of_birth: "",
  nationality: "Ethiopian",
  photo: null,
  academic_year: ACADEMIC_YEARS[0],
  grade_applying: "",
  section_preference: "",
  previous_school: "",
  is_transfer: false,
  father_name: "",
  father_phone: "",
  father_occupation: "",
  father_photo: null,
  mother_name: "",
  mother_phone: "",
  mother_occupation: "",
  mother_photo: null,
  guardian_name: "",
  guardian_relationship: "",
  guardian_phone: "",
  country: "Ethiopia",
  region: "",
  city: "",
  sub_city: "",
  full_address: "",
  emergency_contact_name: "",
  emergency_contact_relationship: "",
  emergency_contact_phone: "",
  documents: {},
  registration_fee_paid: "",
  tuition_plan: "",
  scholarship_discount: "",
  payment_status: "",
  fee_receipt: null,
  cashier_notes: "",
};

export default function NewEnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [typeChosen, setTypeChosen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const documentFields = formData.is_transfer ? TRANSFER_STUDENT_DOCS : NEW_STUDENT_DOCS;
  const studentTypeLabel = formData.is_transfer ? "Transfer Student" : "New Student";

  const submitMut = useMutation({
    mutationFn: (payload) => applyEnrollment(payload),
    onSuccess: (data) => {
      setAdmissionNumber(data.admission_number);
      setSubmitted(true);
      toast.success("Application submitted successfully");
    },
    onError: (err) => {
      const errors = err.response?.data;
      if (errors && typeof errors === "object") {
        const firstError = Object.values(errors).flat()[0];
        toast.error(firstError || "Please review the form and try again.");
      } else {
        toast.error(err.response?.data?.detail || "Failed to submit application");
      }
    },
  });

  const selectApplicationType = (isTransfer) => {
    setFormData((prev) => ({ ...prev, is_transfer: isTransfer }));
    setTypeChosen(true);
    setCurrentStep(1);
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        if (!typeChosen) {
          toast.error("Please select New Student or Transfer Student");
          return false;
        }
        return true;
      case 1:
        if (
          !formData.first_name.trim() ||
          !formData.middle_name.trim() ||
          !formData.last_name.trim() ||
          !formData.gender ||
          !formData.date_of_birth ||
          !formData.grade_applying ||
          !formData.photo
        ) {
          toast.error("Please fill in all required student fields including photo and grade");
          return false;
        }
        if (formData.is_transfer && !formData.previous_school.trim()) {
          toast.error("Previous school is required for transfer students");
          return false;
        }
        return true;
      case 2:
        if (
          !formData.father_name.trim() ||
          !formData.father_phone.trim() ||
          !formData.father_occupation.trim() ||
          !formData.mother_name.trim() ||
          !formData.mother_phone.trim() ||
          !formData.mother_occupation.trim() ||
          !formData.father_photo ||
          !formData.mother_photo ||
          !formData.city.trim() ||
          !formData.full_address.trim() ||
          !formData.emergency_contact_name.trim() ||
          !formData.emergency_contact_phone.trim()
        ) {
          toast.error("Parent details, photos, address, and emergency contact are required");
          return false;
        }
        return true;
      case 3:
        for (const doc of documentFields) {
          if (doc.required && !formData.documents[doc.key]) {
            toast.error(`${doc.label} is required`);
            return false;
          }
        }
        return true;
      case 4:
        if (!formData.payment_status) {
          toast.error("Please select payment status");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(4)) return;

    const payload = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "documents") {
        Object.entries(formData.documents).forEach(([docType, file]) => {
          if (file) payload.append(`documents.${docType}`, file);
        });
      } else if (key === "is_transfer") {
        payload.append(key, formData[key] ? "true" : "false");
      } else if (formData[key] !== null && formData[key] !== "") {
        payload.append(key, formData[key]);
      }
    });
    if (!formData.academic_year) {
      payload.append("academic_year", ACADEMIC_YEARS[0]);
    }

    submitMut.mutate(payload);
  };

  const handleFileChange = (docType, file) => {
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, [docType]: file },
    }));
  };

  const resetForm = () => {
    setSubmitted(false);
    setAdmissionNumber("");
    setCurrentStep(0);
    setTypeChosen(false);
    setFormData(INITIAL_FORM);
  };

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Application Submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Badge className={formData.is_transfer ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
              {studentTypeLabel}
            </Badge>
            <p className="text-gray-600">
              Admission Number: <span className="font-mono font-bold">{admissionNumber}</span>
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button className="flex-1 bg-[#10026B] hover:bg-[#1a0a8a]" onClick={resetForm}>
                Register Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/cashier/enrollments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">New Enrollment</h1>
          <p className="text-gray-600">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
          </p>
          {typeChosen && currentStep > 0 && (
            <Badge className="mt-2 bg-[#10026B] text-white">{studentTypeLabel}</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step} className="flex flex-1 items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                index <= currentStep ? "bg-[#10026B] text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {index + 1}
            </div>
            <div
              className={`mx-2 h-1 flex-1 ${index < currentStep ? "bg-[#10026B]" : "bg-gray-200"}`}
            />
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Application Type</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => selectApplicationType(false)}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 p-6 transition hover:border-[#10026B] hover:shadow-md"
                >
                  <GraduationCap className="h-10 w-10 text-[#10026B]" />
                  <h4 className="font-semibold">New Student</h4>
                  <p className="text-center text-sm text-gray-600">
                    First-time enrollment. Requires student photo and birth certificate.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => selectApplicationType(true)}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 p-6 transition hover:border-[#C2B30C] hover:shadow-md"
                >
                  <School className="h-10 w-10 text-[#10026B]" />
                  <h4 className="font-semibold">Transfer Student</h4>
                  <p className="text-center text-sm text-gray-600">
                    Transferring from another school. Requires report card and transfer letter.
                  </p>
                </button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Student Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>First Name *</Label>
                  <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                </div>
                <div>
                  <Label>Middle Name *</Label>
                  <Input value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                </div>
                <div>
                  <Label>Gender *</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date of Birth *</Label>
                  <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                </div>
                <div>
                  <Label>Grade Applying For *</Label>
                  <Select value={formData.grade_applying} onValueChange={(v) => setFormData({ ...formData, grade_applying: v })}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.is_transfer && (
                  <div className="md:col-span-2">
                    <Label>Previous School *</Label>
                    <Input value={formData.previous_school} onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })} />
                  </div>
                )}
                <div className="md:col-span-2">
                  <Label>Student Photo *</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Parent & Guardian Information</h3>
              {["father", "mother"].map((key) => (
                <div key={key} className="space-y-4 rounded-lg border p-4">
                  <h4 className="font-medium capitalize text-gray-700">{key}</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Full Name *</Label>
                      <Input value={formData[`${key}_name`]} onChange={(e) => setFormData({ ...formData, [`${key}_name`]: e.target.value })} />
                    </div>
                    <div>
                      <Label>Phone *</Label>
                      <Input value={formData[`${key}_phone`]} onChange={(e) => setFormData({ ...formData, [`${key}_phone`]: e.target.value })} />
                    </div>
                    <div>
                      <Label>Occupation *</Label>
                      <Input value={formData[`${key}_occupation`]} onChange={(e) => setFormData({ ...formData, [`${key}_occupation`]: e.target.value })} />
                    </div>
                    <div>
                      <Label>{key === "father" ? "Father" : "Mother"} Photo *</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, [`${key}_photo`]: e.target.files[0] })} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="space-y-4 rounded-lg border border-dashed p-4">
                <h4 className="font-medium text-gray-500">Guardian (optional)</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={formData.guardian_name} onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Input value={formData.guardian_relationship} onChange={(e) => setFormData({ ...formData, guardian_relationship: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.guardian_phone} onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium text-gray-700">Address</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><Label>Country</Label><Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} /></div>
                  <div><Label>Region</Label><Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} /></div>
                  <div><Label>City *</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
                  <div><Label>Sub-city</Label><Input value={formData.sub_city} onChange={(e) => setFormData({ ...formData, sub_city: e.target.value })} /></div>
                  <div className="md:col-span-2">
                    <Label>Full Address *</Label>
                    <Textarea value={formData.full_address} onChange={(e) => setFormData({ ...formData, full_address: e.target.value })} rows={3} />
                  </div>
                </div>
              </div>
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium text-gray-700">Emergency Contact</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div><Label>Name *</Label><Input value={formData.emergency_contact_name} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} /></div>
                  <div><Label>Relationship</Label><Input value={formData.emergency_contact_relationship} onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })} /></div>
                  <div><Label>Phone *</Label><Input value={formData.emergency_contact_phone} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} /></div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Documents</h3>
              <p className="text-sm text-gray-600">
                {formData.is_transfer
                  ? "Required: Birth Certificate, Previous School Report Card, Transfer Letter. Student photo uploaded in step 1."
                  : "Required: Birth Certificate. Student photo uploaded in step 1."}
              </p>
              {formData.photo && (
                <p className="text-sm text-green-700">Student photo: {formData.photo.name}</p>
              )}
              {documentFields.map((doc) => (
                <div key={doc.key}>
                  <Label>{doc.label}{doc.required ? " *" : ""}</Label>
                  <div className="flex items-center gap-2">
                    <Input type="file" onChange={(e) => handleFileChange(doc.key, e.target.files[0])} />
                    {formData.documents[doc.key] && (
                      <span className="text-sm text-gray-600">{formData.documents[doc.key].name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Fee Information & Review</h3>
              <div className="space-y-4">
                <div><Label>Registration Fee Paid</Label><Input type="number" value={formData.registration_fee_paid} onChange={(e) => setFormData({ ...formData, registration_fee_paid: e.target.value })} placeholder="0.00" /></div>
                <div><Label>Tuition Plan</Label><Input value={formData.tuition_plan} onChange={(e) => setFormData({ ...formData, tuition_plan: e.target.value })} placeholder="e.g., Annual, Semester" /></div>
                <div><Label>Scholarship/Discount (%)</Label><Input type="number" value={formData.scholarship_discount} onChange={(e) => setFormData({ ...formData, scholarship_discount: e.target.value })} placeholder="0" /></div>
                <div>
                  <Label>Payment Status *</Label>
                  <Select value={formData.payment_status} onValueChange={(v) => setFormData({ ...formData, payment_status: v })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Fee Receipt</Label><Input type="file" onChange={(e) => setFormData({ ...formData, fee_receipt: e.target.files[0] })} /></div>
                <div><Label>Cashier Notes</Label><Textarea value={formData.cashier_notes} onChange={(e) => setFormData({ ...formData, cashier_notes: e.target.value })} rows={3} placeholder="Add notes about this enrollment..." /></div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-4 text-sm">
                <h4 className="mb-3 font-medium">Application Summary</h4>
                <div className="space-y-1">
                  <p><strong>Type:</strong> {studentTypeLabel}</p>
                  <p><strong>Name:</strong> {formData.first_name} {formData.middle_name} {formData.last_name}</p>
                  <p><strong>Grade:</strong> {formData.grade_applying}</p>
                  <p><strong>Academic Year:</strong> {formData.academic_year}</p>
                  <p><strong>Father:</strong> {formData.father_name} ({formData.father_phone})</p>
                  <p><strong>Mother:</strong> {formData.mother_name} ({formData.mother_phone})</p>
                  <p><strong>Address:</strong> {formData.full_address}, {formData.city}</p>
                  <p><strong>Payment Status:</strong> {formData.payment_status || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {currentStep > 0 && (
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitMut.isPending} className="bg-[#10026B] hover:bg-[#1a0a8a]">
                  {submitMut.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

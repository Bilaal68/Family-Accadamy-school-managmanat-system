import { useMutation } from "@tanstack/react-query";

import { ArrowLeft, ArrowRight, Building2, CheckCircle, Copy, GraduationCap, Info, School, Upload } from "lucide-react";

import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";



import { applyEnrollment } from "@/api/enrollment";

import FileUploadField from "@/components/enrollment/FileUploadField";

import { FormField, TextAreaField, TextField } from "@/components/enrollment/FormField";

import FormSection from "@/components/enrollment/FormSection";

import StepIndicator from "@/components/enrollment/StepIndicator";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import PublicLayout from "@/components/PublicLayout";

import {

  ACADEMIC_YEARS,

  ENROLLMENT_STEPS,

  GRADES,

  NEW_STUDENT_DOCUMENTS,

  TRANSFER_STUDENT_DOCUMENTS,

} from "@/lib/constants";



const INITIAL_FORM = {

  first_name: "",

  middle_name: "",

  last_name: "",

  gender: "",

  date_of_birth: "",

  nationality: "Ethiopian",

  photo: null,

  academic_year: ACADEMIC_YEARS[0],

  grade_applying: "",

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

};



function ReviewRow({ label, value }) {

  if (!value) return null;

  return (

    <div className="flex flex-col gap-0.5 border-b border-[#E8E6FF]/80 py-3 last:border-0 sm:flex-row sm:gap-4">

      <dt className="w-full shrink-0 text-xs font-semibold uppercase tracking-wide text-[#6b63a3] sm:w-36">

        {label}

      </dt>

      <dd className="text-sm text-[#10026B]">{value}</dd>

    </div>

  );

}



export default function EnrollmentForm() {

  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState(INITIAL_FORM);

  const [typeChosen, setTypeChosen] = useState(false);

  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const [paymentReceiptError, setPaymentReceiptError] = useState("");



  const submitMut = useMutation({

    mutationFn: async (payload) => {

      const { data } = await applyEnrollment(payload);

      return data;

    },

    onSuccess: (data) => {

      toast.success("Application submitted successfully.");

      navigate("/enroll/success", { state: { admissionNumber: data.admission_number } });

    },

    onError: (err) => {

      const errors = err.response?.data;

      if (errors && typeof errors === "object") {

        const firstError = Object.values(errors).flat()[0];

        toast.error(firstError || "Please review the form and try again.");

      } else {

        toast.error(

          err.response?.data?.detail || "Unable to submit application. Please try again."

        );

      }

    },

  });



  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));



  const documentFields = formData.is_transfer

    ? TRANSFER_STUDENT_DOCUMENTS

    : NEW_STUDENT_DOCUMENTS;



  const selectApplicationType = (isTransfer) => {

    update("is_transfer", isTransfer);

    setTypeChosen(true);

    setCurrentStep(1);

    window.scrollTo({ top: 0, behavior: "smooth" });

  };



  const validateStep = (step) => {

    switch (step) {

      case 0:

        if (!typeChosen) {

          toast.error("Please select New Student or Transfer Student to continue.");

          return false;

        }

        return true;

      case 1:

        if (!formData.first_name.trim()) {

          toast.error("Student first name is required.");

          return false;

        }

        if (!formData.middle_name.trim()) {

          toast.error("Student middle name is required.");

          return false;

        }

        if (!formData.last_name.trim()) {

          toast.error("Student last name is required.");

          return false;

        }

        if (!formData.gender) {

          toast.error("Please select the student's gender.");

          return false;

        }

        if (!formData.date_of_birth) {

          toast.error("Date of birth is required.");

          return false;

        }

        if (!formData.grade_applying) {

          toast.error("Please select a grade (Grades 1–8 only).");

          return false;

        }

        if (!formData.photo) {

          toast.error("Student photo is required.");

          return false;

        }

        if (formData.is_transfer && !formData.previous_school.trim()) {

          toast.error("Previous school is required for transfer students.");

          return false;

        }

        return true;

      case 2:

        if (!formData.father_name.trim()) {

          toast.error("Father name is required.");

          return false;

        }

        if (!formData.father_phone.trim()) {

          toast.error("Father phone number is required.");

          return false;

        }

        if (!formData.father_occupation.trim()) {

          toast.error("Father occupation is required.");

          return false;

        }

        if (!formData.mother_name.trim()) {

          toast.error("Mother name is required.");

          return false;

        }

        if (!formData.mother_phone.trim()) {

          toast.error("Mother phone number is required.");

          return false;

        }

        if (!formData.mother_occupation.trim()) {

          toast.error("Mother occupation is required.");

          return false;

        }

        if (!formData.father_photo) {

          toast.error("Father photo is required.");

          return false;

        }

        if (!formData.mother_photo) {

          toast.error("Mother photo is required.");

          return false;

        }

        if (!formData.city.trim() || !formData.full_address.trim()) {

          toast.error("City and full address are required.");

          return false;

        }

        if (!formData.emergency_contact_name.trim() || !formData.emergency_contact_phone.trim()) {

          toast.error("Emergency contact name and phone are required.");

          return false;

        }

        return true;

      case 3: {

        for (const doc of documentFields) {

          if (doc.required && !formData.documents[doc.key]) {

            toast.error(`${doc.label} is required.`);

            return false;

          }

        }

        return true;

      }

      case 4: {

        if (!paymentReceipt) {

          setPaymentReceiptError("Please upload your payment receipt before continuing.");

          toast.error("Payment receipt is required.");

          return false;

        }

        if (paymentReceipt.size > 5 * 1024 * 1024) {

          setPaymentReceiptError("File size must be under 5MB.");

          toast.error("File size must be under 5MB.");

          return false;

        }

        setPaymentReceiptError("");

        return true;

      }

      default:

        return true;

    }

  };



  const handleNext = () => {

    if (!validateStep(currentStep)) return;

    if (currentStep < ENROLLMENT_STEPS.length - 1) {

      setCurrentStep(currentStep + 1);

      window.scrollTo({ top: 0, behavior: "smooth" });

    }

  };



  const handleBack = () => {

    if (currentStep > 0) {

      setCurrentStep(currentStep - 1);

      window.scrollTo({ top: 0, behavior: "smooth" });

    }

  };



  const handleSubmit = () => {

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

    if (paymentReceipt) {

      payload.append("fee_receipt", paymentReceipt);

    }

    submitMut.mutate(payload);

  };



  const genderLabel =

    formData.gender === "M" ? "Male" : formData.gender === "F" ? "Female" : formData.gender;



  const studentTypeLabel = formData.is_transfer ? "Transfer Student" : "New Student";



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



      {/* Gradient Background */}

      <div className="min-h-screen bg-gradient-to-b from-[#F4F3FF] to-white">

        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">

          {/* Page Header */}

          <div className="text-center mb-6 sm:mb-8">

            <h1 className="text-2xl sm:text-3xl font-bold text-[#10026B] mb-2">Apply to Family Academy</h1>

            <p className="text-gray-500 text-sm sm:text-base">Fill in your child's details below to begin the enrollment process.</p>

            {typeChosen && currentStep > 0 && (

              <span className="inline-flex mt-3 rounded-full bg-[#C2B30C]/10 border border-[#C2B30C]/30 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-[#10026B]">

                {studentTypeLabel}

              </span>

            )}

          </div>



          {/* Main Form Card */}

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-10">

            {/* Step Indicator */}

            <div className="mb-6 sm:mb-8">

              <StepIndicator currentStep={currentStep} />

              <p className="mt-4 text-center text-xs sm:text-sm font-medium text-[#10026B]">

                {/* Mobile: "Step X of 6", Desktop: Full title */}
                <span className="sm:hidden">Step {currentStep + 1} of {ENROLLMENT_STEPS.length}</span>
                <span className="hidden sm:inline">{ENROLLMENT_STEPS[currentStep].title}</span>

              </p>

            </div>



        <div className="space-y-6">

          {currentStep === 0 && (

            <FormSection

              title="Select Application Type"

              description="Choose whether the student is enrolling for the first time or transferring from another school."

            >

              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">

                <button

                  type="button"

                  onClick={() => selectApplicationType(false)}

                  className="flex flex-col items-center gap-2 sm:gap-3 rounded-xl border-2 border-[#E8E6FF] bg-[#fafaff] p-4 sm:p-6 text-left transition hover:border-[#10026B] hover:shadow-md min-h-40 sm:min-h-44"

                >

                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#10026B]/10">

                    <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-[#10026B]" />

                  </div>

                  <div className="text-center">

                    <h3 className="font-semibold text-[#10026B] text-sm sm:text-base">New Student</h3>

                    <p className="mt-1 text-xs sm:text-sm text-[#6b63a3]">

                      First-time enrollment. Requires student photo and birth certificate.

                    </p>

                  </div>

                </button>

                <button

                  type="button"

                  onClick={() => selectApplicationType(true)}

                  className="flex flex-col items-center gap-2 sm:gap-3 rounded-xl border-2 border-[#E8E6FF] bg-[#fafaff] p-4 sm:p-6 text-left transition hover:border-[#C2B30C] hover:shadow-md min-h-40 sm:min-h-44"

                >

                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#C2B30C]/20">

                    <School className="h-6 w-6 sm:h-7 sm:w-7 text-[#10026B]" />

                  </div>

                  <div className="text-center">

                    <h3 className="font-semibold text-[#10026B] text-sm sm:text-base">Transfer Student</h3>

                    <p className="mt-1 text-xs sm:text-sm text-[#6b63a3]">

                      Transferring from another school. Requires report card and transfer letter.

                    </p>

                  </div>

                </button>

              </div>

            </FormSection>

          )}



          {currentStep === 1 && (

            <FormSection

              title="Student Information"

              description="Enter the student's legal name, personal details, and grade applying for."

            >

              <div className="grid gap-5 sm:grid-cols-2">

                <TextField

                  label="First Name"

                  required

                  value={formData.first_name}

                  onChange={(e) => update("first_name", e.target.value)}

                  placeholder="First name"

                />

                <TextField

                  label="Middle Name"

                  required

                  value={formData.middle_name}

                  onChange={(e) => update("middle_name", e.target.value)}

                />

                <TextField

                  label="Last Name"

                  required

                  value={formData.last_name}

                  onChange={(e) => update("last_name", e.target.value)}

                  placeholder="Last name"

                />

                <FormField label="Gender" required>

                  <Select value={formData.gender} onValueChange={(v) => update("gender", v)}>

                    <SelectTrigger>

                      <SelectValue placeholder="Select gender" />

                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="M">Male</SelectItem>

                      <SelectItem value="F">Female</SelectItem>

                      <SelectItem value="OTHER">Other</SelectItem>

                    </SelectContent>

                  </Select>

                </FormField>

                <TextField

                  label="Date of Birth"

                  required

                  hint="As recorded on the birth certificate"

                  type="date"

                  value={formData.date_of_birth}

                  onChange={(e) => update("date_of_birth", e.target.value)}

                />

                <FormField label="Grade Applying For" required>

                  <Select

                    value={formData.grade_applying}

                    onValueChange={(v) => update("grade_applying", v)}

                  >

                    <SelectTrigger>

                      <SelectValue placeholder="Select grade" />

                    </SelectTrigger>

                    <SelectContent>

                      {GRADES.map((g) => (

                        <SelectItem key={g} value={g}>

                          {g}

                        </SelectItem>

                      ))}

                    </SelectContent>

                  </Select>

                </FormField>

                {formData.is_transfer && (

                  <TextField

                    label="Previous School"

                    required

                    value={formData.previous_school}

                    onChange={(e) => update("previous_school", e.target.value)}

                    placeholder="Name of previous school"

                    className="sm:col-span-2"

                  />

                )}

                <FormField

                  label="Student Photo"

                  required

                  hint="Recent passport-size photo, JPG or PNG"

                  className="sm:col-span-2"

                >

                  <Input

                    type="file"

                    accept="image/*"

                    className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-[#f4f3ff] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#10026B]"

                    onChange={(e) => update("photo", e.target.files?.[0] || null)}

                  />

                </FormField>

              </div>

            </FormSection>

          )}



          {currentStep === 2 && (

            <FormSection

              title="Parent & Guardian Information"

              description="Provide parent/guardian details, home address, and emergency contact. Parent photos are required."

            >

              <div className="space-y-5">

                {[

                  {

                    key: "father",

                    title: "Father",

                    photoKey: "father_photo",

                    photoLabel: "Father Photo",

                  },

                  {

                    key: "mother",

                    title: "Mother",

                    photoKey: "mother_photo",

                    photoLabel: "Mother Photo",

                  },

                ].map(({ key, title, photoKey, photoLabel }) => (

                  <div

                    key={key}

                    className="rounded-lg border border-[#E8E6FF] bg-[#fafaff] p-4 sm:p-5"

                  >

                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#10026B]">

                      {title}

                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">

                      <TextField

                        label="Full Name"

                        required

                        value={formData[`${key}_name`]}

                        onChange={(e) => update(`${key}_name`, e.target.value)}

                      />

                      <TextField

                        label="Phone Number"

                        required

                        type="tel"

                        value={formData[`${key}_phone`]}

                        onChange={(e) => update(`${key}_phone`, e.target.value)}

                        placeholder="09XXXXXXXX"

                      />

                      <TextField

                        label="Occupation"

                        required

                        className="sm:col-span-2"

                        value={formData[`${key}_occupation`]}

                        onChange={(e) => update(`${key}_occupation`, e.target.value)}

                      />

                      <FormField label={photoLabel} required className="sm:col-span-2">

                        <Input

                          type="file"

                          accept="image/*"

                          className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-[#f4f3ff] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#10026B]"

                          onChange={(e) => update(photoKey, e.target.files?.[0] || null)}

                        />

                      </FormField>

                    </div>

                  </div>

                ))}

                <div className="rounded-lg border border-dashed border-[#E8E6FF] bg-white p-4 sm:p-5">

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#6b63a3]">

                    Guardian (if applicable — optional)

                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <TextField

                      label="Full Name"

                      value={formData.guardian_name}

                      onChange={(e) => update("guardian_name", e.target.value)}

                    />

                    <TextField

                      label="Phone Number"

                      type="tel"

                      value={formData.guardian_phone}

                      onChange={(e) => update("guardian_phone", e.target.value)}

                      placeholder="09XXXXXXXX"

                    />

                    <TextField

                      label="Relationship to Student"

                      className="sm:col-span-2"

                      value={formData.guardian_relationship}

                      onChange={(e) => update("guardian_relationship", e.target.value)}

                      placeholder="e.g. Uncle, Aunt, Grandparent"

                    />

                  </div>

                </div>

                <div className="rounded-lg border border-[#E8E6FF] bg-[#fafaff] p-4 sm:p-5">

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#10026B]">

                    Address

                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <TextField

                      label="Country"

                      value={formData.country}

                      onChange={(e) => update("country", e.target.value)}

                    />

                    <TextField

                      label="Region"

                      value={formData.region}

                      onChange={(e) => update("region", e.target.value)}

                      placeholder="e.g. Addis Ababa"

                    />

                    <TextField

                      label="City"

                      required

                      value={formData.city}

                      onChange={(e) => update("city", e.target.value)}

                    />

                    <TextField

                      label="Sub-city / Woreda"

                      value={formData.sub_city}

                      onChange={(e) => update("sub_city", e.target.value)}

                    />

                    <TextAreaField

                      label="Full Address"

                      required

                      hint="House number, street name, and nearby landmarks"

                      className="sm:col-span-2"

                      rows={3}

                      value={formData.full_address}

                      onChange={(e) => update("full_address", e.target.value)}

                    />

                  </div>

                </div>

                <div className="rounded-lg border border-[#E8E6FF] bg-[#fafaff] p-4 sm:p-5">

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#10026B]">

                    Emergency Contact

                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <TextField

                      label="Contact Name"

                      required

                      value={formData.emergency_contact_name}

                      onChange={(e) => update("emergency_contact_name", e.target.value)}

                    />

                    <TextField

                      label="Relationship"

                      value={formData.emergency_contact_relationship}

                      onChange={(e) => update("emergency_contact_relationship", e.target.value)}

                      placeholder="e.g. Relative, Neighbor"

                    />

                    <TextField

                      label="Phone Number"

                      required

                      type="tel"

                      className="sm:col-span-2"

                      value={formData.emergency_contact_phone}

                      onChange={(e) => update("emergency_contact_phone", e.target.value)}

                    />

                  </div>

                </div>

              </div>

            </FormSection>

          )}



          {currentStep === 3 && (

            <FormSection

              title="Documents"

              description={

                formData.is_transfer

                  ? "Upload birth certificate, previous school report card, and transfer letter. Student photo was uploaded in the previous step."

                  : "Upload birth certificate. Student photo was uploaded in the previous step."

              }

            >

              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">

                <Info className="h-4 w-4 shrink-0" />

                <span>

                  Student photo: {formData.photo ? formData.photo.name : "Not uploaded yet"}

                </span>

              </div>

              <div className="space-y-4">

                {documentFields.map((doc) => (

                  <FileUploadField

                    key={doc.key}

                    label={doc.label}

                    hint={doc.hint}

                    required={doc.required}

                    file={formData.documents[doc.key]}

                    onChange={(file) =>

                      setFormData((prev) => ({

                        ...prev,

                        documents: { ...prev.documents, [doc.key]: file },

                      }))

                    }

                  />

                ))}

              </div>

            </FormSection>

          )}



          {currentStep === 4 && (

            <FormSection

              title="Payment"

              description="Transfer the registration fee to our school bank account and upload proof of payment."

            >

              {/* TODO: Replace with real bank account details from Family School */}

              <div className="bg-[#10026B]/5 border border-[#10026B]/20 rounded-xl p-6 mb-6">

                <div className="flex items-center gap-3 mb-4">

                  <div className="w-10 h-10 rounded-full bg-[#10026B] flex items-center justify-center">

                    <Building2 className="w-5 h-5 text-white" />

                  </div>

                  <div>

                    <h3 className="font-bold text-[#10026B]">School Bank Account Details</h3>

                    <p className="text-sm text-gray-500">Transfer your registration fee to this account</p>

                  </div>

                </div>



                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100">

                    <p className="text-xs text-gray-400 mb-1">Bank Name</p>

                    {/* Bank Name: Commercial Bank of Ethiopia (change if different bank) */}

                    <p className="font-semibold text-[#10026B] text-sm">Commercial Bank of Ethiopia</p>

                  </div>

                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100">

                    <p className="text-xs text-gray-400 mb-1">Account Name</p>

                    <p className="font-semibold text-[#10026B] text-sm">MATI Academy</p>

                  </div>

                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100">

                    <p className="text-xs text-gray-400 mb-1">Account Number</p>

                    {/* Account Number: [get from school admin] */}

                    <div className="flex items-center justify-between gap-2">

                      <p className="font-semibold text-[#10026B] tracking-widest text-sm break-all">

                        1000782250958

                      </p>

                      <button

                        type="button"

                        onClick={() => {

                          navigator.clipboard.writeText("1000123456789");

                          toast.success("Account number copied!");

                        }}

                        className="text-[#C2B30C] hover:text-[#9e920a] transition-colors flex-shrink-0"

                      >

                        <Copy className="w-4 h-4" />

                      </button>

                    </div>

                  </div>

                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100">

                    <p className="text-xs text-gray-400 mb-1">Registration Fee</p>

                    {/* Registration Fee Amount: ETB 500 */}

                    <p className="font-semibold text-[#10026B] text-sm">ETB 500</p>

                  </div>

                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100">

                    <p className="text-xs text-gray-400 mb-1">Monthly Fee</p>

                    {/* Monthly Fee Amount: ETB 1,500 */}

                    <p className="font-semibold text-[#10026B] text-sm">ETB 1,500</p>

                  </div>

                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100 sm:col-span-2 bg-[#10026B] text-white">

                    <p className="text-xs text-gray-100 mb-1">Total Amount Due</p>

                    {/* Total: Registration (500) + Monthly (1500) = 2000 */}

                    <p className="font-bold text-lg text-[#C2B30C]">ETB 2,000</p>

                    <p className="text-xs text-gray-200 mt-1">Registration 500 + Monthly 1,500</p>

                  </div>

                </div>



                <div className="mt-4 bg-[#C2B30C]/10 rounded-lg p-3 flex items-start gap-2">

                  <Info className="w-4 h-4 text-[#C2B30C] flex-shrink-0 mt-0.5" />

                  <p className="text-xs text-gray-600">

                    After making the payment, upload your payment receipt below.

                    Your application will not be processed without proof of payment.

                  </p>

                </div>

              </div>



              <div className="space-y-4">

                <h3 className="font-bold text-[#10026B]">Upload Payment Receipt</h3>

                <p className="text-sm text-gray-500">

                  Upload a clear photo or scan of your bank transfer receipt or deposit slip.

                </p>



                <div

                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${

                    paymentReceipt

                      ? "border-green-400 bg-green-50"

                      : "border-[#10026B]/30 hover:border-[#C2B30C] hover:bg-[#C2B30C]/5"

                  }`}

                  onClick={() => document.getElementById("payment-receipt-input").click()}

                  onDragOver={(e) => e.preventDefault()}

                  onDrop={(e) => {

                    e.preventDefault();

                    const file = e.dataTransfer.files[0];

                    if (file) setPaymentReceipt(file);

                  }}

                >

                  <input

                    id="payment-receipt-input"

                    type="file"

                    accept="image/*,.pdf"

                    className="hidden"

                    onChange={(e) => setPaymentReceipt(e.target.files[0])}

                  />



                  {paymentReceipt ? (

                    <div className="flex flex-col items-center gap-2">

                      <CheckCircle className="w-10 h-10 text-green-500" />

                      <p className="font-semibold text-green-700">{paymentReceipt.name}</p>

                      <p className="text-xs text-gray-400">

                        {(paymentReceipt.size / 1024).toFixed(1)} KB

                      </p>

                      <button

                        type="button"

                        onClick={(e) => {

                          e.stopPropagation();

                          setPaymentReceipt(null);

                        }}

                        className="text-xs text-red-400 hover:text-red-600 underline"

                      >

                        Remove and upload different file

                      </button>

                    </div>

                  ) : (

                    <div className="flex flex-col items-center gap-2">

                      <Upload className="w-10 h-10 text-[#10026B]/40" />

                      <p className="font-semibold text-[#10026B]">

                        Click or drag your receipt here

                      </p>

                      <p className="text-xs text-gray-400">

                        Accepted formats: JPG, PNG, PDF — Max size: 5MB

                      </p>

                    </div>

                  )}

                </div>



                {paymentReceiptError && (

                  <p className="text-red-500 text-sm flex items-center gap-1">

                    <Info className="w-4 h-4" /> {paymentReceiptError}

                  </p>

                )}

              </div>

            </FormSection>

          )}



          {currentStep === 5 && (

            <FormSection

              title="Review & Submit"

              description="Please verify all information before submitting. You will receive an admission number to track your application."

            >

              <dl className="rounded-lg border border-[#E8E6FF] bg-[#fafaff] px-4 sm:px-5">

                <ReviewRow label="Application Type" value={studentTypeLabel} />

                <ReviewRow

                  label="Student"

                  value={`${formData.first_name} ${formData.middle_name} ${formData.last_name}`.trim()}

                />

                <ReviewRow

                  label="Personal"

                  value={[genderLabel, formData.date_of_birth && `DOB: ${formData.date_of_birth}`]

                    .filter(Boolean)

                    .join(" · ")}

                />

                <ReviewRow

                  label="Academic"

                  value={`${formData.grade_applying} · ${formData.academic_year}`}

                />

                {formData.previous_school && (

                  <ReviewRow label="Previous School" value={formData.previous_school} />

                )}

                <ReviewRow

                  label="Parents"

                  value={[

                    formData.father_name && `Father: ${formData.father_name}`,

                    formData.mother_name && `Mother: ${formData.mother_name}`,

                    formData.guardian_name && `Guardian: ${formData.guardian_name}`,

                  ]

                    .filter(Boolean)

                    .join(" · ")}

                />

                <ReviewRow

                  label="Address"

                  value={`${formData.full_address}, ${formData.city}${formData.region ? `, ${formData.region}` : ""}, ${formData.country}`}

                />

                <ReviewRow

                  label="Emergency"

                  value={`${formData.emergency_contact_name} — ${formData.emergency_contact_phone}`}

                />

                <ReviewRow

                  label="Documents"

                  value={`${Object.keys(formData.documents).length} file(s) attached`}

                />

                <ReviewRow

                  label="Payment Receipt"

                  value={paymentReceipt ? paymentReceipt.name : "Not uploaded"}

                />

              </dl>



              <p className="mt-5 text-xs leading-relaxed text-[#6b63a3]">

                By submitting this application, you confirm that the information provided is

                accurate and complete to the best of your knowledge.

              </p>

            </FormSection>

          )}

        </div>



        {currentStep > 0 && (

          <div className="mt-6 sm:mt-8 flex flex-col-reverse gap-2 sm:gap-3 border-t border-gray-100 pt-4 sm:pt-6 sm:flex-row sm:justify-between">

            <Button

              variant="outline"

              onClick={handleBack}

              disabled={currentStep === 0}

              className="w-full sm:w-auto border-2 border-gray-200 text-gray-600 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-sm sm:text-base min-h-11"

            >

              <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />

              Previous

            </Button>

            {currentStep < ENROLLMENT_STEPS.length - 1 ? (

              <Button

                onClick={handleNext}

                className="w-full sm:w-auto bg-[#10026B] text-white font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-[#1a0494] transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base min-h-11"

              >

                Continue

                <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />

              </Button>

            ) : (

              <Button

                onClick={handleSubmit}

                disabled={submitMut.isPending}

                className="w-full sm:w-auto bg-gradient-to-r from-[#C2B30C] to-[#d4c40e] text-[#10026B] font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base min-h-11"

              >

                {submitMut.isPending ? "Submitting…" : "Submit Application"}

              </Button>

            )}

          </div>

        )}

          </div>

        </div>

      </div>

    </PublicLayout>

  );

}



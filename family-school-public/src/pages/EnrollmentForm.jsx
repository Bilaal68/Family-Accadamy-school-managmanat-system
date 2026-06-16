import { useMutation } from "@tanstack/react-query";

import { ArrowLeft, ArrowRight, GraduationCap, Info, School } from "lucide-react";

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

  fee_receipt: null,

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

    submitMut.mutate(payload);

  };



  const genderLabel =

    formData.gender === "M" ? "Male" : formData.gender === "F" ? "Female" : formData.gender;



  const studentTypeLabel = formData.is_transfer ? "Transfer Student" : "New Student";



  return (

    <PublicLayout>

      <div className="border-b border-[#E8E6FF] bg-[#10026B] px-4 py-10 text-white sm:px-6">

        <div className="mx-auto max-w-3xl">

          <Link

            to="/"

            className="inline-flex items-center text-sm text-white/70 transition hover:text-white"

          >

            <ArrowLeft className="mr-1.5 h-4 w-4" />

            Back to home

          </Link>

          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Admission Application</h1>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">

            Complete all sections below to apply for enrollment at Family Academy. We accept

            students in <strong className="text-[#C2B30C]">Grades 1 through 8</strong> only.

          </p>

          {typeChosen && currentStep > 0 && (

            <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-[#C2B30C]">

              {studentTypeLabel}

            </p>

          )}

        </div>

      </div>



      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        <div className="mb-8 rounded-xl border border-[#E8E6FF] bg-white p-5 shadow-sm">

          <StepIndicator currentStep={currentStep} />

          <p className="mt-4 hidden text-center text-sm font-medium text-[#10026B] lg:block">

            {ENROLLMENT_STEPS[currentStep].title}

          </p>

        </div>



        <div className="space-y-6">

          {currentStep === 0 && (

            <FormSection

              title="Select Application Type"

              description="Choose whether the student is enrolling for the first time or transferring from another school."

            >

              <div className="grid gap-4 sm:grid-cols-2">

                <button

                  type="button"

                  onClick={() => selectApplicationType(false)}

                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-[#E8E6FF] bg-[#fafaff] p-6 text-left transition hover:border-[#10026B] hover:shadow-md"

                >

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#10026B]/10">

                    <GraduationCap className="h-7 w-7 text-[#10026B]" />

                  </div>

                  <div className="text-center">

                    <h3 className="font-semibold text-[#10026B]">New Student</h3>

                    <p className="mt-1 text-sm text-[#6b63a3]">

                      First-time enrollment. Requires student photo and birth certificate.

                    </p>

                  </div>

                </button>

                <button

                  type="button"

                  onClick={() => selectApplicationType(true)}

                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-[#E8E6FF] bg-[#fafaff] p-6 text-left transition hover:border-[#C2B30C] hover:shadow-md"

                >

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C2B30C]/20">

                    <School className="h-7 w-7 text-[#10026B]" />

                  </div>

                  <div className="text-center">

                    <h3 className="font-semibold text-[#10026B]">Transfer Student</h3>

                    <p className="mt-1 text-sm text-[#6b63a3]">

                      Transferring from another school. Requires report card and transfer letter in addition to birth certificate.

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

                <FileUploadField

                  label="Registration Fee Receipt"

                  hint="Upload proof of registration fee payment (optional)"

                  file={formData.fee_receipt}

                  onChange={(file) => update("fee_receipt", file)}

                />

              </div>

            </FormSection>

          )}



          {currentStep === 4 && (

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

                  value={`${Object.keys(formData.documents).length} file(s) attached${formData.fee_receipt ? " · Fee receipt included" : ""}`}

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

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#E8E6FF] pt-6 sm:flex-row sm:justify-between">

            <Button

              variant="outline"

              onClick={handleBack}

              disabled={currentStep === 0}

              className="w-full sm:w-auto"

            >

              <ArrowLeft className="mr-2 h-4 w-4" />

              Previous

            </Button>

            {currentStep < ENROLLMENT_STEPS.length - 1 ? (

              <Button

                onClick={handleNext}

                className="w-full bg-[#10026B] hover:bg-[#1a0a8a] sm:w-auto"

              >

                Continue

                <ArrowRight className="ml-2 h-4 w-4" />

              </Button>

            ) : (

              <Button

                onClick={handleSubmit}

                disabled={submitMut.isPending}

                className="w-full bg-[#C2B30C] font-semibold text-[#10026B] hover:bg-[#d4c50e] sm:w-auto"

              >

                {submitMut.isPending ? "Submitting…" : "Submit Application"}

              </Button>

            )}

          </div>

        )}

      </div>

    </PublicLayout>

  );

}



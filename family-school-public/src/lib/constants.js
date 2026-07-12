export const GRADES = ["KG1", "KG2", "KG3", "Grade 1", "Grade 2", "Grade 3", "Grade 4"];

export const ACADEMIC_YEARS = ["2025/2026", "2026/2027", "2027/2028"];

export const ENROLLMENT_STEPS = [
  { id: "type", title: "Application Type", short: "Type" },
  { id: "student", title: "Student Information", short: "Student" },
  { id: "parents", title: "Parent & Guardian", short: "Parents" },
  { id: "documents", title: "Documents", short: "Documents" },
  { id: "payment", title: "Payment", short: "Payment" },
  { id: "review", title: "Review & Submit", short: "Review" },
];

export const NEW_STUDENT_DOCUMENTS = [
  {
    key: "birth_certificate",
    label: "Birth Certificate",
    hint: "Official copy of the student's birth certificate",
    required: true,
  },
];

export const TRANSFER_STUDENT_DOCUMENTS = [
  {
    key: "birth_certificate",
    label: "Birth Certificate",
    hint: "Official copy of the student's birth certificate",
    required: true,
  },
  {
    key: "transcript",
    label: "Previous School Report Card",
    hint: "Most recent report card from the previous school",
    required: true,
  },
  {
    key: "transfer_letter",
    label: "Transfer Letter",
    hint: "Official transfer letter from the previous school (transfer students only)",
    required: true,
  },
];

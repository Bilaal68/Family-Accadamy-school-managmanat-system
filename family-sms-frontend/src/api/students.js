import client from "./client";

export function fetchStudents(params) {
  return client.get("/students/", { params });
}

export function getStudent(id) {
  return client.get(`/students/${id}/`);
}

export function createStudent(payload) {
  const body = new FormData();
  body.append("full_name", payload.full_name);
  body.append("date_of_birth", payload.date_of_birth);
  body.append("gender", payload.gender);
  body.append("class_id", payload.class_id);
  if (payload.photo) {
    body.append("photo", payload.photo);
  }
  return client.post("/students/", body);
}

export function updateStudent(id, payload) {
  const body = new FormData();
  if (payload.full_name != null) body.append("full_name", payload.full_name);
  if (payload.date_of_birth != null) {
    body.append("date_of_birth", payload.date_of_birth);
  }
  if (payload.gender != null) body.append("gender", payload.gender);
  if (payload.class_id != null) body.append("class_id", payload.class_id);
  if (payload.is_active != null) {
    body.append("is_active", payload.is_active ? "true" : "false");
  }
  if (payload.photo) {
    body.append("photo", payload.photo);
  }
  return client.put(`/students/${id}/`, body);
}

export function bulkImportStudents(file) {
  const body = new FormData();
  body.append("file", file);
  return client.post("/students/bulk/", body);
}

export function fetchStudentAttendance(id) {
  return client.get(`/students/${id}/attendance/`);
}

export function fetchStudentGrades(id) {
  return client.get(`/students/${id}/grades/`);
}

export function fetchStudentRemarks(id) {
  return client.get(`/students/${id}/remarks/`);
}

export function deleteStudent(id) {
  return client.delete(`/students/${id}/`);
}

export function getStudentIdCardUrl(id, academicYear) {
  const baseURL = client.defaults.baseURL || "/api/v1";
  const params = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : "";
  return `${baseURL}/students/${id}/id-card/${params}`;
}

export function fetchStudentIdCardPreview(id, side = "front", academicYear) {
  return client.get(`/students/${id}/id-card-preview/`, {
    params: {
      side,
      ...(academicYear ? { academic_year: academicYear } : {}),
    },
    responseType: "blob",
  });
}

export function getStudentIdCardPreviewUrl(id, side = "front", academicYear) {
  const baseURL = client.defaults.baseURL || "/api/v1";
  const query = new URLSearchParams({ side });
  if (academicYear) query.set("academic_year", academicYear);
  return `${baseURL}/students/${id}/id-card-preview/?${query.toString()}`;
}

export function downloadStudentIdCard(id, academicYear) {
  return client.get(`/students/${id}/id-card/`, {
    params: academicYear ? { academic_year: academicYear } : {},
    responseType: "blob",
  });
}

export function downloadBulkIdCards({ classId, studentIds, academicYear }) {
  if (studentIds && studentIds.length > 0) {
    return client.post(
      "/students/bulk-id-cards/",
      { student_ids: studentIds, academic_year: academicYear },
      { responseType: "blob" }
    );
  }
  return client.get("/students/bulk-id-cards/", {
    params: {
      ...(classId ? { class_id: classId } : {}),
      ...(academicYear ? { academic_year: academicYear } : {}),
    },
    responseType: "blob",
  });
}

export function previewCustomIdCard(formData) {
  return client.post("/students/preview-custom-id/", formData, {
    responseType: "blob",
  });
}

export function downloadCustomIdCard(formData) {
  return client.post("/students/generate-custom-id/", formData, {
    responseType: "blob",
  });
}

export function downloadCustomBulkIdCards(formData) {
  return client.post("/students/generate-custom-bulk-ids/", formData, {
    responseType: "blob",
  });
}



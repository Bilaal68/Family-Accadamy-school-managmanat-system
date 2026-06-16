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

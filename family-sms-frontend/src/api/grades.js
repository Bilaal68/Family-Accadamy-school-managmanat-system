import client from "./client";

export function fetchGrades(params) {
  return client.get("/grades/", { params });
}

export function createGrade(data) {
  return client.post("/grades/", data);
}

export function updateGrade(id, data) {
  return client.put(`/grades/${id}/`, data);
}

export function submitGrades(data) {
  return client.post("/grades/submit/", data);
}

export function approveGrade(id) {
  return client.post(`/grades/approve/${id}/`);
}

export function fetchGradeAverages(params) {
  return client.get("/grades/averages/", { params });
}

// Subject Summary endpoint
export function fetchSubjectSummary(params) {
  return client.get("/grades/subject_summary/", { params });
}

// Subject API endpoints
export function fetchSubjects() {
  return client.get("/grades/subjects/");
}

export function createSubject(data) {
  return client.post("/grades/subjects/", data);
}

export function updateSubject(data) {
  return client.put("/grades/subjects/", data);
}

export function deleteSubject(id) {
  return client.delete("/grades/subjects/", { params: { id } });
}

import client from "./client";

export function applyEnrollment(payload) {
  return client.post("/enrollment/apply/", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function getEnrollmentStatus(admissionNumber) {
  return client.get(`/enrollment/status/${admissionNumber}/`);
}

export function getEnrollments(params) {
  return client.get("/enrollment/", { params });
}

export function getEnrollmentDetail(id) {
  return client.get(`/enrollment/${id}/`);
}

export function reviewEnrollment(id, payload) {
  return client.patch(`/enrollment/${id}/review/`, payload);
}

export function approveEnrollment(id) {
  return client.patch(`/enrollment/${id}/approve/`);
}

export function rejectEnrollment(id, payload) {
  return client.patch(`/enrollment/${id}/reject/`, payload);
}

export function getEnrollmentStats() {
  return client.get("/enrollment/stats/");
}

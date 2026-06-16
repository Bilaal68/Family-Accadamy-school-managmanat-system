import client from "./client";

export function applyEnrollment(payload) {
  return client.post("/enrollment/apply/", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function getEnrollmentStatus(admissionNumber) {
  return client.get(`/enrollment/status/${admissionNumber}/`);
}

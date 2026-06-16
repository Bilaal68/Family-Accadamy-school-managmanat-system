import client from "./client";

export function fetchAttendance(params) {
  return client.get("/attendance/", { params });
}

export function approveAttendance(id) {
  return client.post(`/attendance/approve/${id}/`);
}

export function exportAttendance(payload) {
  return client.post("/attendance/export/", payload, { responseType: "blob" });
}

export function markAttendance(entries) {
  return client.post("/attendance/mark/", { entries });
}

export function submitAttendance() {
  return client.post("/attendance/submit/");
}

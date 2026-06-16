import client from "./client";
import { parseListResponse } from "./listResponse";

export function fetchClasses() {
  return client.get("/classes/");
}

export async function fetchClassesList() {
  const { data } = await fetchClasses();
  return parseListResponse(data);
}

export function getClass(id) {
  return client.get(`/classes/${id}/`);
}

export function createClass(payload) {
  return client.post("/classes/", payload);
}

export function fetchClassStudents(id) {
  return client.get(`/classes/${id}/students/`);
}

export async function fetchClassStudentsList(id) {
  const { data } = await fetchClassStudents(id);
  return parseListResponse(data);
}

export function fetchClassLeaderboard(id) {
  return client.get(`/classes/${id}/leaderboard/`);
}

export function deleteClass(id) {
  return client.delete(`/classes/${id}/`);
}

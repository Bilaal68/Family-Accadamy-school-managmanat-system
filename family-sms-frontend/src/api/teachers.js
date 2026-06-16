import client from "./client";
import { parseListResponse } from "./listResponse";

export function fetchTeachers() {
  return client.get("/teachers/");
}

export async function fetchTeachersList() {
  const { data } = await fetchTeachers();
  return parseListResponse(data);
}

export function getTeacher(id) {
  return client.get(`/teachers/${id}/`);
}

export function fetchTeacherSummary(id) {
  return client.get(`/teachers/${id}/summary/`);
}

export function createTeacher(payload) {
  return client.post("/teachers/", payload);
}

export function updateTeacher(id, payload) {
  return client.put(`/teachers/${id}/`, payload);
}

export function assignClass(teacherId, classId) {
  return client.post(`/teachers/${teacherId}/assign-class/`, {
    class_id: classId,
  });
}

export function removeClassAssignment(teacherId) {
  return client.delete(`/teachers/${teacherId}/assign-class/`);
}

export function deleteTeacher(id) {
  return client.delete(`/teachers/${id}/`);
}

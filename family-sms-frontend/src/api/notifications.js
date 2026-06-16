import client from "./client";
import { parseListResponse } from "./listResponse";

export function fetchNotifications(params) {
  return client.get("/notifications/", { params });
}

export async function fetchNotificationsList(params) {
  const { data } = await fetchNotifications(params);
  return parseListResponse(data);
}

export function markNotificationRead(id) {
  return client.patch(`/notifications/${id}/read/`);
}

export function markAllNotificationsRead() {
  return client.patch("/notifications/read-all/");
}

export function fetchAnnouncements() {
  return client.get("/notifications/announcements/");
}

export function sendAnnouncement(payload) {
  return client.post("/notifications/announce/", payload);
}

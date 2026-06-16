import client from "./client";

export function fetchBehaviourRemarks(params) {
  return client.get("/behaviour/", { params });
}

export function reportBehaviour(payload) {
  return client.post("/behaviour/report/", payload);
}

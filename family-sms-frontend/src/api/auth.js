import client from "./client";

export async function login(credentials) {
  const { data } = await client.post("/auth/login/", credentials);
  return data;
}

export async function logout(refresh) {
  const { data } = await client.post("/auth/logout/", { refresh });
  return data;
}

export async function fetchMe() {
  const { data } = await client.get("/auth/me/");
  return data;
}

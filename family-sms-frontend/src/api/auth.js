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

export async function updateProfile(profileData) {
  const { data } = await client.patch("/auth/profile/update/", profileData);
  return data;
}

export async function changePassword(passwordData) {
  const { data } = await client.post("/auth/password/change/", passwordData);
  return data;
}

export async function globalSearch(query) {
  const { data } = await client.get("/auth/search/", {
    params: { q: query }
  });
  return data;
}

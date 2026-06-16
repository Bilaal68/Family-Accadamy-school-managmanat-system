import client from "./client";

export const reportsApi = {
  list: () => client.get("/reports/"),
};

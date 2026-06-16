import { format, parseISO } from "date-fns";

export function formatDate(value, pattern = "dd MMM yyyy") {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern);
}

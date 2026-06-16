export function gradeColor(score) {
  if (score >= 80) return "text-[hsl(142,76%,36%)]";
  if (score >= 60) return "text-[hsl(38,92%,50%)]";
  return "text-[hsl(0,84%,60%)]";
}

export function statusColor(status) {
  switch (status) {
    case "PRESENT":
      return "text-[hsl(142,76%,36%)]";
    case "ABSENT":
      return "text-[hsl(0,84%,60%)]";
    case "LATE":
      return "text-[hsl(38,92%,50%)]";
    default:
      return "text-muted-foreground";
  }
}

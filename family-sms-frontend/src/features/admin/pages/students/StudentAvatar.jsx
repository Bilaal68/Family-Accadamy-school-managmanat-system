import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mediaUrl } from "@/lib/media";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function StudentAvatar({ photo, name, className = "h-10 w-10" }) {
  const src = mediaUrl(photo);
  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt={name || "Student"} /> : null}
      <AvatarFallback className="bg-neutral-100 text-xs font-medium text-neutral-600">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

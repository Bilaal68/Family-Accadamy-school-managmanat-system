import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function TeacherUnassigned({ user, onLogout }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-accent">
        FS
      </div>
      <h1 className="mt-6 text-center text-xl font-bold text-heading">
        Family Academy
      </h1>
      <p className="mt-8 max-w-md text-center text-subtext">
        You have not been assigned to a class yet. Please contact the administrator.
      </p>
      {user?.full_name && (
        <p className="mt-4 text-sm text-muted-label">Signed in as {user.full_name}</p>
      )}
      <Button
        type="button"
        variant="outline"
        className="mt-8 border-primary text-heading hover:bg-primary hover:text-primary-foreground"
        onClick={onLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}

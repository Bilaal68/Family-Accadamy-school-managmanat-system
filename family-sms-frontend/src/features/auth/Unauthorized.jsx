import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F9F9] px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You do not have permission to view this page.
          </p>
          <Button asChild className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

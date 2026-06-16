import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlaceholderPage({ title, description }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {description || "This page will be built in a future step."}
        </p>
      </CardContent>
    </Card>
  );
}

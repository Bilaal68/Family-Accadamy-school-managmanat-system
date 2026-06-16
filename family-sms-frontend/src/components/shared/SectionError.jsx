import { Button } from "@/components/ui/button";

export default function SectionError({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-brand bg-card px-4 py-6 text-center shadow-card">
      <p className="text-sm text-subtext">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

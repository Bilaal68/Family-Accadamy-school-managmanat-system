import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ConfirmDeleteDialog({
  open,
  onClose,
  title = "Delete item?",
  description,
  confirmLabel = "Delete",
  isPending = false,
  confirmDisabled = false,
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isPending && onClose()}>
      <DialogContent className="border-brand bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-heading">{title}</DialogTitle>
          <DialogDescription className="text-subtext">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || confirmDisabled}
            onClick={onConfirm}
          >
            {isPending ? "Deleting…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { sendAnnouncement } from "@/api/notifications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SendNotificationModal({ open, onClose, className }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { title: "", message: "" },
  });

  const sendMut = useMutation({
    mutationFn: (payload) => sendAnnouncement(payload),
    onSuccess: () => {
      toast.success("Notification sent to class parents");
      qc.invalidateQueries({ queryKey: ["teacher", "topbar", "notifications"] });
      reset();
      onClose();
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not send notification."),
  });

  const onSubmit = (values) => {
    sendMut.mutate({
      title: values.title,
      message: values.message,
      audience: "CLASS",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !sendMut.isPending && onClose()}>
      <DialogContent className="border-brand bg-card sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-heading">Send notification</DialogTitle>
            <DialogDescription className="text-subtext">
              Send a message to all parents in {className || "your class"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notif-title">Title</Label>
              <Input id="notif-title" {...register("title", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-message">Message</Label>
              <Textarea
                id="notif-message"
                rows={4}
                {...register("message", { required: true })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={sendMut.isPending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendMut.isPending}>
              {sendMut.isPending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Megaphone, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { fetchClassesList } from "@/api/classes";
import { fetchAnnouncements, sendAnnouncement } from "@/api/notifications";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SectionError from "@/components/shared/SectionError";

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState("ALL");
  const [classId, setClassId] = useState("");

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { title: "", message: "" },
  });

  const listQ = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await fetchAnnouncements();
      return Array.isArray(data) ? data : [];
    },
  });

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { results } = await fetchClassesList();
      return results;
    },
    enabled: open,
  });

  const sendMut = useMutation({
    mutationFn: (payload) => sendAnnouncement(payload),
    onSuccess: () => {
      toast.success("Announcement sent");
      qc.invalidateQueries({ queryKey: ["announcements"] });
      reset();
      setAudience("ALL");
      setClassId("");
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Could not send announcement.");
    },
  });

  const onSubmit = (values) => {
    const payload = {
      title: values.title,
      message: values.message,
      audience,
    };
    if (audience === "CLASS") payload.class_id = classId;
    sendMut.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-black">Announcements</h1>
        <Button
          className="border border-black bg-white text-black hover:bg-black hover:text-white"
          onClick={() => setOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Announcement
        </Button>
      </div>

      <div className="rounded-lg border border-[#E5E5E5] bg-white">
        {listQ.isLoading && (
          <div className="h-40 animate-pulse rounded-lg bg-neutral-100 m-4" />
        )}
        {listQ.isError && (
          <div className="p-6">
            <SectionError
              message="Could not load announcements."
              onRetry={() => listQ.refetch()}
            />
          </div>
        )}
        {!listQ.isLoading && !listQ.isError && listQ.data?.length === 0 && (
          <div className="flex flex-col items-center py-16 text-neutral-500">
            <Megaphone className="mb-3 h-10 w-10 text-neutral-300" />
            <p>No announcements sent yet.</p>
          </div>
        )}
        {!listQ.isLoading && listQ.data?.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Sent to</TableHead>
                <TableHead>Sent at</TableHead>
                <TableHead>Sent by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQ.data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>{a.sent_to}</TableCell>
                  <TableCell>
                    {a.created_at
                      ? format(parseISO(a.created_at), "MMM d, yyyy h:mm a")
                      : "—"}
                  </TableCell>
                  <TableCell>{a.sent_by_name || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-[#E5E5E5] bg-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
            <DialogDescription>
              Broadcast a message to the whole school or one class.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ann-title">Title</Label>
              <Input id="ann-title" {...register("title", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-msg">Message</Label>
              <textarea
                id="ann-msg"
                rows={4}
                className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                {...register("message", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All School</SelectItem>
                  <SelectItem value="CLASS">Specific class</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {audience === "CLASS" && (
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesQ.data?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendMut.isPending || (audience === "CLASS" && !classId)}
              >
                {sendMut.isPending ? "Sending…" : "Send"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

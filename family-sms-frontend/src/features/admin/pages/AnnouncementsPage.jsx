import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Megaphone, Plus, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { fetchClassesList } from "@/api/classes";
import { fetchAnnouncements, sendAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/api/notifications";
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
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [audience, setAudience] = useState("ALL");
  const [classId, setClassId] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const { register, handleSubmit, reset, watch, setValue } = useForm({
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
    enabled: open || editOpen,
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

  const updateMut = useMutation({
    mutationFn: (payload) => updateAnnouncement(selectedAnnouncement.id, payload),
    onSuccess: () => {
      toast.success("Announcement updated");
      qc.invalidateQueries({ queryKey: ["announcements"] });
      reset();
      setEditOpen(false);
      setSelectedAnnouncement(null);
      setAudience("ALL");
      setClassId("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Could not update announcement.");
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteAnnouncement(selectedAnnouncement.id),
    onSuccess: () => {
      toast.success("Announcement deleted");
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setDeleteOpen(false);
      setSelectedAnnouncement(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Could not delete announcement.");
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

  const onEditSubmit = (values) => {
    const payload = {
      title: values.title,
      message: values.message,
      audience,
    };
    if (audience === "CLASS") payload.class_id = classId;
    updateMut.mutate(payload);
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setValue("title", announcement.title);
    setValue("message", announcement.message);
    setAudience(announcement.audience);
    if (announcement.school_class_id) {
      setClassId(announcement.school_class_id);
    }
    setEditOpen(true);
  };

  const handleDeleteClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteOpen(true);
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
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(a)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(a)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create New Announcement Dialog */}
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

      {/* Edit Announcement Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-[#E5E5E5] bg-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit announcement</DialogTitle>
            <DialogDescription>
              Update the announcement details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" {...register("title", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-msg">Message</Label>
              <textarea
                id="edit-msg"
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
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMut.isPending || (audience === "CLASS" && !classId)}
              >
                {updateMut.isPending ? "Updating…" : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-[#E5E5E5] bg-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete announcement?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedAnnouncement?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Eye, Pencil, School, Search, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { deleteTeacher, fetchTeachersList } from "@/api/teachers";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SectionError from "@/components/shared/SectionError";
import useDebouncedValue from "@/hooks/useDebouncedValue";

import AssignClassModal from "./AssignClassModal";
import EditTeacherModal from "./EditTeacherModal";
import RegisterTeacherModal from "./RegisterTeacherModal";

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded bg-neutral-200" />
      ))}
    </div>
  );
}

export default function TeachersList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [deleteTeacherTarget, setDeleteTeacherTarget] = useState(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const teachersQ = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { results } = await fetchTeachersList();
      return results;
    },
  });

  const filtered = useMemo(() => {
    const list = teachersQ.data ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.full_name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.staff_id?.toLowerCase().includes(q)
    );
  }, [teachersQ.data, debouncedSearch]);

  const deleteMut = useMutation({
    mutationFn: (id) => deleteTeacher(id),
    onSuccess: () => {
      toast.success("Teacher deleted");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["admin", "metrics", "teachers-count"] });
      setDeleteTeacherTarget(null);
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not delete teacher."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-semibold text-black">Teachers</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="pl-9"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white"
            onClick={() => setRegisterOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Register Teacher
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-[#E5E5E5] bg-white">
        {teachersQ.isLoading && (
          <div className="p-6">
            <TableSkeleton />
          </div>
        )}
        {teachersQ.isError && (
          <div className="p-6">
            <SectionError
              message="Could not load teachers."
              onRetry={() => teachersQ.refetch()}
            />
          </div>
        )}
        {!teachersQ.isLoading && !teachersQ.isError && filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-neutral-500">No teachers found</p>
        )}
        {!teachersQ.isLoading && !teachersQ.isError && filtered.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Class</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-mono text-sm">{teacher.staff_id}</TableCell>
                  <TableCell className="font-medium">{teacher.full_name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>
                    {teacher.assigned_class_name ? (
                      <span>{teacher.assigned_class_name}</span>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800">Unassigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {teacher.joined_at
                      ? format(parseISO(teacher.joined_at), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild title="View">
                        <Link to={`/admin/teachers/${teacher.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => setEditTeacher(teacher)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Assign class"
                        onClick={() => setAssignTeacher(teacher)}
                      >
                        <School className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteTeacherTarget(teacher)}
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

      <RegisterTeacherModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />
      <EditTeacherModal
        open={!!editTeacher}
        teacher={editTeacher}
        onClose={() => setEditTeacher(null)}
      />
      <AssignClassModal
        open={!!assignTeacher}
        teacher={assignTeacher}
        onClose={() => setAssignTeacher(null)}
      />
      <ConfirmDeleteDialog
        open={!!deleteTeacherTarget}
        onClose={() => setDeleteTeacherTarget(null)}
        title="Delete teacher?"
        description={
          deleteTeacherTarget
            ? `This permanently removes ${deleteTeacherTarget.full_name} (${deleteTeacherTarget.staff_id}) and their login account. This cannot be undone.`
            : ""
        }
        isPending={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate(deleteTeacherTarget.id)}
      />
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Eye,
  Link2,
  Pencil,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { fetchClassesList } from "@/api/classes";
import { deleteStudent, fetchStudents } from "@/api/students";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import useDebouncedValue from "@/hooks/useDebouncedValue";

import BulkImportModal from "./BulkImportModal";
import EditStudentModal from "./EditStudentModal";
import RegisterStudentModal from "./RegisterStudentModal";
import StudentAvatar from "./StudentAvatar";

const PAGE_SIZE = 20;

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded bg-neutral-200" />
      ))}
    </div>
  );
}

export default function StudentsList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { results } = await fetchClassesList();
      return results;
    },
  });

  const studentsQ = useQuery({
    queryKey: ["students", page, classFilter, debouncedSearch],
    queryFn: async () => {
      const params = { page, page_size: PAGE_SIZE };
      if (classFilter !== "all") params.class = classFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const { data } = await fetchStudents(params);
      return {
        results: data.results ?? [],
        count: data.count ?? 0,
      };
    },
  });

  const totalPages = Math.max(1, Math.ceil((studentsQ.data?.count ?? 0) / PAGE_SIZE));

  const deleteMut = useMutation({
    mutationFn: (id) => deleteStudent(id),
    onSuccess: () => {
      toast.success("Student deleted");
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["admin", "metrics", "students-count"] });
      setDeleteStudentTarget(null);
      if (studentsQ.data?.results.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not delete student."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-semibold text-black">Students</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="pl-9"
              placeholder="Search name or ID…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={classFilter}
            onValueChange={(v) => {
              setClassFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classesQ.data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white"
            onClick={() => setRegisterOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Register Student
          </Button>
          <Button
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white"
            onClick={() => setBulkOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-[#E5E5E5] bg-white">
        {studentsQ.isLoading && (
          <div className="p-6">
            <TableSkeleton />
          </div>
        )}
        {studentsQ.isError && (
          <div className="p-6">
            <SectionError
              message="Could not load students."
              onRetry={() => studentsQ.refetch()}
            />
          </div>
        )}
        {!studentsQ.isLoading && !studentsQ.isError && studentsQ.data?.results.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
              <Users className="h-10 w-10 text-neutral-400" />
            </div>
            <p className="text-lg font-medium text-black">No students found</p>
            <p className="mt-1 text-sm text-neutral-500">
              Try adjusting search or filters, or register a new student.
            </p>
          </div>
        )}
        {!studentsQ.isLoading &&
          !studentsQ.isError &&
          studentsQ.data?.results.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Photo</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsQ.data.results.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <StudentAvatar
                          photo={student.photo}
                          name={student.full_name}
                          className="h-9 w-9"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.student_id}</TableCell>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.class_name}</TableCell>
                      <TableCell>
                        {student.enrolled_at
                          ? format(parseISO(student.enrolled_at), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={student.is_active ? "success" : "secondary"}
                          className={
                            student.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-neutral-200 text-neutral-700"
                          }
                        >
                          {student.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild title="View">
                            <Link to={`/admin/students/${student.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => setEditStudent(student)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDeleteStudentTarget(student)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t border-[#E5E5E5] px-4 py-3">
                <p className="text-sm text-neutral-600">
                  Page {page} of {totalPages} · {studentsQ.data.count} students
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
      </div>

      <RegisterStudentModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <EditStudentModal
        open={!!editStudent}
        student={editStudent}
        onClose={() => setEditStudent(null)}
      />
      <ConfirmDeleteDialog
        open={!!deleteStudentTarget}
        onClose={() => setDeleteStudentTarget(null)}
        title="Delete student?"
        description={
          deleteStudentTarget
            ? `This permanently removes ${deleteStudentTarget.full_name} (${deleteStudentTarget.student_id}) and cannot be undone.`
            : ""
        }
        isPending={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate(deleteStudentTarget.id)}
      />
    </div>
  );
}

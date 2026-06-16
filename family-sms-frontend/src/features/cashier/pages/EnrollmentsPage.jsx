import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Eye, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { getEnrollments } from "@/api/enrollment";
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

const PAGE_SIZE = 20;

function paymentStatusColor(status) {
  if (status === "PAID") return "bg-green-100 text-green-800";
  if (status === "PARTIAL") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function statusColor(status) {
  if (status === "PENDING") return "bg-amber-100 text-amber-800";
  if (status === "REVIEWED") return "bg-blue-100 text-blue-800";
  if (status === "APPROVED") return "bg-green-100 text-green-800";
  if (status === "REJECTED") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

export default function EnrollmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const enrollmentsQ = useQuery({
    queryKey: ["enrollments", page, statusFilter, debouncedSearch],
    queryFn: async () => {
      const params = { page, page_size: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const { data } = await getEnrollments(params);
      return Array.isArray(data) ? data : [];
    },
  });

  const totalPages = Math.max(1, Math.ceil((enrollmentsQ.data?.length ?? 0) / PAGE_SIZE));

  if (enrollmentsQ.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="h-64 animate-pulse rounded-lg bg-neutral-200" />
      </div>
    );
  }

  if (enrollmentsQ.isError) {
    return (
      <SectionError
        message="Could not load enrollments."
        onRetry={() => enrollmentsQ.refetch()}
      />
    );
  }

  const enrollments = enrollmentsQ.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Enrollments</h1>
          <p className="text-gray-600">Manage student enrollment applications</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="pl-9"
              placeholder="Search name or admission no…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Link to="/cashier/enrollments/new">
            <Button
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              New Enrollment
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        {enrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
              <Search className="h-10 w-10 text-neutral-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No enrollments found</p>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting search or filters, or create a new enrollment.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Application Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-mono text-sm">
                      {enrollment.admission_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {enrollment.full_name}
                    </TableCell>
                    <TableCell>
                      <Badge className={enrollment.is_transfer ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                        {enrollment.student_type || (enrollment.is_transfer ? "Transfer" : "New")}
                      </Badge>
                    </TableCell>
                    <TableCell>{enrollment.grade_applying}</TableCell>
                    <TableCell>
                      {enrollment.created_at
                        ? format(parseISO(enrollment.created_at), "MMM d, yyyy")
                        : ""}
                    </TableCell>
                    <TableCell>
                      <Badge className={paymentStatusColor(enrollment.payment_status)}>
                        {enrollment.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor(enrollment.status)}>
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/cashier/enrollments/${enrollment.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages} · {enrollments.length} enrollments
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
    </div>
  );
}

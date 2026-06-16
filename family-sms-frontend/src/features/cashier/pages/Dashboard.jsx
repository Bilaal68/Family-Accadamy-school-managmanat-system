import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, CheckCircle, ClipboardList, UserPlus, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { getEnrollmentStats, getEnrollments } from "@/api/enrollment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SectionError from "@/components/shared/SectionError";
import { ListSkeleton } from "@/components/shared/SectionSkeleton";

function paymentStatusColor(status) {
  if (status === "PAID") return "bg-green-100 text-green-800";
  if (status === "PARTIAL") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function CashierDashboard() {
  const statsQ = useQuery({
    queryKey: ["enrollment-stats"],
    queryFn: async () => {
      const { data } = await getEnrollmentStats();
      return data;
    },
  });

  const pendingQ = useQuery({
    queryKey: ["enrollments", "PENDING"],
    queryFn: async () => {
      const { data } = await getEnrollments({ status: "PENDING" });
      return Array.isArray(data) ? data : [];
    },
  });

  const recentQ = useQuery({
    queryKey: ["enrollments", "recent"],
    queryFn: async () => {
      const { data } = await getEnrollments();
      return Array.isArray(data) ? data.slice(0, 5) : [];
    },
  });

  if (statsQ.isLoading || pendingQ.isLoading || recentQ.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-neutral-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-neutral-200" />
      </div>
    );
  }

  if (statsQ.isError || pendingQ.isError || recentQ.isError) {
    return (
      <SectionError
        message="Could not load dashboard data."
        onRetry={() => {
          statsQ.refetch();
          pendingQ.refetch();
          recentQ.refetch();
        }}
      />
    );
  }

  const stats = statsQ.data || {};
  const pending = pendingQ.data || [];
  const recent = recentQ.data || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of enrollment activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pending
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.pending || 0}</div>
            <p className="text-xs text-gray-500">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Reviewed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.reviewed || 0}</div>
            <p className="text-xs text-gray-500">Sent to admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approved Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.approved || 0}</div>
            <p className="text-xs text-gray-500">Students created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rejected
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.rejected || 0}</div>
            <p className="text-xs text-gray-500">Rejected applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Enrollments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pending Enrollments</CardTitle>
            <Link to="/cashier/enrollments/new">
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                New Enrollment
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No pending enrollments
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-mono text-sm">
                      {enrollment.admission_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {enrollment.full_name}
                    </TableCell>
                    <TableCell>{enrollment.grade_applying}</TableCell>
                    <TableCell>
                      {enrollment.created_at
                        ? formatDistanceToNow(new Date(enrollment.created_at), {
                            addSuffix: true,
                          })
                        : ""}
                    </TableCell>
                    <TableCell>
                      <Badge className={paymentStatusColor(enrollment.payment_status)}>
                        {enrollment.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/cashier/enrollments/${enrollment.id}`}>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No recent activity
            </p>
          ) : (
            <div className="space-y-4">
              {recent.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {enrollment.full_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {enrollment.admission_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className={
                        enrollment.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : enrollment.status === "REVIEWED"
                          ? "bg-blue-100 text-blue-800"
                          : enrollment.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {enrollment.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {enrollment.created_at
                        ? formatDistanceToNow(new Date(enrollment.created_at), {
                            addSuffix: true,
                          })
                        : ""}
                    </span>
                    <Link to={`/cashier/enrollments/${enrollment.id}`}>
                      <Button size="sm" variant="ghost">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

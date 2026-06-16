import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ArrowLeft, ClipboardList, Percent } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { fetchTeacherSummary, getTeacher } from "@/api/teachers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SectionError from "@/components/shared/SectionError";

export default function TeacherDetail() {
  const { id } = useParams();

  const teacherQ = useQuery({
    queryKey: ["teacher", id],
    queryFn: async () => {
      const { data } = await getTeacher(id);
      return data;
    },
  });

  const summaryQ = useQuery({
    queryKey: ["teacher", id, "summary"],
    queryFn: async () => {
      const { data } = await fetchTeacherSummary(id);
      return data;
    },
    enabled: !!id,
  });

  if (teacherQ.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="h-64 animate-pulse rounded-lg bg-neutral-200" />
      </div>
    );
  }

  if (teacherQ.isError) {
    return (
      <SectionError
        message="Could not load teacher."
        onRetry={() => teacherQ.refetch()}
      />
    );
  }

  const teacher = teacherQ.data;
  const summary = summaryQ.data;

  return (
    <div className="space-y-6">
      <Link
        to="/admin/teachers"
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to teachers
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[#E5E5E5] bg-white">
          <CardHeader>
            <CardTitle>{teacher.full_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Staff ID</span>
              <span className="font-mono font-medium">{teacher.staff_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Email</span>
              <span className="font-medium">{teacher.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Joined</span>
              <span>
                {teacher.joined_at
                  ? format(parseISO(teacher.joined_at), "MMM d, yyyy")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Assigned class</span>
              <span className="font-medium">
                {teacher.assigned_class_name || (
                  <span className="text-amber-600">Unassigned</span>
                )}
              </span>
            </div>
            {teacher.assigned_class_id && (
              <Link
                to={`/admin/classes/${teacher.assigned_class_id}`}
                className="inline-block text-sm font-medium text-black underline-offset-4 hover:underline"
              >
                View class →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E5E5E5] bg-white">
          <CardHeader>
            <CardTitle className="text-base">Class performance</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryQ.isLoading && (
              <p className="text-sm text-neutral-500">Loading summary…</p>
            )}
            {!teacher.assigned_class_id && (
              <p className="text-sm text-neutral-500">
                Assign a class to see performance metrics.
              </p>
            )}
            {teacher.assigned_class_id && summary && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border border-[#E5E5E5] p-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Percent className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">
                      Class average
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {summary.class_average != null
                      ? `${summary.class_average}%`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-md border border-[#E5E5E5] p-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <ClipboardList className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">
                      Attendance rate
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {summary.attendance_rate != null
                      ? `${summary.attendance_rate}%`
                      : "—"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#E5E5E5] bg-white">
        <CardHeader>
          <CardTitle className="text-base">Recent submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryQ.isLoading && (
            <p className="text-sm text-neutral-500">Loading…</p>
          )}
          {!summaryQ.isLoading &&
            (!summary?.recent_submissions?.length ? (
              <p className="text-sm text-neutral-500">No recent submissions.</p>
            ) : (
              <ul className="divide-y divide-[#E5E5E5]">
                {summary.recent_submissions.map((item, i) => (
                  <li key={i} className="flex justify-between gap-4 py-3 text-sm">
                    <div>
                      <span className="font-medium capitalize text-black">
                        {item.type}
                      </span>
                      <p className="text-neutral-600">{item.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-neutral-500">
                      {item.submitted_at
                        ? formatDistanceToNow(parseISO(item.submitted_at), {
                            addSuffix: true,
                          })
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

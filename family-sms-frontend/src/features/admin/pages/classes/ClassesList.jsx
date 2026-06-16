import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { deleteClass, fetchClassesList } from "@/api/classes";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SectionError from "@/components/shared/SectionError";

import CreateClassModal from "./CreateClassModal";

function CardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-lg bg-neutral-200" />
      ))}
    </div>
  );
}

export default function ClassesList() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteClassTarget, setDeleteClassTarget] = useState(null);

  const classesQ = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { results } = await fetchClassesList();
      return results;
    },
  });

  const classes = classesQ.data ?? [];

  const deleteMut = useMutation({
    mutationFn: (id) => deleteClass(id),
    onSuccess: () => {
      toast.success("Class deleted");
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["admin", "classes-list"] });
      qc.invalidateQueries({ queryKey: ["admin", "metrics", "classes-count"] });
      setDeleteClassTarget(null);
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Could not delete class."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-black">Classes</h1>
        <Button
          variant="outline"
          className="border-black text-black hover:bg-black hover:text-white"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Class
        </Button>
      </div>

      {classesQ.isLoading && <CardSkeleton />}
      {classesQ.isError && (
        <SectionError
          message="Could not load classes."
          onRetry={() => classesQ.refetch()}
        />
      )}
      {!classesQ.isLoading && !classesQ.isError && classes.length === 0 && (
        <p className="py-16 text-center text-sm text-neutral-500">No classes yet</p>
      )}
      {!classesQ.isLoading && !classesQ.isError && classes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const pct = parseFloat(cls.today_attendance_percent) || 0;
            return (
              <Card
                key={cls.id}
                className="h-full border-[#E5E5E5] bg-white transition-shadow hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Link
                      to={`/admin/classes/${cls.id}`}
                      className="text-xl font-bold text-black hover:underline"
                    >
                      {cls.name}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete class"
                      className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleteClassTarget(cls)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                    <p className="mt-2 text-sm">
                      {cls.teacher_name ? (
                        <span className="text-neutral-700">{cls.teacher_name}</span>
                      ) : (
                        <span className="font-medium text-amber-600">
                          No teacher assigned
                        </span>
                      )}
                    </p>
                    <p className="mt-3 text-sm text-neutral-600">
                      {cls.student_count ?? 0} students
                    </p>
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-neutral-500">
                        <span>{"Today's attendance"}</span>
                        <span className="font-medium text-black">{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-black transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateClassModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ConfirmDeleteDialog
        open={!!deleteClassTarget}
        onClose={() => setDeleteClassTarget(null)}
        title="Delete class?"
        description={
          deleteClassTarget
            ? deleteClassTarget.student_count > 0
              ? `${deleteClassTarget.name} has ${deleteClassTarget.student_count} student(s). Remove or reassign them before deleting.`
              : `This permanently removes ${deleteClassTarget.name}. This cannot be undone.`
            : ""
        }
        isPending={deleteMut.isPending}
        confirmDisabled={(deleteClassTarget?.student_count ?? 0) > 0}
        onConfirm={() => deleteMut.mutate(deleteClassTarget.id)}
      />
    </div>
  );
}

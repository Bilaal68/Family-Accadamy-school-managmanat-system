import { useAuth } from "./useAuth";

/**
 * Returns the teacher's single assigned class from auth/me.
 * Teachers must never pass a different class id in API calls.
 */
export function useTeacherClass() {
  const { user } = useAuth();
  const assigned = user?.assigned_class ?? null;

  return {
    classId: assigned?.id ?? null,
    className: assigned?.name ?? null,
    hasClass: Boolean(assigned?.id),
    user,
  };
}

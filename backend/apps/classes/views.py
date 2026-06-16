from django.db.models import Avg, Count, Q, Value
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin
from apps.classes.models import SchoolClass
from apps.classes.permissions import (
    IsAdminOrTeacherOfClass,
    IsAdminOrTeacherOfClassOrParent,
)
from apps.classes.serializers import (
    LeaderboardEntrySerializer,
    SchoolClassDetailSerializer,
    SchoolClassListSerializer,
    SchoolClassWriteSerializer,
    StudentBriefSerializer,
    build_leaderboard,
)
from apps.students.models import Student


class SchoolClassViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = SchoolClass.objects.annotate(student_count=Count("students"))

    def get_queryset(self):
        return SchoolClass.objects.annotate(student_count=Count("students"))

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return SchoolClassWriteSerializer
        if self.action == "retrieve":
            return SchoolClassDetailSerializer
        if self.action == "list":
            return SchoolClassListSerializer
        return SchoolClassWriteSerializer

    def get_permissions(self):
        if self.action in ("students",):
            return [IsAdminOrTeacherOfClass()]
        if self.action == "leaderboard":
            return [IsAdminOrTeacherOfClassOrParent()]
        return [IsAdmin()]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset().select_related("class_teacher__user")
        serializer = SchoolClassListSerializer(queryset, many=True)
        return Response(
            {"count": queryset.count(), "results": serializer.data}
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        school_class = serializer.save()
        teacher_id = request.data.get("teacher_id")
        if teacher_id:
            from apps.teachers.models import Teacher

            teacher = get_object_or_404(Teacher, pk=teacher_id)
            if Teacher.objects.filter(assigned_class=school_class).exists():
                return Response(
                    {"detail": "Class created but already has a teacher."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if teacher.assigned_class_id:
                return Response(
                    {
                        "detail": (
                            "Class created but teacher already has another class."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            teacher.assigned_class = school_class
            teacher.save(update_fields=["assigned_class"])
        output = SchoolClassDetailSerializer(
            SchoolClass.objects.annotate(student_count=Count("students"))
            .select_related("class_teacher__user")
            .prefetch_related("students")
            .get(pk=school_class.pk)
        )
        return Response(output.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = SchoolClassDetailSerializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.students.exists():
            return Response(
                {
                    "detail": (
                        "Cannot delete this class while it has students. "
                        "Remove or reassign students first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _ensure_class_access(self, request, school_class):
        if request.user.role == CustomUser.Role.SUPER_ADMIN:
            return
        if request.user.role == CustomUser.Role.CLASS_TEACHER:
            try:
                teacher = request.user.teacher_profile
            except Exception:
                raise PermissionDenied("Teacher profile not found.") from None
            if teacher.assigned_class_id != school_class.pk:
                raise PermissionDenied("You can only access your assigned class.")
            return
        self.check_object_permissions(request, school_class)

    @action(detail=True, methods=["get"], url_path="students")
    def students(self, request, pk=None):
        school_class = self.get_object()
        self._ensure_class_access(request, school_class)
        students = Student.objects.filter(school_class=school_class).order_by(
            "full_name"
        )
        serializer = StudentBriefSerializer(students, many=True)
        data = serializer.data
        return Response({"count": len(data), "results": data})

    @action(detail=True, methods=["get"], url_path="leaderboard")
    def leaderboard(self, request, pk=None):
        try:
            school_class = self.get_object()
            if request.user.role == CustomUser.Role.PARENT:
                self.check_object_permissions(request, school_class)
            else:
                self._ensure_class_access(request, school_class)
            entries = build_leaderboard(school_class)

            if request.user.role == CustomUser.Role.PARENT:
                from apps.students.models import StudentParent

                child_ids = set(
                    StudentParent.objects.filter(
                        parent=request.user, student__school_class=school_class
                    ).values_list("student_id", flat=True)
                )
                my_children = [e for e in entries if e["student_id"] in child_ids]
                serializer = LeaderboardEntrySerializer(my_children, many=True)
                return Response({"my_children": serializer.data})

            serializer = LeaderboardEntrySerializer(entries, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

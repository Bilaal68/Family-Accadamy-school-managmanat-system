from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Avg, Q
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin
from apps.attendance.models import AttendanceRecord
from apps.classes.models import SchoolClass
from apps.grades.models import MarkEntry
from apps.teachers.models import Teacher
from apps.teachers.serializers import (
    AssignClassSerializer,
    TeacherCreateSerializer,
    TeacherDetailSerializer,
    TeacherListSerializer,
    TeacherUpdateSerializer,
)


class TeacherViewSet(viewsets.ModelViewSet):
    """
    Manage teacher records and assignments. Admin only.
    Supports creating, updating, and deleting teacher accounts.
    """
    queryset = Teacher.objects.select_related("user", "assigned_class")
    permission_classes = [IsAdmin]
    http_method_names = ["get", "post", "put", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return TeacherCreateSerializer
        if self.action in ("update", "partial_update"):
            return TeacherUpdateSerializer
        if self.action == "retrieve":
            return TeacherDetailSerializer
        return TeacherListSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = TeacherListSerializer(queryset, many=True)
        return Response(
            {"count": queryset.count(), "results": serializer.data}
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save()
        output = TeacherDetailSerializer(teacher, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save()
        return Response(TeacherDetailSerializer(teacher).data)

    def destroy(self, request, *args, **kwargs):
        teacher = self.get_object()
        user = teacher.user
        if AttendanceRecord.objects.filter(
            Q(marked_by=user) | Q(approved_by=user)
        ).exists():
            return Response(
                {
                    "detail": (
                        "Cannot delete this teacher because they have "
                        "attendance records on file."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if MarkEntry.objects.filter(
            Q(submitted_by=user) | Q(approved_by=user)
        ).exists():
            return Response(
                {
                    "detail": (
                        "Cannot delete this teacher because they have "
                        "mark records on file."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        teacher.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], url_path="summary")
    def summary(self, request, pk=None):
        teacher = self.get_object()
        payload = {
            "class_average": None,
            "attendance_rate": None,
            "recent_submissions": [],
        }
        if not teacher.assigned_class_id:
            return Response(payload)

        school_class = teacher.assigned_class
        marks = MarkEntry.objects.filter(
            student__school_class=school_class,
            approved_at__isnull=False,
        )
        avg = marks.aggregate(avg=Avg("score"))["avg"]
        if avg is not None:
            payload["class_average"] = float(round(avg, 2))

        records = AttendanceRecord.objects.filter(school_class=school_class)
        total = records.count()
        if total:
            present = records.filter(
                status=AttendanceRecord.Status.PRESENT
            ).count()
            payload["attendance_rate"] = round(present * 100 / total, 1)

        recent = []
        for entry in (
            MarkEntry.objects.filter(
                student__school_class=school_class,
                submitted_at__isnull=False,
            )
            .select_related("student")
            .order_by("-submitted_at")[:5]
        ):
            recent.append(
                {
                    "type": "marks",
                    "description": (
                        f"Marks for {entry.student.full_name} — "
                        f"{entry.subject} ({entry.get_semester_display()})"
                    ),
                    "submitted_at": entry.submitted_at,
                }
            )

        seen_dates = set()
        for record in (
            AttendanceRecord.objects.filter(
                school_class=school_class,
                submitted_at__isnull=False,
            )
            .order_by("-submitted_at")
        ):
            key = (record.date, record.submitted_at)
            if key in seen_dates:
                continue
            seen_dates.add(key)
            recent.append(
                {
                    "type": "attendance",
                    "description": f"Attendance for {record.date}",
                    "submitted_at": record.submitted_at,
                }
            )
            if len([r for r in recent if r["type"] == "attendance"]) >= 5:
                break

        recent.sort(key=lambda item: item["submitted_at"], reverse=True)
        payload["recent_submissions"] = recent[:5]
        return Response(payload)

    @action(detail=True, methods=["post", "delete"], url_path="assign-class")
    def assign_class(self, request, pk=None):
        teacher = self.get_object()

        if request.method == "DELETE":
            if not teacher.assigned_class_id:
                return Response(
                    {"detail": "This teacher has no class assignment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            teacher.assigned_class = None
            teacher.save(update_fields=["assigned_class"])
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = AssignClassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        school_class = get_object_or_404(
            SchoolClass, pk=serializer.validated_data["class_id"]
        )

        if Teacher.objects.filter(assigned_class=school_class).exclude(pk=teacher.pk).exists():
            return Response(
                {"detail": "This class already has a teacher assigned."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if teacher.assigned_class_id:
            return Response(
                {
                    "detail": (
                        "This teacher already has a class assigned. "
                        "Remove the current assignment before assigning a new class."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        teacher.assigned_class = school_class
        try:
            teacher.save()
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.message_dict if hasattr(exc, "message_dict") else str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(TeacherDetailSerializer(teacher).data)

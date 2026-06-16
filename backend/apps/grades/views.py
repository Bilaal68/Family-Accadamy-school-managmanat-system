from decimal import Decimal

from django.db.models import Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin
from apps.classes.models import SchoolClass
from apps.grades.models import MarkEntry, SemesterChoices
from apps.grades.permissions import (
    IsAdminOrTeacherMarking,
    IsTeacherOnly,
    can_access_student_mark,
    filter_marks_queryset,
)
from apps.grades.serializers import (
    ClassAveragesSerializer,
    MarkEntrySerializer,
    MarkEntryWriteSerializer,
    StudentAverageSerializer,
)
from apps.notifications.models import Notification
from apps.notifications.services import notify_admins


class MarkEntryView(APIView):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdminOrTeacherMarking()]

    def get(self, request):
        try:
            queryset = MarkEntry.objects.select_related(
                "student", "student__school_class", "submitted_by"
            )
            queryset = filter_marks_queryset(queryset, request.user)

            class_id = request.query_params.get("class")
            student_id = request.query_params.get("student")
            semester = request.query_params.get("semester")
            subject = request.query_params.get("subject")
            status_param = request.query_params.get("status")

            if class_id:
                queryset = queryset.filter(student__school_class_id=class_id)
            if student_id:
                queryset = queryset.filter(student_id=student_id)
            if semester:
                queryset = queryset.filter(semester=semester)
            if subject:
                queryset = queryset.filter(subject=subject)

            # Handle status filtering
            if status_param == "pending":
                queryset = queryset.filter(
                    submitted_at__isnull=False,
                    approved_at__isnull=True,
                )
            elif status_param == "approved":
                queryset = queryset.filter(approved_at__isnull=False)

            return Response(MarkEntrySerializer(queryset, many=True).data)
        except Exception as e:
            return Response(
                {"detail": f"Error fetching grades: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        try:
            serializer = MarkEntryWriteSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            student = serializer.validated_data["student"]
            semester = serializer.validated_data.get("semester")
            
            # Prevent teachers from manually entering FINAL marks
            if semester == SemesterChoices.FINAL and request.user.role == CustomUser.Role.CLASS_TEACHER:
                return Response(
                    {"detail": "Final marks are calculated automatically from Semester 1 and 2."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            
            if not can_access_student_mark(request.user, student):
                return Response(
                    {"detail": "You cannot enter marks for this student."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Check if mark already exists for this student+subject+semester
            existing = MarkEntry.objects.filter(
                student=student,
                subject=serializer.validated_data["subject"],
                semester=serializer.validated_data["semester"]
            ).first()

            if existing:
                # Update existing mark
                existing.score = serializer.validated_data["score"]
                existing.remarks = serializer.validated_data.get("remarks", "")
                existing.submitted_by = request.user
                existing.save()
                mark = existing
            else:
                # Create new mark
                mark = MarkEntry.objects.create(
                    student=student,
                    subject=serializer.validated_data["subject"],
                    semester=serializer.validated_data["semester"],
                    score=serializer.validated_data["score"],
                    remarks=serializer.validated_data.get("remarks", ""),
                    submitted_by=request.user,
                )
            
            return Response(
                MarkEntrySerializer(mark).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"detail": f"Error saving mark: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SubmitMarksView(APIView):
    permission_classes = [IsTeacherOnly]

    def post(self, request):
        teacher = request.user.teacher_profile
        if not teacher.assigned_class_id:
            return Response(
                {"detail": "You are not assigned to a class."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Get semester and subject from request
        semester = request.data.get("semester")
        subject = request.data.get("subject")
        
        if not semester or not subject:
            return Response(
                {"detail": "semester and subject are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        now = timezone.now()
        updated = MarkEntry.objects.filter(
            student__school_class_id=teacher.assigned_class_id,
            subject=subject,
            semester=semester,
            submitted_at__isnull=True,
        ).update(submitted_at=now)

        # Create notification for admins
        admin_users = CustomUser.objects.filter(role=CustomUser.Role.SUPER_ADMIN)
        for admin in admin_users:
            Notification.objects.create(
                recipient=admin,
                title="Marks submitted for approval",
                message=(
                    f"{request.user.full_name} submitted {subject} marks for "
                    f"{teacher.assigned_class.name} — {semester}"
                ),
                notification_type="MARKS_SUBMITTED",
                related_class_id=teacher.assigned_class_id,
                related_subject=subject,
                related_semester=semester,
            )

        notify_admins(
            title="Marks submitted for approval",
            message=(
                f"{request.user.full_name} submitted {subject} marks for "
                f"{teacher.assigned_class.name} — {semester}"
            ),
        )
        return Response(
            {"detail": f"Submitted {updated} mark entries.", "submitted_at": now},
            status=status.HTTP_200_OK,
        )


class ApproveMarkView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        mark = get_object_or_404(MarkEntry, pk=pk)
        if not mark.submitted_at:
            return Response(
                {"detail": "Marks must be submitted before approval."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if mark.approved_at:
            return Response(
                {"detail": "Mark entry is already approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        mark.approved_by = request.user
        mark.approved_at = now
        mark.save(update_fields=["approved_by", "approved_at", "updated_at"])
        return Response(MarkEntrySerializer(mark).data)


class MarkAveragesView(APIView):
    permission_classes = [IsAdminOrTeacherMarking]

    def get(self, request):
        class_id = request.query_params.get("class")
        if request.user.role == CustomUser.Role.CLASS_TEACHER:
            class_id = request.user.teacher_profile.assigned_class_id
        if not class_id:
            return Response(
                {"detail": "class query parameter is required for admin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        school_class = get_object_or_404(SchoolClass, pk=class_id)
        if request.user.role == CustomUser.Role.CLASS_TEACHER:
            if request.user.teacher_profile.assigned_class_id != school_class.pk:
                return Response(status=status.HTTP_403_FORBIDDEN)

        semester = request.query_params.get("semester")
        marks = MarkEntry.objects.filter(
            student__school_class=school_class,
            approved_at__isnull=False,
        )
        if semester:
            marks = marks.filter(semester=semester)

        student_averages = []
        class_total = Decimal("0")
        student_count = 0

        students = school_class.students.filter(is_active=True)
        for student in students:
            avg = marks.filter(student=student).aggregate(average=Avg("score"))["average"]
            average = Decimal(avg or 0).quantize(Decimal("0.01"))
            student_averages.append(
                {
                    "student_id": student.id,
                    "student_name": student.full_name,
                    "average": average,
                }
            )
            if avg is not None:
                class_total += average
                student_count += 1

        class_average = (
            (class_total / student_count).quantize(Decimal("0.01"))
            if student_count
            else Decimal("0.00")
        )

        payload = {
            "class_id": school_class.id,
            "class_name": school_class.name,
            "class_average": class_average,
            "students": student_averages,
        }
        return Response(ClassAveragesSerializer(payload).data)

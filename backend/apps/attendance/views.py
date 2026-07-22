from datetime import timedelta

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin
from apps.attendance.models import AttendanceChangeLog, AttendanceRecord
from apps.attendance.permissions import (
    CanViewAttendance,
    IsAdminOrTeacherMarking,
    IsAdminOrTeacherOfRecord,
    filter_attendance_queryset,
)
from apps.attendance.serializers import (
    AttendanceExportSerializer,
    AttendanceMarkSerializer,
    AttendanceRecordSerializer,
    AttendanceSendParentsSerializer,
    AttendanceUpdateSerializer,
)
from apps.attendance.services import build_attendance_export
from apps.attendance.tasks import export_attendance_task, send_attendance_to_parents_task
from apps.grades.permissions import IsTeacherOnly
from apps.notifications.services import notify_admins
from apps.students.models import Student


class MarkAttendanceView(APIView):
    """
    Mark daily attendance for students. Admins can mark for all classes.
    Teachers can mark only for their assigned class.
    """
    permission_classes = [IsAdminOrTeacherMarking]

    def post(self, request):
        serializer = AttendanceMarkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        today = timezone.localdate()
        saved = []

        for entry in serializer.validated_data["entries"]:
            student = get_object_or_404(Student, pk=entry["student_id"])
            if request.user.role == CustomUser.Role.CLASS_TEACHER:
                teacher_class = request.user.teacher_profile.assigned_class_id
                if student.school_class_id != teacher_class:
                    return Response(
                        {
                            "detail": (
                                f"You cannot mark attendance for {student.full_name}."
                            )
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

            record, _ = AttendanceRecord.objects.update_or_create(
                student=student,
                date=today,
                defaults={
                    "school_class": student.school_class,
                    "status": entry["status"],
                    "marked_by": request.user,
                },
            )
            saved.append(record)

        return Response(
            AttendanceRecordSerializer(saved, many=True).data,
            status=status.HTTP_200_OK,
        )


class AttendanceListView(APIView):
    """
    Retrieve attendance records with filtering by class, student, date, or date range.
    Returns records based on user role permissions.
    """
    permission_classes = [IsAuthenticated, CanViewAttendance]

    def get(self, request):
        queryset = AttendanceRecord.objects.select_related(
            "student", "school_class", "marked_by"
        )
        queryset = filter_attendance_queryset(queryset, request.user)

        class_id = request.query_params.get("class")
        student_id = request.query_params.get("student")
        date_param = request.query_params.get("date")
        month_param = request.query_params.get("month")
        date_range = request.query_params.get("date_range")

        if class_id:
            queryset = queryset.filter(school_class_id=class_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        if date_range == "last7days":
            if date_param and date_param != "today":
                end_date = parse_date(date_param) or timezone.localdate()
            else:
                end_date = timezone.localdate()
            start_date = end_date - timedelta(days=6)
            queryset = queryset.filter(date__gte=start_date, date__lte=end_date)
        elif date_param == "today":
            queryset = queryset.filter(date=timezone.localdate())
        elif date_param:
            queryset = queryset.filter(date=date_param)

        status_param = request.query_params.get("status")
        if status_param == "pending":
            queryset = queryset.filter(
                submitted_at__isnull=False,
                approved_at__isnull=True,
            )

        if month_param:
            try:
                year, month = map(int, month_param.split("-"))
                queryset = queryset.filter(date__year=year, date__month=month)
            except ValueError:
                return Response(
                    {"detail": "month must be in YYYY-MM format."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(
            AttendanceRecordSerializer(queryset, many=True).data
        )


class AttendanceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTeacherOfRecord]

    def put(self, request, pk):
        record = get_object_or_404(AttendanceRecord, pk=pk)
        self.check_object_permissions(request, record)
        old_status = record.status
        serializer = AttendanceUpdateSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        if old_status != record.status:
            AttendanceChangeLog.objects.create(
                attendance_record=record,
                changed_by=request.user,
                old_status=old_status,
                new_status=record.status,
            )
        return Response(AttendanceRecordSerializer(record).data)


class SubmitAttendanceView(APIView):
    permission_classes = [IsTeacherOnly]

    def post(self, request):
        teacher = request.user.teacher_profile
        if not teacher.assigned_class_id:
            return Response(
                {"detail": "You are not assigned to a class."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        today = timezone.localdate()
        now = timezone.now()
        updated = AttendanceRecord.objects.filter(
            school_class_id=teacher.assigned_class_id,
            date=today,
            submitted_at__isnull=True,
        ).update(submitted_at=now)

        notify_admins(
            title="Attendance submitted for approval",
            message=(
                f"{request.user.full_name} submitted attendance for "
                f"{teacher.assigned_class.name} on {today} ({updated} records)."
            ),
        )
        return Response(
            {"detail": f"Submitted {updated} attendance records.", "submitted_at": now},
            status=status.HTTP_200_OK,
        )


class ApproveAttendanceView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        record = get_object_or_404(AttendanceRecord, pk=pk)
        if not record.submitted_at:
            return Response(
                {"detail": "Attendance must be submitted before approval."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if record.approved_at:
            return Response(
                {"detail": "Attendance record is already approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        record.approved_by = request.user
        record.approved_at = now
        record.save(update_fields=["approved_by", "approved_at", "updated_at"])
        return Response(AttendanceRecordSerializer(record).data)


class ExportAttendanceView(APIView):
    permission_classes = [IsAdminOrTeacherMarking]

    def post(self, request):
        serializer = AttendanceExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        class_id = serializer.validated_data.get("class_id")
        if request.user.role == CustomUser.Role.CLASS_TEACHER:
            class_id = request.user.teacher_profile.assigned_class_id
        elif not class_id:
            return Response(
                {"detail": "class_id is required for admin export."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        date_from = serializer.validated_data.get("date_from") or timezone.localdate()
        date_to = serializer.validated_data.get("date_to") or date_from

        buffer, filename, _ = build_attendance_export(class_id, date_from, date_to)
        response = HttpResponse(
            buffer.getvalue(),
            content_type=(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ),
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class SendAttendanceParentsView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = AttendanceSendParentsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        class_id = serializer.validated_data["class_id"]
        date_from = serializer.validated_data.get("date_from") or timezone.localdate()
        date_to = serializer.validated_data.get("date_to") or date_from
        task = send_attendance_to_parents_task.delay(
            str(class_id), str(date_from), str(date_to)
        )
        return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)



class MarkTeacherAttendanceView(APIView):
    """Mark teacher attendance - Admin only"""
    permission_classes = [IsAdmin]

    def post(self, request):
        from apps.attendance.serializers import TeacherAttendanceMarkSerializer, TeacherAttendanceSerializer
        from apps.attendance.models import TeacherAttendance
        from apps.teachers.models import Teacher
        
        serializer = TeacherAttendanceMarkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        today = timezone.localdate()
        saved = []

        for entry in serializer.validated_data["entries"]:
            teacher = get_object_or_404(Teacher, pk=entry["teacher_id"])
            
            record, _ = TeacherAttendance.objects.update_or_create(
                teacher=teacher,
                date=today,
                defaults={
                    "status": entry["status"],
                    "notes": entry.get("notes", ""),
                    "marked_by": request.user,
                },
            )
            saved.append(record)

        return Response(
            TeacherAttendanceSerializer(saved, many=True).data,
            status=status.HTTP_200_OK,
        )


class TeacherAttendanceListView(APIView):
    """List teacher attendance records"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.attendance.serializers import TeacherAttendanceSerializer
        from apps.attendance.models import TeacherAttendance
        
        queryset = TeacherAttendance.objects.select_related("teacher", "marked_by")

        teacher_id = request.query_params.get("teacher")
        date_param = request.query_params.get("date")
        month_param = request.query_params.get("month")

        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)

        if date_param == "today":
            queryset = queryset.filter(date=timezone.localdate())
        elif date_param:
            queryset = queryset.filter(date=date_param)

        if month_param:
            try:
                year, month = map(int, month_param.split("-"))
                queryset = queryset.filter(date__year=year, date__month=month)
            except ValueError:
                return Response(
                    {"detail": "month must be in YYYY-MM format."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(TeacherAttendanceSerializer(queryset, many=True).data)


class TeacherAttendanceTodaySummaryView(APIView):
    """Get today's teacher attendance summary"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.teachers.models import Teacher
        from apps.attendance.models import TeacherAttendance
        
        today = timezone.localdate()
        
        # Get total active teachers
        total_teachers = Teacher.objects.filter(user__is_active=True).count()
        
        # Get present teachers today
        present_count = TeacherAttendance.objects.filter(
            date=today,
            status=TeacherAttendance.Status.PRESENT
        ).count()
        
        return Response({
            "total": total_teachers,
            "present": present_count,
            "date": today
        })


class AttendanceReportView(APIView):
    """
    Generate an attendance report with records, presence percentages, and status.
    Supports filtering by class and month.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        try:
            from apps.students.models import Student
            
            class_id = request.query_params.get('class')
            month = request.query_params.get('month')
            
            # Filter attendance records
            queryset = AttendanceRecord.objects.filter(approved_at__isnull=False)
            if class_id:
                queryset = queryset.filter(student__school_class_id=class_id)
            if month:
                queryset = queryset.filter(date__startswith=month)
            
            # Get students
            if class_id:
                students = Student.objects.filter(school_class_id=class_id, is_active=True)
            else:
                students = Student.objects.filter(is_active=True)
            
            data = []
            for student in students:
                student_records = queryset.filter(student=student)
                total = student_records.count()
                present = student_records.filter(status='PRESENT').count()
                absent = student_records.filter(status='ABSENT').count()
                late = student_records.filter(status='LATE').count()
                
                if total > 0:
                    percentage = round((present / total) * 100, 1)
                else:
                    percentage = 0
                
                # Status: Good (80%+), Warning (60-79%), Critical (<60%)
                if percentage >= 80:
                    status_label = 'Good'
                elif percentage >= 60:
                    status_label = 'Warning'
                else:
                    status_label = 'Critical'
                
                data.append({
                    'student_id': str(student.id),
                    'student_name': student.full_name,
                    'student_id_display': student.student_id,
                    'class_name': student.school_class.name if student.school_class else '—',
                    'total_days': total,
                    'present': present,
                    'absent': absent,
                    'late': late,
                    'percentage': percentage,
                    'status': status_label
                })
            
            return Response({
                'generated_at': timezone.now().isoformat(),
                'filters': {'class': class_id, 'month': month},
                'total_students': len(data),
                'data': data
            })
        except Exception as e:
            return Response(
                {'detail': f'Error generating attendance report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

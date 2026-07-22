from decimal import Decimal

from django.db.models import Avg, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin
from apps.classes.models import SchoolClass
from apps.grades.models import MarkEntry, SemesterChoices, Subject, AssessmentTypeChoices
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
    SubjectSerializer,
    SubjectSummarySerializer,
)
from apps.notifications.models import Notification
from apps.notifications.services import notify_admins


class MarkEntryView(APIView):
    """
    Manage student grades/marks. Teachers submit marks for their class.
    Admins review and approve submitted marks. Supports filtering by class, student, semester, and subject.
    """
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
            assessment_type = request.query_params.get("assessment_type")
            status_param = request.query_params.get("status")

            if class_id:
                queryset = queryset.filter(student__school_class_id=class_id)
            if student_id:
                queryset = queryset.filter(student_id=student_id)
            if semester:
                queryset = queryset.filter(semester=semester)
            if subject:
                queryset = queryset.filter(subject=subject)
            if assessment_type:
                queryset = queryset.filter(assessment_type=assessment_type)

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
            assessment_type = serializer.validated_data.get("assessment_type", "TEST")
            
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

            # Check if mark already exists for this student+subject+semester+assessment_type
            existing = MarkEntry.objects.filter(
                student=student,
                subject=serializer.validated_data["subject"],
                semester=serializer.validated_data["semester"],
                assessment_type=assessment_type
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
                    assessment_type=assessment_type,
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
        try:
            teacher = request.user.teacher_profile
            if not teacher.assigned_class_id:
                return Response(
                    {"detail": "You are not assigned to a class."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Get semester, subject and assessment_type from request
            semester = request.data.get("semester")
            subject = request.data.get("subject")
            assessment_type = request.data.get("assessment_type")
            
            if not semester or not subject:
                return Response(
                    {"detail": "semester and subject are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            now = timezone.now()
            
            # Filter by assessment_type if provided
            filter_params = {
                "student__school_class_id": teacher.assigned_class_id,
                "subject": subject,
                "semester": semester,
                "submitted_at__isnull": True,
                "score__isnull": False,  # Only marks with scores
            }
            if assessment_type:
                filter_params["assessment_type"] = assessment_type
            
            # Get marks before updating to check count
            marks_to_submit = MarkEntry.objects.filter(**filter_params)
            mark_count = marks_to_submit.count()
            
            if mark_count == 0:
                # Debug info
                debug_info = {
                    "teacher_class_id": str(teacher.assigned_class_id),
                    "subject": subject,
                    "semester": semester,
                    "assessment_type": assessment_type,
                    "looking_for_unsubmitted": "submitted_at__isnull=True",
                    "looking_for_scored": "score__isnull=False",
                }
                
                # Check if any marks exist at all
                all_marks = MarkEntry.objects.filter(
                    student__school_class_id=teacher.assigned_class_id,
                    subject=subject,
                    semester=semester,
                )
                if assessment_type:
                    all_marks = all_marks.filter(assessment_type=assessment_type)
                
                return Response(
                    {
                        "detail": "No marks to submit. Please save marks for at least one student first.",
                        "debug": {
                            "marks_found": all_marks.count(),
                            "params": debug_info,
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            updated = marks_to_submit.update(submitted_at=now)

            # Create notification for admins
            admin_users = CustomUser.objects.filter(role=CustomUser.Role.SUPER_ADMIN)
            assessment_label = f" ({assessment_type})" if assessment_type else ""
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    title="Marks submitted for approval",
                    message=(
                        f"{request.user.full_name} submitted {subject}{assessment_label} marks for "
                        f"{teacher.assigned_class.name} — {semester}"
                    ),
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
        except Exception as e:
            import traceback
            return Response(
                {"detail": f"Error submitting marks: {str(e)}", "traceback": traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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



class SubjectView(APIView):
    """
    Manage subjects. Teachers can create and view subjects.
    Admins can view, create, update, and delete subjects.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all active subjects"""
        try:
            subjects = Subject.objects.filter(is_active=True).order_by("name")
            serializer = SubjectSerializer(subjects, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"detail": f"Error fetching subjects: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Create a new subject"""
        try:
            name = request.data.get("name", "").strip()
            if not name:
                return Response(
                    {"detail": "Subject name is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Check if subject already exists (case-insensitive)
            if Subject.objects.filter(name__iexact=name).exists():
                return Response(
                    {"detail": "A subject with this name already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            subject = Subject.objects.create(
                name=name,
                created_by=request.user,
            )
            serializer = SubjectSerializer(subject)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": f"Error creating subject: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request):
        """Update a subject (name change)"""
        try:
            subject_id = request.data.get("id")
            new_name = request.data.get("name", "").strip()
            
            if not subject_id:
                return Response(
                    {"detail": "Subject ID is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            if not new_name:
                return Response(
                    {"detail": "Subject name is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            subject = get_object_or_404(Subject, pk=subject_id)
            
            # Check if another subject with this name exists
            if Subject.objects.filter(name__iexact=new_name).exclude(pk=subject_id).exists():
                return Response(
                    {"detail": "A subject with this name already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            subject.name = new_name
            subject.save()
            
            serializer = SubjectSerializer(subject)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"detail": f"Error updating subject: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request):
        """Soft delete a subject (set is_active to False)"""
        try:
            subject_id = request.query_params.get("id")
            
            if not subject_id:
                return Response(
                    {"detail": "Subject ID is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            subject = get_object_or_404(Subject, pk=subject_id)
            subject.is_active = False
            subject.save()
            
            return Response(
                {"detail": "Subject deleted successfully."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"detail": f"Error deleting subject: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SubjectSummaryView(APIView):
    """
    Get marks summary for a specific subject/class/semester.
    Returns student scores broken down by assessment type and calculates averages.
    """
    permission_classes = [IsAdminOrTeacherMarking]

    def get(self, request):
        try:
            class_id = request.query_params.get("class")
            semester = request.query_params.get("semester")
            subject = request.query_params.get("subject")
            
            if not class_id or not semester or not subject:
                return Response(
                    {"detail": "class, semester, and subject query parameters are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Verify access
            if request.user.role == CustomUser.Role.CLASS_TEACHER:
                if str(request.user.teacher_profile.assigned_class_id) != class_id:
                    return Response(
                        {"detail": "You can only view marks for your assigned class."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            
            # Get all approved marks for this class/semester/subject
            marks = MarkEntry.objects.filter(
                student__school_class_id=class_id,
                semester=semester,
                subject=subject,
                approved_at__isnull=False,
            ).select_related("student")
            
            if not marks.exists():
                return Response(
                    {
                        "students": [],
                        "avg_test": None,
                        "avg_quiz": None,
                        "avg_assignment": None,
                        "avg_project": None,
                        "avg_mid": None,
                        "avg_final": None,
                        "avg_homework": None,
                        "avg_participation": None,
                        "class_average": None,
                        "highest": None,
                        "lowest": None,
                        "pass_rate": None,
                    }
                )
            
            # Build student summary data
            students_data = {}
            for mark in marks:
                student_id = mark.student.id
                if student_id not in students_data:
                    students_data[student_id] = {
                        "student_id": student_id,
                        "student_name": mark.student.full_name,
                        "total": Decimal("0"),
                        "test_score": None,
                        "quiz_score": None,
                        "assignment_score": None,
                        "project_score": None,
                        "mid_score": None,
                        "final_score": None,
                        "homework_score": None,
                        "participation_score": None,
                        "count": 0,
                    }
                
                # Map assessment type to field
                assessment_map = {
                    AssessmentTypeChoices.TEST: "test_score",
                    AssessmentTypeChoices.QUIZ: "quiz_score",
                    AssessmentTypeChoices.ASSIGNMENT: "assignment_score",
                    AssessmentTypeChoices.PROJECT: "project_score",
                    AssessmentTypeChoices.MID_EXAM: "mid_score",
                    AssessmentTypeChoices.FINAL_EXAM: "final_score",
                    AssessmentTypeChoices.HOMEWORK: "homework_score",
                    AssessmentTypeChoices.PARTICIPATION: "participation_score",
                }
                
                field_name = assessment_map.get(mark.assessment_type)
                if field_name:
                    students_data[student_id][field_name] = mark.score
                
                # Add to total for overall average
                students_data[student_id]["total"] += mark.score
                students_data[student_id]["count"] += 1
            
            # Calculate totals and averages
            for student in students_data.values():
                if student["count"] > 0:
                    student["total"] = (student["total"] / student["count"]).quantize(Decimal("0.1"))
            
            # Calculate assessment type averages
            test_scores = [s["test_score"] for s in students_data.values() if s["test_score"] is not None]
            quiz_scores = [s["quiz_score"] for s in students_data.values() if s["quiz_score"] is not None]
            assignment_scores = [s["assignment_score"] for s in students_data.values() if s["assignment_score"] is not None]
            project_scores = [s["project_score"] for s in students_data.values() if s["project_score"] is not None]
            mid_scores = [s["mid_score"] for s in students_data.values() if s["mid_score"] is not None]
            final_scores = [s["final_score"] for s in students_data.values() if s["final_score"] is not None]
            homework_scores = [s["homework_score"] for s in students_data.values() if s["homework_score"] is not None]
            participation_scores = [s["participation_score"] for s in students_data.values() if s["participation_score"] is not None]
            
            avg_test = (sum(test_scores) / len(test_scores)).quantize(Decimal("0.1")) if test_scores else None
            avg_quiz = (sum(quiz_scores) / len(quiz_scores)).quantize(Decimal("0.1")) if quiz_scores else None
            avg_assignment = (sum(assignment_scores) / len(assignment_scores)).quantize(Decimal("0.1")) if assignment_scores else None
            avg_project = (sum(project_scores) / len(project_scores)).quantize(Decimal("0.1")) if project_scores else None
            avg_mid = (sum(mid_scores) / len(mid_scores)).quantize(Decimal("0.1")) if mid_scores else None
            avg_final = (sum(final_scores) / len(final_scores)).quantize(Decimal("0.1")) if final_scores else None
            avg_homework = (sum(homework_scores) / len(homework_scores)).quantize(Decimal("0.1")) if homework_scores else None
            avg_participation = (sum(participation_scores) / len(participation_scores)).quantize(Decimal("0.1")) if participation_scores else None
            
            # Calculate class average, highest, lowest, pass rate
            all_totals = [s["total"] for s in students_data.values()]
            class_average = (sum(all_totals) / len(all_totals)).quantize(Decimal("0.1")) if all_totals else None
            highest = max(all_totals).quantize(Decimal("0.1")) if all_totals else None
            lowest = min(all_totals).quantize(Decimal("0.1")) if all_totals else None
            
            # Pass rate (assuming 50 is passing score)
            passing_count = sum(1 for total in all_totals if total >= 50)
            pass_rate = (Decimal(passing_count) / Decimal(len(all_totals)) * 100).quantize(Decimal("0.1")) if all_totals else None
            
            payload = {
                "students": list(students_data.values()),
                "avg_test": avg_test,
                "avg_quiz": avg_quiz,
                "avg_assignment": avg_assignment,
                "avg_project": avg_project,
                "avg_mid": avg_mid,
                "avg_final": avg_final,
                "avg_homework": avg_homework,
                "avg_participation": avg_participation,
                "class_average": class_average,
                "highest": highest,
                "lowest": lowest,
                "pass_rate": pass_rate,
            }
            
            serializer = SubjectSummarySerializer(payload)
            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {"detail": f"Error fetching subject summary: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PerformanceReportView(APIView):
    """
    Generate a student performance report with marks, grades, and averages.
    Supports filtering by class, semester, and subject.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        try:
            from apps.students.models import Student
            
            class_id = request.query_params.get('class')
            semester = request.query_params.get('semester')
            subject = request.query_params.get('subject')
            
            # Get students
            if class_id:
                students = Student.objects.filter(school_class_id=class_id, is_active=True)
            else:
                students = Student.objects.filter(is_active=True)
            
            data = []
            for student in students:
                marks = MarkEntry.objects.filter(
                    student=student,
                    approved_at__isnull=False
                )
                if semester:
                    marks = marks.filter(semester=semester)
                if subject:
                    marks = marks.filter(subject=subject)
                
                subjects_data = {}
                for mark in marks:
                    subject_name = mark.subject.name if mark.subject else '—'
                    if subject_name not in subjects_data:
                        subjects_data[subject_name] = {}
                    subjects_data[subject_name][mark.assessment_type] = float(mark.score)
                
                overall_avg = marks.aggregate(avg=Avg('score'))['avg']
                
                # Determine grade
                if overall_avg:
                    overall_avg = round(float(overall_avg), 1)
                    if overall_avg >= 80:
                        grade = 'A'
                    elif overall_avg >= 70:
                        grade = 'B'
                    elif overall_avg >= 60:
                        grade = 'C'
                    elif overall_avg >= 50:
                        grade = 'D'
                    else:
                        grade = 'F'
                else:
                    overall_avg = 0
                    grade = '—'
                
                data.append({
                    'student_id': str(student.id),
                    'student_name': student.full_name,
                    'student_id_display': student.student_id,
                    'class_name': student.school_class.name if student.school_class else '—',
                    'subjects': subjects_data,
                    'overall_average': overall_avg,
                    'grade': grade
                })
            
            return Response({
                'generated_at': timezone.now().isoformat(),
                'filters': {'class': class_id, 'semester': semester, 'subject': subject},
                'total_students': len(data),
                'data': data
            })
        except Exception as e:
            return Response(
                {'detail': f'Error generating performance report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

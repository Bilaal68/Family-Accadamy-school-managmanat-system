from datetime import date

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin, IsAdminOrCashier
from apps.notifications.services import notify_admins
from apps.students.models import Student

from .models import EnrollmentRequest, EnrollmentStatus
from .services import save_enrollment_documents
from .serializers import (
    EnrollmentApproveSerializer,
    EnrollmentDetailSerializer,
    EnrollmentListSerializer,
    EnrollmentRejectSerializer,
    EnrollmentRequestCreateSerializer,
    EnrollmentReviewSerializer,
    EnrollmentStatsSerializer,
)


class EnrollmentApplyView(APIView):
    """
    Public endpoint to submit new enrollment request.
    Parents/guardians can apply for student admission without authentication.
    Notifies cashiers immediately upon submission.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EnrollmentRequestCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        save_enrollment_documents(enrollment, request.FILES)
        
        # Notify all cashiers immediately
        from apps.notifications.models import Notification
        cashiers = CustomUser.objects.filter(role='CASHIER', is_active=True)
        for cashier in cashiers:
            Notification.objects.create(
                user=cashier,
                title='New Enrollment',
                message=f"New enrollment application received from {enrollment.first_name} {enrollment.last_name} — Grade: {enrollment.grade_applying}",
            )
        
        return Response(
            {
                "admission_number": enrollment.admission_number,
                "message": "Application submitted successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class EnrollmentStatusView(APIView):
    """
    Public endpoint to check application status by admission number.
    No authentication required - parents can track their application.
    """
    permission_classes = [AllowAny]

    def get(self, request, admission_number):
        enrollment = get_object_or_404(
            EnrollmentRequest, admission_number=admission_number
        )
        data = {
            "admission_number": enrollment.admission_number,
            "status": enrollment.status,
            "full_name": f"{enrollment.first_name} {enrollment.last_name}",
            "created_at": enrollment.created_at,
        }
        if enrollment.status == EnrollmentStatus.APPROVED and enrollment.student:
            data["student_id"] = enrollment.student.student_id
        if enrollment.status == EnrollmentStatus.REJECTED and enrollment.rejection_reason:
            data["rejection_reason"] = enrollment.rejection_reason
        return Response(data)


class EnrollmentListView(APIView):
    """List all enrollment requests (Cashier/Admin only)"""
    permission_classes = [IsAuthenticated, IsAdminOrCashier]

    def get(self, request):
        queryset = EnrollmentRequest.objects.all()

        # Filter by status
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Search by name
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(admission_number__icontains=search)
            )

        queryset = queryset.order_by("-created_at")

        serializer = EnrollmentListSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)


class EnrollmentDetailView(APIView):
    """Full detail of one enrollment request (Cashier/Admin only)"""
    permission_classes = [IsAuthenticated, IsAdminOrCashier]

    def get(self, request, id):
        enrollment = get_object_or_404(EnrollmentRequest, id=id)
        serializer = EnrollmentDetailSerializer(
            enrollment, context={"request": request}
        )
        return Response(serializer.data)


class EnrollmentReviewView(APIView):
    """Cashier reviews and submits to admin"""
    permission_classes = [IsAuthenticated, IsAdminOrCashier]

    def patch(self, request, id):
        enrollment = get_object_or_404(EnrollmentRequest, id=id)
        if enrollment.status != EnrollmentStatus.PENDING:
            return Response(
                {"detail": "Only pending enrollments can be reviewed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = EnrollmentReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        enrollment.status = EnrollmentStatus.REVIEWED
        enrollment.reviewed_by = request.user
        enrollment.reviewed_at = timezone.now()

        if "cashier_notes" in serializer.validated_data:
            enrollment.cashier_notes = serializer.validated_data["cashier_notes"]
        if "payment_status" in serializer.validated_data:
            enrollment.payment_status = serializer.validated_data["payment_status"]
        if "registration_fee_paid" in serializer.validated_data:
            enrollment.registration_fee_paid = serializer.validated_data[
                "registration_fee_paid"
            ]
        if "tuition_plan" in serializer.validated_data:
            enrollment.tuition_plan = serializer.validated_data["tuition_plan"]
        if "scholarship_discount" in serializer.validated_data:
            enrollment.scholarship_discount = serializer.validated_data[
                "scholarship_discount"
            ]

        enrollment.save()

        # Notify admin
        notify_admins(
            title="New Enrollment Reviewed",
            message=f"Enrollment {enrollment.admission_number} for {enrollment.first_name} {enrollment.last_name} has been reviewed by cashier.",
        )

        serializer = EnrollmentDetailSerializer(
            enrollment, context={"request": request}
        )
        return Response(serializer.data)


class EnrollmentCashierRejectView(APIView):
    """Cashier immediately rejects enrollment"""
    permission_classes = [IsAuthenticated, IsAdminOrCashier]

    def patch(self, request, id):
        enrollment = get_object_or_404(EnrollmentRequest, id=id)
        
        if enrollment.status != EnrollmentStatus.PENDING:
            return Response(
                {"error": "Only pending enrollments can be rejected at this stage."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rejection_reason = request.data.get("rejection_reason", "").strip()
        if not rejection_reason:
            return Response(
                {"error": "Rejection reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment.status = EnrollmentStatus.REJECTED
        enrollment.rejection_reason = rejection_reason
        enrollment.reviewed_by = request.user
        enrollment.reviewed_at = timezone.now()
        enrollment.save()

        # Notify admins about rejection
        from apps.notifications.models import Notification
        admins = CustomUser.objects.filter(role='SUPER_ADMIN', is_active=True)
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title='Enrollment Rejected',
                message=f"{request.user.get_full_name()} rejected enrollment for {enrollment.first_name} {enrollment.last_name}. Reason: {rejection_reason}",
            )

        return Response(
            {
                "message": "Enrollment rejected.",
                "status": enrollment.status,
                "rejection_reason": enrollment.rejection_reason,
            }
        )


class EnrollmentApproveView(APIView):
    """Admin approves enrollment and creates student"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, id):
        enrollment = get_object_or_404(EnrollmentRequest, id=id)
        
        if enrollment.status != EnrollmentStatus.REVIEWED:
            return Response(
                {"detail": "Only reviewed enrollments can be approved"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if enrollment.student:
            return Response(
                {"detail": "Student already created for this enrollment"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find a matching class based on grade and section preference
        from apps.classes.models import SchoolClass
        
        # Normalize grade for flexible matching
        # "KG1" -> "kg1", "KG 1" -> "kg1", "Grade 1" -> "grade1", etc.
        def normalize_grade(grade_str):
            if not grade_str:
                return ""
            # Remove all spaces and convert to lowercase
            return grade_str.replace(" ", "").lower()
        
        # Check if this is a KG grade (KG1, KG2, KG3)
        def is_kg_grade(grade_str):
            normalized = normalize_grade(grade_str)
            return normalized.startswith("kg")
        
        enrollment_grade_normalized = normalize_grade(enrollment.grade_applying)
        is_kg = is_kg_grade(enrollment.grade_applying)
        
        school_class = None
        
        # Try to find matching class by normalized grade comparison
        all_classes = SchoolClass.objects.all()
        for cls in all_classes:
            cls_grade_normalized = normalize_grade(cls.grade)
            
            # Check if grades match (normalized)
            if cls_grade_normalized == enrollment_grade_normalized:
                # For KG grades, ignore section - just match by grade
                if is_kg:
                    school_class = cls
                    break
                # For other grades (Grade 1-4), try to match section if provided
                elif enrollment.section_preference:
                    if cls.section.lower() == enrollment.section_preference.lower():
                        school_class = cls
                        break
                else:
                    # No section preference, use first matching grade
                    school_class = cls
                    break
        
        if not school_class:
            # Show helpful message with available classes
            available_classes = list(SchoolClass.objects.values_list('name', 'grade', 'section'))
            available_str = ", ".join([f"{name} ({grade})" for name, grade, section in available_classes])
            return Response(
                {
                    "detail": f"No class found for grade '{enrollment.grade_applying}'. Available classes: {available_str or 'None'}. Please create a class or manually assign the student after approval."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create student from enrollment data
        try:
            student = Student.objects.create(
                full_name=f"{enrollment.first_name} {enrollment.middle_name} {enrollment.last_name}".strip(),
                date_of_birth=enrollment.date_of_birth,
                gender=enrollment.gender,
                photo=enrollment.photo,
                school_class=school_class,
                enrolled_at=date.today(),
            )
        except Exception as e:
            return Response(
                {"detail": f"Failed to create student: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment.status = EnrollmentStatus.APPROVED
        enrollment.approved_by = request.user
        enrollment.approved_at = timezone.now()
        enrollment.student = student
        enrollment.save()

        # Notify admin
        notify_admins(
            title="Enrollment Approved",
            message=f"Enrollment approved for {student.full_name}. Student ID: {student.student_id}",
        )

        return Response(
            {
                "student_id": str(student.id),
                "student_student_id": student.student_id,
                "message": f"Student created successfully and assigned to {school_class.name}",
            },
            status=status.HTTP_200_OK,
        )


class EnrollmentRejectView(APIView):
    """Admin rejects enrollment"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, id):
        enrollment = get_object_or_404(EnrollmentRequest, id=id)
        if enrollment.status == EnrollmentStatus.APPROVED:
            return Response(
                {"detail": "Cannot reject approved enrollment"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = EnrollmentRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        enrollment.status = EnrollmentStatus.REJECTED
        enrollment.rejection_reason = serializer.validated_data["rejection_reason"]
        enrollment.approved_by = request.user
        enrollment.approved_at = timezone.now()
        enrollment.save()

        # Notify cashier
        if enrollment.reviewed_by:
            from apps.notifications.models import Notification
            Notification.objects.create(
                user=enrollment.reviewed_by,
                title="Enrollment Rejected",
                message=f"Enrollment {enrollment.admission_number} for {enrollment.first_name} {enrollment.last_name} was rejected. Reason: {enrollment.rejection_reason}",
            )

        return Response({"message": "Enrollment rejected"})


class EnrollmentStatsView(APIView):
    """Returns enrollment statistics"""
    permission_classes = [IsAuthenticated, IsAdminOrCashier]

    def get(self, request):
        queryset = EnrollmentRequest.objects.all()
        pending = queryset.filter(status=EnrollmentStatus.PENDING).count()
        reviewed = queryset.filter(status=EnrollmentStatus.REVIEWED).count()
        approved = queryset.filter(status=EnrollmentStatus.APPROVED).count()
        rejected = queryset.filter(status=EnrollmentStatus.REJECTED).count()
        total = queryset.count()

        serializer = EnrollmentStatsSerializer(
            {
                "pending": pending,
                "reviewed": reviewed,
                "approved": approved,
                "rejected": rejected,
                "total": total,
            }
        )
        return Response(serializer.data)


class EnrollmentReportView(APIView):
    """
    Generate an enrollment report with application statistics and recent enrollments.
    Shows summary by status, breakdown by grade, and recent applications.
    """
    permission_classes = [IsAuthenticated, IsAdminOrCashier]

    def get(self, request):
        try:
            from django.db.models import Count
            
            total = EnrollmentRequest.objects.count()
            pending = EnrollmentRequest.objects.filter(status=EnrollmentStatus.PENDING).count()
            reviewed = EnrollmentRequest.objects.filter(status=EnrollmentStatus.REVIEWED).count()
            approved = EnrollmentRequest.objects.filter(status=EnrollmentStatus.APPROVED).count()
            rejected = EnrollmentRequest.objects.filter(status=EnrollmentStatus.REJECTED).count()
            
            # Breakdown by grade
            by_grade = EnrollmentRequest.objects.values('grade_applying').annotate(
                count=Count('id')
            ).order_by('grade_applying')
            
            # Recent enrollments (last 20)
            recent = EnrollmentRequest.objects.order_by('-created_at')[:20]
            recent_data = [{
                'admission_number': e.admission_number,
                'full_name': f"{e.first_name} {e.last_name}",
                'grade': e.grade_applying,
                'status': e.status,
                'payment_status': e.payment_status,
                'created_at': e.created_at.isoformat(),
            } for e in recent]
            
            return Response({
                'generated_at': timezone.now().isoformat(),
                'summary': {
                    'total': total,
                    'pending': pending,
                    'reviewed': reviewed,
                    'approved': approved,
                    'rejected': rejected,
                },
                'by_grade': list(by_grade),
                'recent_enrollments': recent_data,
            })
        except Exception as e:
            return Response(
                {'detail': f'Error generating enrollment report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

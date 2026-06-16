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
    """Public endpoint to submit new enrollment request"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EnrollmentRequestCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        save_enrollment_documents(enrollment, request.FILES)
        return Response(
            {
                "admission_number": enrollment.admission_number,
                "message": "Application submitted successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class EnrollmentStatusView(APIView):
    """Public endpoint to check application status by admission number"""
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
        
        school_class = None
        if enrollment.grade_applying and enrollment.section_preference:
            # Try to find exact match
            school_class = SchoolClass.objects.filter(
                grade__iexact=enrollment.grade_applying,
                section__iexact=enrollment.section_preference
            ).first()
        
        if not school_class and enrollment.grade_applying:
            # Try to find any class for the grade
            school_class = SchoolClass.objects.filter(
                grade__iexact=enrollment.grade_applying
            ).first()
        
        if not school_class:
            return Response(
                {
                    "detail": f"No class found for grade '{enrollment.grade_applying}'. Please create a class first or manually assign the student to a class after approval."
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

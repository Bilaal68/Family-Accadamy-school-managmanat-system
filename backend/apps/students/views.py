from django.db.models import Q
from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin
from apps.attendance.models import AttendanceRecord
from apps.grades.models import MarkEntry
from apps.behaviour.models import StudentRemark
from apps.behaviour.serializers import StudentRemarkSerializer
from apps.students.models import Student, StudentDeletionLog, StudentParent
from apps.students.permissions import CanAccessStudent
from apps.students.serializers import (
    AttendanceRecordSerializer,
    MarkEntrySerializer,
    LinkParentSerializer,
    ParentLinkSerializer,
    StudentDetailSerializer,
    StudentListSerializer,
    StudentWriteSerializer,
)
from django.http import HttpResponse
from apps.students.services import process_bulk_upload
from apps.students.id_card_service import (
    generate_single_student_id_pdf,
    generate_bulk_id_cards_pdf,
    generate_multi_items_id_cards_pdf,
    generate_id_card_front_image,
    generate_id_card_back_image,
)


class StudentPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class StudentFilter(filters.FilterSet):
    search = filters.CharFilter(method="filter_search")

    class Meta:
        model = Student
        fields = []

    @property
    def qs(self):
        queryset = super().qs
        class_id = self.data.get("class") or self.data.get("class_id")
        if class_id:
            queryset = queryset.filter(school_class_id=class_id)
        return queryset

    def filter_search(self, queryset, name, value):
        term = (value or "").strip()
        if not term:
            return queryset
        return queryset.filter(
            Q(full_name__icontains=term) | Q(student_id__icontains=term)
        )


class StudentViewSet(viewsets.ModelViewSet):
    """
    Manage student records. Admin has full access.
    Teachers can view students in their assigned class only.
    """
    queryset = Student.objects.select_related("school_class").prefetch_related(
        "parent_links__parent"
    )
    pagination_class = StudentPagination
    filterset_class = StudentFilter
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    http_method_names = ["get", "post", "put", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return StudentWriteSerializer
        if self.action == "retrieve":
            return StudentDetailSerializer
        return StudentListSerializer

    def get_permissions(self):
        admin_only = (
            "list",
            "create",
            "bulk_register",
            "update",
            "partial_update",
            "destroy",
            "link_parent",
        )
        if self.action in admin_only:
            return [IsAdmin()]
        return [IsAuthenticated(), CanAccessStudent()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = StudentListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        serializer = StudentDetailSerializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return Response(
            StudentDetailSerializer(student).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return Response(StudentDetailSerializer(student).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        StudentDeletionLog.objects.create(
            student_uuid=instance.id,
            student_code=instance.student_id,
            full_name=instance.full_name,
            deleted_by=request.user,
            snapshot={
                "date_of_birth": str(instance.date_of_birth),
                "gender": instance.gender,
                "class_id": str(instance.school_class_id),
                "class_name": instance.school_class.name,
                "enrolled_at": str(instance.enrolled_at),
                "is_active": instance.is_active,
            },
        )
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk",
        parser_classes=[MultiPartParser, FormParser],
    )
    def bulk_register(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response(
                {"detail": "No file uploaded. Use form field 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = process_bulk_upload(upload)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="link-parent")
    def link_parent(self, request, pk=None):
        student = self.get_object()
        serializer = LinkParentSerializer(
            data=request.data, context={"student": student}
        )
        serializer.is_valid(raise_exception=True)
        link = serializer.save()
        return Response(
            ParentLinkSerializer(link).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="attendance")
    def attendance(self, request, pk=None):
        student = self.get_object()
        self.check_object_permissions(request, student)
        records = AttendanceRecord.objects.filter(student=student)
        if request.user.role == CustomUser.Role.PARENT:
            records = records.filter(approved_at__isnull=False)
        serializer = AttendanceRecordSerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="grades")
    def grades(self, request, pk=None):
        student = self.get_object()
        self.check_object_permissions(request, student)
        records = MarkEntry.objects.filter(student=student)
        if request.user.role == CustomUser.Role.PARENT:
            records = records.filter(approved_at__isnull=False)
        serializer = MarkEntrySerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="remarks")
    def remarks(self, request, pk=None):
        student = self.get_object()
        self.check_object_permissions(request, student)
        notes = StudentRemark.objects.filter(student=student).select_related("author")
        serializer = StudentRemarkSerializer(notes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="id-card")
    def id_card(self, request, pk=None):
        """
        Download printable CR80 standard Student ID Card PDF (Front & Back).
        """
        student = self.get_object()
        self.check_object_permissions(request, student)
        academic_year = request.query_params.get("academic_year")
        pdf_bytes = generate_single_student_id_pdf(student, academic_year=academic_year)
        
        filename = f"ID_Card_{student.student_id}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=["get"], url_path="id-card-preview")
    def id_card_preview(self, request, pk=None):
        """
        Get image preview for Front or Back of Student ID Card (JPEG).
        Query param: ?side=front (default) or ?side=back
        """
        student = self.get_object()
        self.check_object_permissions(request, student)
        side = request.query_params.get("side", "front").lower()
        academic_year = request.query_params.get("academic_year")

        if side == "back":
            img = generate_id_card_back_image(student)
        else:
            img = generate_id_card_front_image(student, academic_year=academic_year)

        import io
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        return HttpResponse(buf.getvalue(), content_type="image/jpeg")

    @action(detail=False, methods=["get", "post"], url_path="bulk-id-cards")
    def bulk_id_cards(self, request):
        """
        Download multi-student ID card printable sheet PDF (A4 format).
        Accepts:
        - GET: ?class_id=<uuid>&academic_year=...
        - POST: {"student_ids": ["uuid1", "uuid2"], "academic_year": "..."}
        """
        academic_year = request.data.get("academic_year") if request.method == "POST" else request.query_params.get("academic_year")
        
        queryset = self.get_queryset()
        if request.method == "POST" and request.data.get("student_ids"):
            student_ids = request.data.get("student_ids")
            queryset = queryset.filter(id__in=student_ids)
        else:
            class_id = request.query_params.get("class_id") or request.query_params.get("class")
            if class_id:
                queryset = queryset.filter(school_class_id=class_id)
            else:
                # Limit to 50 if no filter to avoid accidental mega PDF
                queryset = queryset[:50]

        students = list(queryset)
        if not students:
            return Response({"detail": "No students found matching criteria."}, status=status.HTTP_404_NOT_FOUND)

        pdf_bytes = generate_bulk_id_cards_pdf(students, academic_year=academic_year)
        filename = f"Student_ID_Cards_Batch_{len(students)}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(
        detail=False,
        methods=["post"],
        url_path="generate-custom-id",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def generate_custom_id(self, request):
        """
        Generate and download PDF for manually entered student details (optional custom photo upload).
        """
        manual_data = {
            "full_name": request.data.get("full_name") or "Student Name",
            "student_id": request.data.get("student_id") or "STU-00001",
            "class_name": request.data.get("class_name") or "Grade 1A",
            "academic_year": request.data.get("academic_year") or "2026 / 2027",
            "guardian_name": request.data.get("guardian_name") or "",
            "relationship": request.data.get("relationship") or "Parent / Guardian",
            "emergency_contact": request.data.get("emergency_contact") or "+251 98 954 3580",
            "address": request.data.get("address") or "Addis Ababa, Ethiopia",
        }
        photo_file = request.FILES.get("photo")

        pdf_bytes = generate_single_student_id_pdf(
            student=None,
            academic_year=manual_data["academic_year"],
            manual_data=manual_data,
            photo_file=photo_file,
        )
        clean_id = manual_data["student_id"].replace(" ", "_")
        filename = f"ID_Card_{clean_id}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(
        detail=False,
        methods=["post"],
        url_path="preview-custom-id",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def preview_custom_id(self, request):
        """
        Preview front or back of manually entered ID card.
        """
        side = request.query_params.get("side") or request.data.get("side") or "front"
        manual_data = {
            "full_name": request.data.get("full_name") or "Student Name",
            "student_id": request.data.get("student_id") or "STU-00001",
            "class_name": request.data.get("class_name") or "Grade 1A",
            "academic_year": request.data.get("academic_year") or "2026 / 2027",
            "guardian_name": request.data.get("guardian_name") or "",
            "relationship": request.data.get("relationship") or "Parent / Guardian",
            "emergency_contact": request.data.get("emergency_contact") or "+251 98 954 3580",
            "address": request.data.get("address") or "Addis Ababa, Ethiopia",
        }
        photo_file = request.FILES.get("photo")

        if side == "back":
            img = generate_id_card_back_image(student=None, manual_data=manual_data)
        else:
            img = generate_id_card_front_image(
                student=None,
                academic_year=manual_data["academic_year"],
                manual_data=manual_data,
                photo_file=photo_file,
            )

        import io
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        return HttpResponse(buf.getvalue(), content_type="image/jpeg")

    @action(
        detail=False,
        methods=["post"],
        url_path="generate-custom-bulk-ids",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def generate_custom_bulk_ids(self, request):
        """
        Generate and download printable A4 PDF for multiple manual student cards (up to 5 per A4 sheet).
        Accepts multipart form data or JSON:
        - items: JSON-encoded string or list of student objects:
          [
            { "full_name": "...", "student_id": "...", "class_name": "...", "guardian_name": "...", ... }
          ]
        - photos can be uploaded as photo_0, photo_1, ... or photo_{student_id}
        """
        import json

        raw_items = request.data.get("items")
        if isinstance(raw_items, str):
            try:
                items_data = json.loads(raw_items)
            except Exception:
                items_data = []
        elif isinstance(raw_items, list):
            items_data = raw_items
        else:
            items_data = []

        if not items_data:
            return Response(
                {"detail": "No student card items provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        academic_year = request.data.get("academic_year")

        processed_items = []
        for idx, item in enumerate(items_data):
            # check for associated photo in request.FILES
            photo = (
                request.FILES.get(f"photo_{idx}")
                or request.FILES.get(f"photo_{item.get('student_id')}")
                or request.FILES.get("photo")
            )
            processed_items.append({
                "manual_data": item,
                "photo_file": photo,
            })

        pdf_bytes = generate_multi_items_id_cards_pdf(
            processed_items, academic_year=academic_year
        )
        filename = f"Custom_ID_Cards_Sheet_{len(processed_items)}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response



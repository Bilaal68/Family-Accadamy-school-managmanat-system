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
from apps.students.services import process_bulk_upload


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

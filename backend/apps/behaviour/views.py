from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import CustomUser
from apps.behaviour.models import StudentRemark
from apps.behaviour.serializers import StudentRemarkSerializer
from apps.grades.permissions import IsTeacherOnly
from apps.students.models import Student


class StudentRemarkCreateView(APIView):
    permission_classes = [IsTeacherOnly]

    def post(self, request):
        teacher = request.user.teacher_profile
        if not teacher.assigned_class_id:
            return Response(
                {"detail": "You are not assigned to a class."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student_id = request.data.get("student_id")
        content = (request.data.get("content") or "").strip()
        note_type = request.data.get("note_type", StudentRemark.NoteType.BEHAVIOUR)

        if not student_id:
            return Response(
                {"detail": "student_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not content:
            return Response(
                {"detail": "content is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if note_type not in StudentRemark.NoteType.values:
            return Response(
                {"detail": "Invalid note_type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student = get_object_or_404(Student, pk=student_id)
        if student.school_class_id != teacher.assigned_class_id:
            return Response(
                {"detail": "You can only report behaviour for students in your class."},
                status=status.HTTP_403_FORBIDDEN,
            )

        remark = StudentRemark.objects.create(
            student=student,
            author=request.user,
            note_type=note_type,
            content=content,
        )
        return Response(
            StudentRemarkSerializer(remark).data,
            status=status.HTTP_201_CREATED,
        )


class StudentRemarkListView(APIView):
    permission_classes = [IsTeacherOnly]

    def get(self, request):
        teacher = request.user.teacher_profile
        if not teacher.assigned_class_id:
            return Response(
                {"detail": "You are not assigned to a class."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = StudentRemark.objects.filter(
            student__school_class_id=teacher.assigned_class_id
        ).select_related("student", "author")
        student_id = request.query_params.get("student")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        severity = request.query_params.get("severity")
        if severity:
            queryset = queryset.filter(severity=severity)

        serializer = StudentRemarkSerializer(queryset[:100], many=True)
        return Response(serializer.data)

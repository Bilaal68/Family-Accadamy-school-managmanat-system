from rest_framework import serializers

from apps.behaviour.models import StudentRemark


class StudentRemarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    student_id_display = serializers.CharField(source="student.student_id", read_only=True)
    author_name = serializers.CharField(source="author.full_name", read_only=True)

    class Meta:
        model = StudentRemark
        fields = (
            "id",
            "student",
            "student_name",
            "student_id_display",
            "note_type",
            "content",
            "author",
            "author_name",
            "created_at",
        )

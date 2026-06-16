from decimal import Decimal

from rest_framework import serializers

from apps.grades.models import MarkEntry, SemesterChoices
from apps.students.models import Student


class MarkEntryWriteSerializer(serializers.Serializer):
    student = serializers.UUIDField()  # Changed from student_id to student
    subject = serializers.CharField(max_length=100)
    score = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100)
    semester = serializers.ChoiceField(choices=SemesterChoices.choices)
    remarks = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate_student(self, value):
        try:
            return Student.objects.select_related("school_class").get(pk=value)
        except Student.DoesNotExist:
            raise serializers.ValidationError("Student not found.") from None


class MarkEntrySerializer(serializers.ModelSerializer):
    student_id = serializers.UUIDField(source="student.id", read_only=True)
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    class_id = serializers.UUIDField(source="student.school_class_id", read_only=True)
    class_name = serializers.CharField(
        source="student.school_class.name", read_only=True
    )
    teacher_name = serializers.CharField(source="submitted_by.full_name", read_only=True)
    submitted_by_name = serializers.CharField(
        source="submitted_by.full_name", read_only=True
    )
    semester_display = serializers.CharField(source="get_semester_display", read_only=True)

    class Meta:
        model = MarkEntry
        fields = (
            "id",
            "student_id",
            "student_name",
            "class_id",
            "class_name",
            "subject",
            "score",
            "semester",
            "semester_display",
            "remarks",
            "submitted_by",
            "submitted_by_name",
            "teacher_name",
            "submitted_at",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        )


class StudentAverageSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    average = serializers.DecimalField(max_digits=5, decimal_places=2)


class ClassAveragesSerializer(serializers.Serializer):
    class_id = serializers.UUIDField()
    class_name = serializers.CharField()
    class_average = serializers.DecimalField(max_digits=5, decimal_places=2)
    students = StudentAverageSerializer(many=True)

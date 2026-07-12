from decimal import Decimal

from rest_framework import serializers

from apps.grades.models import MarkEntry, SemesterChoices, Subject, AssessmentTypeChoices
from apps.students.models import Student


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject model"""
    class Meta:
        model = Subject
        fields = ("id", "name", "created_by", "created_at", "updated_at", "is_active")
        read_only_fields = ("id", "created_by", "created_at", "updated_at")


class MarkEntryWriteSerializer(serializers.Serializer):
    student = serializers.UUIDField()  # Changed from student_id to student
    subject = serializers.CharField(max_length=100)
    score = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100)
    semester = serializers.ChoiceField(choices=SemesterChoices.choices)
    assessment_type = serializers.ChoiceField(choices=AssessmentTypeChoices.choices, required=False)
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
    assessment_type_display = serializers.CharField(source="get_assessment_type_display", read_only=True)

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
            "assessment_type",
            "assessment_type_display",
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


class SubjectSummaryStudentSerializer(serializers.Serializer):
    """Serializer for individual student mark in subject summary"""
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    total = serializers.DecimalField(max_digits=5, decimal_places=2)
    test_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    quiz_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    assignment_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    project_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    mid_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    final_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    homework_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    participation_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)


class SubjectSummarySerializer(serializers.Serializer):
    """Serializer for subject marks summary with averages by assessment type"""
    students = SubjectSummaryStudentSerializer(many=True)
    avg_test = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    avg_quiz = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    avg_assignment = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    avg_project = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    avg_mid = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    avg_final = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    avg_homework = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    avg_participation = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    class_average = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    highest = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    lowest = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    pass_rate = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)

from rest_framework import serializers

from apps.accounts.models import CustomUser
from apps.classes.models import SchoolClass
from apps.attendance.models import AttendanceRecord
from apps.grades.models import MarkEntry
from apps.students.models import Student, StudentParent


class ParentLinkSerializer(serializers.ModelSerializer):
    parent_id = serializers.UUIDField(source="parent.id", read_only=True)
    parent_name = serializers.CharField(source="parent.full_name", read_only=True)
    parent_phone = serializers.CharField(source="parent.phone", read_only=True)

    class Meta:
        model = StudentParent
        fields = (
            "id",
            "parent_id",
            "parent_name",
            "parent_phone",
            "relationship",
            "is_primary",
            "linked_at",
        )


class StudentListSerializer(serializers.ModelSerializer):
    class_id = serializers.UUIDField(source="school_class_id", read_only=True)
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Student
        fields = (
            "id",
            "student_id",
            "full_name",
            "date_of_birth",
            "gender",
            "photo",
            "class_id",
            "class_name",
            "enrolled_at",
            "is_active",
            "created_at",
        )


class StudentDetailSerializer(serializers.ModelSerializer):
    class_id = serializers.UUIDField(source="school_class_id", read_only=True)
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    parents = ParentLinkSerializer(source="parent_links", many=True, read_only=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Student
        fields = (
            "id",
            "student_id",
            "full_name",
            "date_of_birth",
            "gender",
            "photo",
            "class_id",
            "class_name",
            "enrolled_at",
            "is_active",
            "parents",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "student_id",
            "enrolled_at",
            "created_at",
            "updated_at",
        )


class StudentWriteSerializer(serializers.ModelSerializer):
    class_id = serializers.PrimaryKeyRelatedField(
        source="school_class",
        queryset=SchoolClass.objects.all(),
    )

    class Meta:
        model = Student
        fields = (
            "full_name",
            "date_of_birth",
            "gender",
            "photo",
            "class_id",
            "is_active",
        )


class LinkParentSerializer(serializers.Serializer):
    parent_id = serializers.UUIDField()
    relationship = serializers.CharField(max_length=50)
    is_primary = serializers.BooleanField(default=False)

    def validate(self, attrs):
        try:
            parent = CustomUser.objects.get(
                pk=attrs["parent_id"], role=CustomUser.Role.PARENT
            )
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError(
                {"parent_id": "Parent account not found."}
            ) from None
        student = self.context["student"]
        if StudentParent.objects.filter(student=student, parent=parent).exists():
            raise serializers.ValidationError(
                "This parent is already linked to the student."
            )
        attrs["parent"] = parent
        return attrs

    def create(self, validated_data):
        student = self.context["student"]
        parent = validated_data["parent"]
        return StudentParent.objects.create(
            student=student,
            parent=parent,
            relationship=validated_data["relationship"],
            is_primary=validated_data["is_primary"],
        )


class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = (
            "id",
            "date",
            "status",
            "submitted_at",
            "approved_at",
        )


class MarkEntrySerializer(serializers.ModelSerializer):
    semester_display = serializers.CharField(source="get_semester_display", read_only=True)
    assessment_type_display = serializers.CharField(source="get_assessment_type_display", read_only=True)
    
    class Meta:
        model = MarkEntry
        fields = (
            "id",
            "subject",
            "score",
            "semester",
            "semester_display",
            "assessment_type",
            "assessment_type_display",
            "remarks",
            "submitted_at",
            "approved_at",
        )

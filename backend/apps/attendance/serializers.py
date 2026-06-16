from rest_framework import serializers

from apps.attendance.models import AttendanceRecord
from apps.students.models import Student


class AttendanceMarkItemSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=AttendanceRecord.Status.choices)


class AttendanceMarkSerializer(serializers.Serializer):
    entries = AttendanceMarkItemSerializer(many=True)

    def validate_entries(self, value):
        if not value:
            raise serializers.ValidationError("At least one entry is required.")
        return value


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_id = serializers.UUIDField(source="student.id", read_only=True)
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    class_id = serializers.UUIDField(source="school_class_id", read_only=True)
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    marked_by_name = serializers.CharField(
        source="marked_by.full_name", read_only=True
    )

    class Meta:
        model = AttendanceRecord
        fields = (
            "id",
            "student_id",
            "student_name",
            "class_id",
            "class_name",
            "date",
            "status",
            "marked_by",
            "marked_by_name",
            "submitted_at",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "marked_by",
            "submitted_at",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        )


class AttendanceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = ("status",)


class AttendanceExportSerializer(serializers.Serializer):
    class_id = serializers.UUIDField(required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)


class AttendanceSendParentsSerializer(serializers.Serializer):
    class_id = serializers.UUIDField()
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)

from rest_framework import serializers

from apps.attendance.models import AttendanceRecord, TeacherAttendance
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


class TeacherAttendanceMarkItemSerializer(serializers.Serializer):
    teacher_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=TeacherAttendance.Status.choices)
    notes = serializers.CharField(required=False, allow_blank=True)


class TeacherAttendanceMarkSerializer(serializers.Serializer):
    entries = TeacherAttendanceMarkItemSerializer(many=True)

    def validate_entries(self, value):
        if not value:
            raise serializers.ValidationError("At least one entry is required.")
        return value


class TeacherAttendanceSerializer(serializers.ModelSerializer):
    teacher_id = serializers.UUIDField(source="teacher.id", read_only=True)
    teacher_name = serializers.CharField(source="teacher.user.full_name", read_only=True)
    teacher_staff_id = serializers.CharField(source="teacher.staff_id", read_only=True)
    marked_by_name = serializers.CharField(
        source="marked_by.full_name", read_only=True
    )

    class Meta:
        model = TeacherAttendance
        fields = (
            "id",
            "teacher_id",
            "teacher_name",
            "teacher_staff_id",
            "date",
            "status",
            "notes",
            "marked_by",
            "marked_by_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "marked_by",
            "created_at",
            "updated_at",
        )

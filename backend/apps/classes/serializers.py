from django.db.models import Avg, Q, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import serializers

from apps.attendance.models import AttendanceRecord
from apps.classes.models import SchoolClass
from apps.classes.services import get_today_attendance_percentage
from apps.students.models import Student


class SchoolClassListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    student_count = serializers.IntegerField(read_only=True)
    attendance_marked_today = serializers.SerializerMethodField()
    today_attendance_percent = serializers.SerializerMethodField()

    class Meta:
        model = SchoolClass
        fields = (
            "id",
            "name",
            "grade",
            "section",
            "schedule",
            "teacher_name",
            "student_count",
            "attendance_marked_today",
            "today_attendance_percent",
            "created_at",
        )

    def get_teacher_name(self, obj):
        if hasattr(obj, "class_teacher"):
            return obj.class_teacher.user.full_name
        return None

    def get_attendance_marked_today(self, obj):
        return AttendanceRecord.objects.filter(
            school_class=obj,
            date=timezone.localdate(),
        ).exists()

    def get_today_attendance_percent(self, obj):
        if not self.get_attendance_marked_today(obj):
            return None
        return str(get_today_attendance_percentage(obj))


class SchoolClassWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolClass
        fields = ("id", "name", "grade", "section", "schedule", "created_at")
        read_only_fields = ("id", "created_at")


class TeacherBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    staff_id = serializers.CharField()
    full_name = serializers.CharField()
    email = serializers.EmailField()


class StudentBriefSerializer(serializers.ModelSerializer):
    overall_average = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ("id", "student_id", "full_name", "overall_average")

    def get_overall_average(self, obj):
        return obj.overall_average


class SchoolClassDetailSerializer(serializers.ModelSerializer):
    teacher = serializers.SerializerMethodField()
    students = StudentBriefSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolClass
        fields = (
            "id",
            "name",
            "grade",
            "section",
            "schedule",
            "teacher",
            "students",
            "created_at",
        )

    def get_teacher(self, obj):
        if hasattr(obj, "class_teacher"):
            teacher = obj.class_teacher
            return {
                "id": str(teacher.id),
                "staff_id": teacher.staff_id,
                "full_name": teacher.user.full_name,
                "email": teacher.user.email,
            }
        return None


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    student_id = serializers.UUIDField()
    full_name = serializers.CharField()
    overall_average = serializers.DecimalField(max_digits=5, decimal_places=2)
    photo = serializers.URLField(allow_null=True, required=False)


def build_leaderboard(school_class):
    students = list(
        Student.objects.filter(school_class=school_class, is_active=True).annotate(
            average_score=Coalesce(
                Avg('markentry__score', filter=Q(markentry__approved_at__isnull=False)),
                Value(0.0)
            )
        ).order_by("-average_score", "full_name")
    )
    entries = []
    for rank, student in enumerate(students, start=1):
        entries.append(
            {
                "rank": rank,
                "student_id": student.id,
                "full_name": student.full_name,
                "overall_average": round(float(student.average_score), 1) if student.average_score else 0.0,
            }
        )
    return entries

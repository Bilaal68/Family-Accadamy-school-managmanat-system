from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import CustomUser
from apps.classes.models import SchoolClass
from apps.teachers.models import Teacher


class TeacherListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)
    assigned_class_name = serializers.SerializerMethodField()
    assigned_class_id = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = (
            "id",
            "staff_id",
            "full_name",
            "email",
            "is_active",
            "assigned_class_id",
            "assigned_class_name",
            "joined_at",
            "created_at",
        )

    def get_assigned_class_name(self, obj):
        if obj.assigned_class_id:
            return obj.assigned_class.name
        return None

    def get_assigned_class_id(self, obj):
        if obj.assigned_class_id:
            return str(obj.assigned_class_id)
        return None


class TeacherDetailSerializer(TeacherListSerializer):
    phone = serializers.CharField(source="user.phone", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)

    class Meta(TeacherListSerializer.Meta):
        fields = TeacherListSerializer.Meta.fields + ("phone", "is_active")


class TeacherCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=255)
    joined_at = serializers.DateField(required=False)
    class_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_email(self, value):
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_class_id(self, value):
        if not value:
            return value
        school_class = SchoolClass.objects.filter(pk=value).first()
        if not school_class:
            raise serializers.ValidationError("Class not found.")
        if Teacher.objects.filter(assigned_class=school_class).exists():
            raise serializers.ValidationError(
                "This class already has a teacher assigned."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        class_id = validated_data.pop("class_id", None)
        joined_at = validated_data.pop("joined_at", None) or timezone.localdate()
        user = CustomUser.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"],
            role=CustomUser.Role.CLASS_TEACHER,
            is_staff=True,
        )
        teacher = Teacher.objects.create(user=user, joined_at=joined_at)
        if class_id:
            teacher.assigned_class_id = class_id
            teacher.save(update_fields=["assigned_class"])
        return teacher


class TeacherUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    is_active = serializers.BooleanField(required=False)
    joined_at = serializers.DateField(required=False)

    def update(self, instance, validated_data):
        user = instance.user
        if "full_name" in validated_data:
            user.full_name = validated_data["full_name"]
        if "email" in validated_data:
            user.email = validated_data["email"]
        if "is_active" in validated_data:
            user.is_active = validated_data["is_active"]
        if any(k in validated_data for k in ("full_name", "email", "is_active")):
            user.save()

        if "joined_at" in validated_data:
            instance.joined_at = validated_data["joined_at"]
            instance.save(update_fields=["joined_at"])

        return instance


class AssignClassSerializer(serializers.Serializer):
    class_id = serializers.UUIDField()

    def validate_class_id(self, value):
        if not SchoolClass.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Class not found.")
        return value

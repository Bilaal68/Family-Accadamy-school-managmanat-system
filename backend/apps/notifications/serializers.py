from rest_framework import serializers

from apps.classes.models import SchoolClass
from apps.notifications.models import Announcement, Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id",
            "title",
            "message",
            "is_read",
            "created_at",
        )
        read_only_fields = fields


class AnnouncementSerializer(serializers.ModelSerializer):
    sent_to = serializers.SerializerMethodField()
    sent_by_name = serializers.CharField(source="sent_by.full_name", read_only=True)

    class Meta:
        model = Announcement
        fields = (
            "id",
            "title",
            "message",
            "audience",
            "sent_to",
            "sent_by_name",
            "created_at",
        )
        read_only_fields = fields

    def get_sent_to(self, obj):
        if obj.audience == Announcement.Audience.ALL_SCHOOL:
            return "All School"
        if obj.school_class_id:
            return obj.school_class.name
        return "Class"


class AnnouncementCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    audience = serializers.ChoiceField(choices=["ALL", "CLASS"])
    class_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        if attrs["audience"] == "CLASS" and not attrs.get("class_id"):
            raise serializers.ValidationError(
                {"class_id": "Select a class for class-wide announcements."}
            )
        if attrs.get("class_id"):
            if not SchoolClass.objects.filter(pk=attrs["class_id"]).exists():
                raise serializers.ValidationError(
                    {"class_id": "Class not found."}
                )
        return attrs

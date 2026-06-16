from rest_framework import serializers

from .models import CustomUser
from .tokens import CustomRefreshToken


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip()
        phone = (attrs.get("phone") or "").strip()
        password = attrs.get("password")

        if not email and not phone:
            raise serializers.ValidationError(
                "Provide either email or phone for login."
            )
        if email and phone:
            raise serializers.ValidationError(
                "Provide only one of email or phone, not both."
            )

        try:
            if email:
                user = CustomUser.objects.get(email__iexact=email, is_active=True)
            else:
                user = CustomUser.objects.get(phone=phone, is_active=True)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials.") from None

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials.")

        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        refresh = CustomRefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class MeSerializer(serializers.ModelSerializer):
    assigned_class = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ("id", "full_name", "role", "email", "phone", "assigned_class")
        read_only_fields = fields

    def get_assigned_class(self, obj):
        return obj.assigned_class

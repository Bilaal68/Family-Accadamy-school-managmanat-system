from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin
from apps.grades.permissions import IsTeacherOnly
from apps.teachers.models import Teacher
from apps.classes.models import SchoolClass
from apps.notifications.models import Announcement, Notification
from apps.notifications.serializers import (
    AnnouncementCreateSerializer,
    AnnouncementSerializer,
    NotificationSerializer,
)
from apps.students.models import StudentParent


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        scope = request.query_params.get("scope", "")
        unread_only = request.query_params.get("unread", "").lower() in (
            "true",
            "1",
            "yes",
        )

        if scope == "admin":
            if request.user.role != CustomUser.Role.SUPER_ADMIN:
                return Response(
                    {"detail": "Admin scope requires super admin role."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        queryset = Notification.objects.filter(user=request.user).order_by(
            "-created_at"
        )
        if unread_only:
            queryset = queryset.filter(is_read=False)

        try:
            limit = min(int(request.query_params.get("limit", 50)), 100)
        except ValueError:
            limit = 50
        queryset = queryset[:limit]
        unread_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response(
            {
                "count": unread_count,
                "results": NotificationSerializer(queryset, many=True).data,
            }
        )


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notification = get_object_or_404(
            Notification, pk=pk, user=request.user
        )
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        updated = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response({"updated": updated})


class AnnouncementListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Admin can see all announcements
        if request.user.role == CustomUser.Role.SUPER_ADMIN:
            queryset = Announcement.objects.select_related(
                "school_class", "sent_by"
            ).order_by("-created_at")[:100]
        else:
            # Non-admin users can only see announcements they created
            queryset = Announcement.objects.filter(
                sent_by=request.user
            ).select_related(
                "school_class", "sent_by"
            ).order_by("-created_at")[:100]
        
        return Response(AnnouncementSerializer(queryset, many=True).data)


class AnnouncementDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_announcement(self, pk):
        return get_object_or_404(Announcement, pk=pk)

    def _can_modify(self, request, announcement):
        """Check if user can modify this announcement"""
        # Admin can modify any announcement
        if request.user.role == CustomUser.Role.SUPER_ADMIN:
            return True
        # Creator can modify their own announcement
        if announcement.sent_by_id == request.user.id:
            return True
        return False

    def get(self, request, pk):
        announcement = self.get_announcement(pk)
        return Response(AnnouncementSerializer(announcement).data)

    def put(self, request, pk):
        announcement = self.get_announcement(pk)
        
        # Check permissions
        if not self._can_modify(request, announcement):
            return Response(
                {"detail": "You don't have permission to edit this announcement."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        data = request.data
        
        # Update fields
        if "title" in data:
            announcement.title = data["title"]
        if "message" in data:
            announcement.message = data["message"]
        if "audience" in data:
            announcement.audience = data["audience"]
        if "class_id" in data and data["audience"] == "CLASS":
            try:
                announcement.school_class_id = data["class_id"]
            except Exception:
                return Response(
                    {"detail": "Invalid class ID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        
        announcement.save()
        return Response(AnnouncementSerializer(announcement).data)

    def delete(self, request, pk):
        announcement = self.get_announcement(pk)
        
        # Check permissions
        if not self._can_modify(request, announcement):
            return Response(
                {"detail": "You don't have permission to delete this announcement."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        announcement.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AnnouncementCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = dict(request.data)
        if request.user.role == CustomUser.Role.CLASS_TEACHER:
            if not IsTeacherOnly().has_permission(request, self):
                return Response(status=status.HTTP_403_FORBIDDEN)
            try:
                teacher = request.user.teacher_profile
            except Exception:
                return Response(
                    {"detail": "Teacher profile not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not teacher.assigned_class_id:
                return Response(
                    {"detail": "You are not assigned to a class."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            payload = {
                **payload,
                "audience": "CLASS",
                "class_id": str(teacher.assigned_class_id),
            }
        elif request.user.role != CustomUser.Role.SUPER_ADMIN:
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = AnnouncementCreateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        school_class = None
        if data.get("class_id"):
            school_class = SchoolClass.objects.get(pk=data["class_id"])

        announcement = Announcement.objects.create(
            title=data["title"],
            message=data["message"],
            audience=data["audience"],
            school_class=school_class,
            sent_by=request.user,
        )

        recipients = CustomUser.objects.filter(is_active=True)
        if data["audience"] == "CLASS" and school_class:
            parent_ids = StudentParent.objects.filter(
                student__school_class=school_class
            ).values_list("parent_id", flat=True)
            teacher_user_ids = []
            try:
                teacher_user_ids = [school_class.class_teacher.user_id]
            except Exception:
                pass
            recipients = recipients.filter(
                Q(role=CustomUser.Role.PARENT, id__in=parent_ids)
                | Q(id__in=teacher_user_ids)
                | Q(role=CustomUser.Role.SUPER_ADMIN)
            )
        else:
            recipients = recipients.filter(
                role__in=[
                    CustomUser.Role.PARENT,
                    CustomUser.Role.CLASS_TEACHER,
                    CustomUser.Role.SUPER_ADMIN,
                ]
            )

        Notification.objects.bulk_create(
            [
                Notification(
                    user=user,
                    title=data["title"],
                    message=data["message"],
                )
                for user in recipients.distinct()
            ]
        )

        return Response(
            AnnouncementSerializer(announcement).data,
            status=status.HTTP_201_CREATED,
        )


class PendingApprovalsCountView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.attendance.models import AttendanceRecord
        from apps.grades.models import MarkEntry

        marks = MarkEntry.objects.filter(
            submitted_at__isnull=False,
            approved_at__isnull=True,
        ).count()
        attendance = AttendanceRecord.objects.filter(
            submitted_at__isnull=False,
            approved_at__isnull=True,
        ).count()
        return Response({"count": marks + attendance})

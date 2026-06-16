from django.urls import path

from apps.notifications.views import (
    AnnouncementCreateView,
    AnnouncementListView,
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    PendingApprovalsCountView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="list"),
    path("read-all/", NotificationMarkAllReadView.as_view(), name="read-all"),
    path("<uuid:pk>/read/", NotificationMarkReadView.as_view(), name="read"),
    path("announce/", AnnouncementCreateView.as_view(), name="announce"),
    path("announcements/", AnnouncementListView.as_view(), name="announcements"),
    path("pending-count/", PendingApprovalsCountView.as_view(), name="pending-count"),
]

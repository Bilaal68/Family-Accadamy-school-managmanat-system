from django.urls import path

from apps.attendance.views import (
    ApproveAttendanceView,
    AttendanceDetailView,
    AttendanceListView,
    ExportAttendanceView,
    MarkAttendanceView,
    SendAttendanceParentsView,
    SubmitAttendanceView,
)

app_name = "attendance"

urlpatterns = [
    path("mark/", MarkAttendanceView.as_view(), name="mark"),
    path("submit/", SubmitAttendanceView.as_view(), name="submit"),
    path("export/", ExportAttendanceView.as_view(), name="export"),
    path("send-to-parents/", SendAttendanceParentsView.as_view(), name="send-to-parents"),
    path("approve/<uuid:pk>/", ApproveAttendanceView.as_view(), name="approve"),
    path("<uuid:pk>/", AttendanceDetailView.as_view(), name="detail"),
    path("", AttendanceListView.as_view(), name="list"),
]

from django.urls import path

from apps.attendance.views import (
    ApproveAttendanceView,
    AttendanceDetailView,
    AttendanceListView,
    AttendanceReportView,
    ExportAttendanceView,
    MarkAttendanceView,
    MarkTeacherAttendanceView,
    SendAttendanceParentsView,
    SubmitAttendanceView,
    TeacherAttendanceListView,
    TeacherAttendanceTodaySummaryView,
)

app_name = "attendance"

urlpatterns = [
    path("mark/", MarkAttendanceView.as_view(), name="mark"),
    path("submit/", SubmitAttendanceView.as_view(), name="submit"),
    path("export/", ExportAttendanceView.as_view(), name="export"),
    path("send-to-parents/", SendAttendanceParentsView.as_view(), name="send-to-parents"),
    path("report/", AttendanceReportView.as_view(), name="report"),
    path("approve/<uuid:pk>/", ApproveAttendanceView.as_view(), name="approve"),
    path("teachers/mark/", MarkTeacherAttendanceView.as_view(), name="mark-teacher"),
    path("teachers/today_summary/", TeacherAttendanceTodaySummaryView.as_view(), name="teacher-today-summary"),
    path("teachers/", TeacherAttendanceListView.as_view(), name="teacher-list"),
    path("<uuid:pk>/", AttendanceDetailView.as_view(), name="detail"),
    path("", AttendanceListView.as_view(), name="list"),
]

"""
URL configuration for Family Academy project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.students.parent_views import ParentSearchView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/classes/", include("apps.classes.urls")),
    path("api/v1/teachers/", include("apps.teachers.urls")),
    path("api/v1/students/", include("apps.students.urls")),
    path("api/v1/parents/", ParentSearchView.as_view(), name="parent-search"),
    path("api/v1/attendance/", include("apps.attendance.urls")),
    path("api/v1/grades/", include("apps.grades.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/behaviour/", include("apps.behaviour.urls")),
    path("api/v1/enrollment/", include("apps.enrollment.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

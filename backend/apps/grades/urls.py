from django.urls import path

from apps.grades.views import (
    ApproveMarkView,
    MarkAveragesView,
    MarkEntryView,
    SubmitMarksView,
)

app_name = "grades"

urlpatterns = [
    path("submit/", SubmitMarksView.as_view(), name="submit"),
    path("averages/", MarkAveragesView.as_view(), name="averages"),
    path("approve/<uuid:pk>/", ApproveMarkView.as_view(), name="approve"),
    path("", MarkEntryView.as_view(), name="marks"),
]

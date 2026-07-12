from django.urls import path

from apps.grades.views import (
    ApproveMarkView,
    MarkAveragesView,
    MarkEntryView,
    SubmitMarksView,
    SubjectView,
    SubjectSummaryView,
)

app_name = "grades"

urlpatterns = [
    path("submit/", SubmitMarksView.as_view(), name="submit"),
    path("averages/", MarkAveragesView.as_view(), name="averages"),
    path("subject_summary/", SubjectSummaryView.as_view(), name="subject_summary"),
    path("approve/<uuid:pk>/", ApproveMarkView.as_view(), name="approve"),
    path("subjects/", SubjectView.as_view(), name="subjects"),
    path("", MarkEntryView.as_view(), name="marks"),
]

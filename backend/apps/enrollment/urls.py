from django.urls import path

from .views import (
    EnrollmentApproveView,
    EnrollmentApplyView,
    EnrollmentDetailView,
    EnrollmentListView,
    EnrollmentRejectView,
    EnrollmentReviewView,
    EnrollmentStatsView,
    EnrollmentStatusView,
)

urlpatterns = [
    # Public endpoints
    path("apply/", EnrollmentApplyView.as_view(), name="enrollment-apply"),
    path(
        "status/<str:admission_number>/",
        EnrollmentStatusView.as_view(),
        name="enrollment-status",
    ),
    # Cashier/Admin endpoints
    path("", EnrollmentListView.as_view(), name="enrollment-list"),
    path("<uuid:id>/", EnrollmentDetailView.as_view(), name="enrollment-detail"),
    path("<uuid:id>/review/", EnrollmentReviewView.as_view(), name="enrollment-review"),
    path("<uuid:id>/approve/", EnrollmentApproveView.as_view(), name="enrollment-approve"),
    path("<uuid:id>/reject/", EnrollmentRejectView.as_view(), name="enrollment-reject"),
    path("stats/", EnrollmentStatsView.as_view(), name="enrollment-stats"),
]

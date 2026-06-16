from django.urls import path

from apps.behaviour.views import StudentRemarkCreateView, StudentRemarkListView

urlpatterns = [
    path("", StudentRemarkListView.as_view(), name="remark-list"),
    path("report/", StudentRemarkCreateView.as_view(), name="remark-create"),
]

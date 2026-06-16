from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.classes.views import SchoolClassViewSet

router = DefaultRouter()
router.register("", SchoolClassViewSet, basename="schoolclass")

urlpatterns = [
    path("", include(router.urls)),
]

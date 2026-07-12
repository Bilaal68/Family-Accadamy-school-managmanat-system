from django.urls import path

from .search_views import GlobalSearchView
from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    ProfileUpdateView,
    TokenRefreshPublicView,
)

app_name = "accounts"

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshPublicView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/update/", ProfileUpdateView.as_view(), name="profile-update"),
    path("password/change/", ChangePasswordView.as_view(), name="password-change"),
    path("search/", GlobalSearchView.as_view(), name="global-search"),
]

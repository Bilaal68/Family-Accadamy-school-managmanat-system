from django.urls import path

from .views import LoginView, LogoutView, MeView, TokenRefreshPublicView

app_name = "accounts"

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshPublicView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
]

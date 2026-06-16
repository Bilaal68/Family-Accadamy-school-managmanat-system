from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import LoginSerializer, LogoutSerializer, MeSerializer
from .tokens import CustomRefreshToken


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data.get('user')
        allowed_roles = ['SUPER_ADMIN', 'CLASS_TEACHER', 'CASHIER']
        if user and user.role not in allowed_roles:
            return Response(
                {'error': 'Access not allowed.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(serializer.save(), status=status.HTTP_200_OK)


class TokenRefreshPublicView(TokenRefreshView):
    permission_classes = [AllowAny]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = CustomRefreshToken(serializer.validated_data["refresh"])
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user

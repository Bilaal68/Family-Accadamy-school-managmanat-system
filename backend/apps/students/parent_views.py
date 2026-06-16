from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin


class ParentSearchView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        query = (
            request.query_params.get("phone")
            or request.query_params.get("search")
            or ""
        ).strip()
        queryset = CustomUser.objects.filter(
            role=CustomUser.Role.PARENT,
            is_active=True,
        )
        if query:
            queryset = queryset.filter(phone__icontains=query)
        queryset = queryset.order_by("full_name")[:25]
        return Response(
            [
                {
                    "id": str(user.id),
                    "full_name": user.full_name,
                    "phone": user.phone or "",
                }
                for user in queryset
            ]
        )

from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsSuperAdmin
from .serializers import (
    CreateSubAdminSerializer,
    LoginSerializer,
    LoginUserSummarySerializer,
    RegistrationSerializer,
)


@api_view(["GET"])
def health_check(request):
    """Simple liveness endpoint used by the app and tests."""
    return Response({"status": "ok"})


class RegisterView(generics.GenericAPIView):
    """Create a new account and return JWT tokens for immediate use."""

    serializer_class = RegistrationSerializer
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        """Validate the payload, persist the user, and mint refresh/access tokens."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = serializer.save()

        # Tokens are minted after persistence so the account can be used immediately.
        tokens = RefreshToken.for_user(created["user"])
        data = dict(serializer.data)
        data["tokens"] = {
            "refresh": str(tokens),
            "access": str(tokens.access_token),
        }

        return Response(data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Authenticate users and return JWT tokens"""

    permission_classes = (AllowAny,)

    def post(self, request):
        """Validate the payload and authenticates user, generating JWT tokens"""
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        tokens = RefreshToken.for_user(user)

        return Response(
            {
                "user": LoginUserSummarySerializer(user).data,
                "tokens": {
                    "refresh": str(tokens),
                    "access": str(tokens.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )


class AdminDelegationView(generics.GenericAPIView):
    """Allow superadmins to delegate new subadmin accounts."""

    serializer_class = CreateSubAdminSerializer
    permission_classes = (IsAuthenticated, IsSuperAdmin)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = serializer.save()
        return Response(
            serializer.to_representation(created),
            status=status.HTTP_201_CREATED,
        )

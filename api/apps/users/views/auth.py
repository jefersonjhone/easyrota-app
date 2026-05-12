import logging
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.urls.base import reverse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import ExpiredTokenError
from rest_framework_simplejwt.serializers import (
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken

from config.settings.base import SIMPLE_JWT

from ..auth.otp import generate_otp
from ..auth.tokens import PartialTokenService
from ..models.auth import MFAChallenge
from ..models.profiles import ProfileType
from ..serializers.auth import (
    CivilServantRegistrationSerializer,
    LoginSerializer,
    RegistrationResponseSerializer,
    StudentRegistrationSerializer,
    Verify2FASerializer,
)
from ..serializers.users import AuthenticatedUserWithAdminProfileSerializer

logger = logging.getLogger("api")

SIMPLE_JWT_REFRESH_TOKEN_LIFETIME = SIMPLE_JWT.get(
    "REFRESH_TOKEN_LIFETIME"
).total_seconds()


def unauthorized(message):
    response = Response(
        {"detail": message},
        status=401,
    )

    response.delete_cookie("refresh_token")

    return response


class LoginView2fa(generics.GenericAPIView):
    """This view is a test to 2fa login flow, may be it's don't is required.
    But in some cases it could be. ex:admin login"""

    permission_classes = (AllowAny,)
    authentication_classes = []
    serializer_class = LoginSerializer

    def post(self, request):
        """Catch the request and validate fields(email, password)
        if credentials is valide return a partial token with a purpose field = Login
        and generate a otp code thats will be verified in /verifi-2fa endpoint.

        Retun a a partialtoken field and status:2fa_required"""

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        email = (serializer.validated_data["email"],)
        password = (serializer.validated_data["password"],)
        user = authenticate(email=email, password=password)

        if not user:
            logger.info(f"invalid credentials for {email} acount ")
            raise AuthenticationFailed("Invalid credentials")

        token, jti = PartialTokenService.create(user, MFAChallenge.Purpose.LOGIN)

        code = generate_otp()

        MFAChallenge.objects.create(
            user=user,
            jti=jti,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        logger.debug(f"OTP CODE: {code} for {user} generated")

        return Response({"status": "2fa_required", "token": token})


class LoginView(generics.GenericAPIView):
    """Authenticate users and return JWT acess tokens.
    acess_token are returned in body.
    refresh_token are returned as a cookie for security reasons.

    may be user field should not returned because its could be at jwt payload.
    on every login every refresh token associated to user are added to block list
    """

    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request):

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        user = serializer.user

        refresh = RefreshToken.for_user(user)

        access_token = str(refresh.access_token)

        refresh_token = str(refresh)

        response = Response(
            {
                # may be should returned inside a token payload,
                # if dont have sensitive data
                "user": AuthenticatedUserWithAdminProfileSerializer(user).data,
                "tokens": {
                    "access": access_token,
                },
            },
            status=status.HTTP_200_OK,
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            max_age=SIMPLE_JWT_REFRESH_TOKEN_LIFETIME,
            path=reverse("refresh-token"),
        )

        return response


class RegisterView(APIView):
    """This view actualy serves to student and civilservant profile only
    acess_token are returned in body.
    refresh_token are returned as a cookie for security reasons.
    """

    permission_classes = (AllowAny,)

    SERIALIZERS = {
        ProfileType.STUDENT: StudentRegistrationSerializer,
        ProfileType.CIVIL_SERVANT: CivilServantRegistrationSerializer,
    }

    def post(self, request):

        profile_type = request.data.get("profile_type")

        serializer_class = self.SERIALIZERS.get(profile_type)

        if not serializer_class:
            return Response(
                {"profile_type": ["Invalid profile type."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = serializer_class(data=request.data)

        serializer.is_valid(raise_exception=True)

        created = serializer.save()

        user = created["user"]

        refresh = RefreshToken.for_user(user)

        access_token = str(refresh.access_token)

        refresh_token = str(refresh)

        response = Response(
            {
                "user": RegistrationResponseSerializer(created).data,
                "tokens": {"access": access_token},
            },
            status=status.HTTP_201_CREATED,
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            max_age=SIMPLE_JWT_REFRESH_TOKEN_LIFETIME,
            path=reverse("refresh-token"),
        )

        return response


class RegisterView2fa(generics.GenericAPIView):
    """A register view with a aditional verification layer.
    A user is created but the field `is_active`is setted to false
    until the 2fa verification be done.

    it have an edge case when the acess token expire, because user are already
    created but can regenerate the token, so they can't acess and can't regenerate token
    """

    permission_classes = (AllowAny,)

    SERIALIZERS = {
        ProfileType.STUDENT: StudentRegistrationSerializer,
        ProfileType.CIVIL_SERVANT: CivilServantRegistrationSerializer,
    }

    @transaction.atomic
    def post(self, request, *args, **kwargs):

        profile_type = request.data.get("profile_type")

        serializer_class = self.SERIALIZERS.get(profile_type)

        if serializer_class is None:
            return Response(
                {"profile_type": ["Invalid profile type."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = serializer_class(data=request.data)

        serializer.is_valid(raise_exception=True)

        created = serializer.save()

        user = created["user"]

        token, jti = PartialTokenService.create(
            user=user,
            purpose=(MFAChallenge.Purpose.REGISTER),
        )

        code = generate_otp()
        logger.debug(f"OTP CODE: {code} for {user} generated")

        MFAChallenge.objects.create(
            user=user,
            jti=jti,
            purpose=(MFAChallenge.Purpose.REGISTER),
            code_hash=make_password(code),
            expires_at=(timezone.now() + timedelta(minutes=5)),
        )

        return Response(
            {
                "status": "verification_required",
                "token": token,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class Verify2FAView(generics.GenericAPIView):
    """
     Verify OTP and issue JWT tokens.
     actualy cover only register and login flow
    return acess_token field
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):

        serializer = Verify2FASerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        payload = PartialTokenService.decode(serializer.validated_data["token"])

        if payload["type"] != "2fa_pending":
            raise AuthenticationFailed("Invalid token type")

        challenge = (
            MFAChallenge.objects
            .filter(jti=payload["jti"])
            .select_related("user")
            .first()
        )

        if not challenge:
            raise AuthenticationFailed("Challenge not found")

        if challenge.used:
            raise AuthenticationFailed("Challenge already used")

        if challenge.revoked:
            raise AuthenticationFailed("Challenge revoked")

        if challenge.is_expired():
            raise AuthenticationFailed("Challenge expired")

        if not challenge.can_attempt():
            challenge.revoked = True

            challenge.save(update_fields=["revoked"])

            raise AuthenticationFailed("Too many attempts")

        challenge.attempts += 1

        challenge.save(update_fields=["attempts"])

        valid_code = check_password(
            serializer.validated_data["code"],
            challenge.code_hash,
        )

        if not valid_code:
            raise AuthenticationFailed("Invalid code")

        challenge.used = True

        challenge.save(update_fields=["used"])

        if challenge.purpose == MFAChallenge.Purpose.REGISTER:
            challenge.user.is_active = True

            challenge.user.save(update_fields=["is_active"])

        user = challenge.user

        refresh = RefreshToken.for_user(user)

        access_token = str(refresh.access_token)

        refresh_token = str(refresh)

        response = Response(
            {
                "access": access_token,
            },
            status=status.HTTP_200_OK,
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            max_age=SIMPLE_JWT_REFRESH_TOKEN_LIFETIME,
            path=reverse("refresh-token"),
        )

        return response


class RefreshTokenView(generics.GenericAPIView):
    """Refresh view for generate new acess_token to client
    verify refresh_token and validade and return new acesstoken"""

    permission_classes = [AllowAny]
    authentication_classes = []

    serializer_class = TokenRefreshSerializer

    def post(self, request):

        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = self.get_serializer(data={"refresh": refresh_token})

        try:
            serializer.is_valid(raise_exception=True)

        except ExpiredTokenError:
            response = Response(
                {"detail": "Refresh token expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            response.delete_cookie(
                "refresh_token",
                path="/",
            )
            return response
        data = serializer.validated_data

        response = Response(
            {
                "access": data["access"],
            },
            status=status.HTTP_200_OK,
        )

        # Rotation enabled
        if "refresh" in data:
            response.set_cookie(
                key="refresh_token",
                value=data["refresh"],
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                max_age=SIMPLE_JWT_REFRESH_TOKEN_LIFETIME,
                path=reverse("refresh-token"),
            )

        return response


class LogoutView(APIView):
    """Add refresh token to blacklist and remove from cookie"""

    def post(self, request):

        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            token = RefreshToken(refresh_token)

            token.blacklist()

        response = Response(status=204)

        response.delete_cookie(
            "refresh_token",
            path=reverse("refresh-token"),
        )

        return response

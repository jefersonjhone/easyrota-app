import logging
from datetime import timedelta

import jwt
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.urls.base import reverse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
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
from ..models.user import CustomUser
from ..serializers.auth import (
    CivilServantRegistrationSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegistrationResponseSerializer,
    ResendOTPSerializer,
    StudentRegistrationSerializer,
    Verify2FASerializer,
    VerifyRegistrationOTPSerializer,
)
from ..serializers.users import (
    AuthenticatedUserWithProfileSerializer,
    DeleteOwnAccountSerializer,
)

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


def send_registration_otp(email, code):
    send_mail(
        subject="Código de confirmação EasyRota",
        message=f"Seu código de confirmação é: {code}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


def handle_registration(request):
    profile_type = request.data.get("profile_type")

    serializer_class = {
        ProfileType.STUDENT: StudentRegistrationSerializer,
        ProfileType.CIVIL_SERVANT: CivilServantRegistrationSerializer,
    }.get(profile_type)

    if not serializer_class:
        return Response(
            {"profile_type": ["Invalid profile type."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = serializer_class(data=request.data)
    serializer.is_valid(raise_exception=True)
    created = serializer.save()
    user = created["user"]

    if profile_type in [ProfileType.STUDENT, ProfileType.CIVIL_SERVANT]:
        token, jti = PartialTokenService.create(user, MFAChallenge.Purpose.REGISTER)
        code = generate_otp()

        print("seu código é: ", code)

        MFAChallenge.objects.create(
            user=user,
            jti=jti,
            purpose=MFAChallenge.Purpose.REGISTER,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        send_registration_otp(user.email, code)

        return Response(
            {
                "status": "verification_required",
                "token": token,
                "otp_destination": user.email,
                "user": RegistrationResponseSerializer(created).data,
            },
            status=status.HTTP_202_ACCEPTED,
        )

    return Response(
        {
            "user": RegistrationResponseSerializer(created).data,
            "status": "created",
        },
        status=status.HTTP_201_CREATED,
    )


def consume_registration_challenge(token, code):
    try:
        payload = PartialTokenService.decode(token)
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed(
            "O link de verificação expirou. Por favor, cadastre-se novamente."
        )
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Token de verificação inválido.")

    if payload["type"] != "2fa_pending":
        raise AuthenticationFailed("Invalid token type")

    challenge = (
        MFAChallenge.objects.filter(jti=payload["jti"]).select_related("user").first()
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

    if not check_password(code, challenge.code_hash):
        raise AuthenticationFailed("Invalid code")

    challenge.used = True
    challenge.save(update_fields=["used"])

    return challenge


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
            expires_at=timezone.now() + timedelta(minutes=10),
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

        print("user: ", type(user))

        refresh = RefreshToken.for_user(user)

        access_token = str(refresh.access_token)

        refresh_token = str(refresh)

        response = Response(
            {
                # may be should returned inside a token payload,
                # if dont have sensitive data
                "user": AuthenticatedUserWithProfileSerializer(user).data,
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

    def post(self, request):
        return handle_registration(request)


class VerifyRegistrationOTPView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = VerifyRegistrationOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        challenge = consume_registration_challenge(
            serializer.validated_data["token"], serializer.validated_data["code"]
        )
        challenge.user.is_active = True
        challenge.user.save(update_fields=["is_active"])

        return Response({"status": "verified"}, status=status.HTTP_200_OK)


class ResendOTPView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ResendOTPSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = CustomUser.objects.filter(email=email, is_active=False).first()
        if not user:
            return Response(
                {"detail": "Usuário não encontrado ou já ativado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Revoga desafios anteriores
        MFAChallenge.objects.filter(
            user=user, purpose=MFAChallenge.Purpose.REGISTER, used=False
        ).update(revoked=True)

        token, jti = PartialTokenService.create(user, MFAChallenge.Purpose.REGISTER)
        code = generate_otp()

        print("seu código é: ", code)

        MFAChallenge.objects.create(
            user=user,
            jti=jti,
            purpose=MFAChallenge.Purpose.REGISTER,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        send_registration_otp(user.email, code)

        return Response(
            {
                "status": "verification_required",
                "token": token,
                "otp_destination": user.email,
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = CustomUser.objects.filter(email=email).first()
        if not user:
            # Para evitar enumeração de contas, retornamos sucesso genérico
            return Response(
                {"status": "verification_required", "token": ""},
                status=status.HTTP_200_OK,
            )

        # Revoga desafios anteriores de reset
        MFAChallenge.objects.filter(
            user=user, purpose=MFAChallenge.Purpose.PASSWORD_RESET, used=False
        ).update(revoked=True)

        token, jti = PartialTokenService.create(
            user, MFAChallenge.Purpose.PASSWORD_RESET
        )
        code = generate_otp()

        MFAChallenge.objects.create(
            user=user,
            jti=jti,
            purpose=MFAChallenge.Purpose.PASSWORD_RESET,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        send_mail(
            subject="Recuperação de Senha EasyRota",
            message=f"Seu código de recuperação de senha é: {code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {
                "status": "verification_required",
                "token": token,
                "otp_destination": user.email,
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        code = serializer.validated_data["code"]
        new_password = serializer.validated_data["password"]

        if not token:
            raise AuthenticationFailed("Token de verificação inválido.")

        try:
            payload = PartialTokenService.decode(token)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed(
                "O link de recuperação expirou. Solicite novamente."
            )
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Token de verificação inválido.")

        if (
            payload["type"] != "2fa_pending"
            or payload["purpose"] != MFAChallenge.Purpose.PASSWORD_RESET
        ):
            raise AuthenticationFailed("Invalid token type")

        challenge = (
            MFAChallenge.objects
            .filter(jti=payload["jti"])
            .select_related("user")
            .first()
        )

        if (
            not challenge
            or challenge.used
            or challenge.revoked
            or challenge.is_expired()
        ):
            raise AuthenticationFailed("Desafio inválido ou expirado.")

        if not challenge.can_attempt():
            challenge.revoked = True
            challenge.save(update_fields=["revoked"])
            raise AuthenticationFailed("Muitas tentativas falhas. Solicite novamente.")

        challenge.attempts += 1
        challenge.save(update_fields=["attempts"])

        if not check_password(code, challenge.code_hash):
            raise AuthenticationFailed("Código de recuperação inválido.")

        challenge.used = True
        challenge.save(update_fields=["used"])

        user = challenge.user
        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response({"status": "password_reset_success"}, status=status.HTTP_200_OK)


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

        challenge = consume_registration_challenge(
            serializer.validated_data["token"], serializer.validated_data["code"]
        )

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
            {"tokens": {"access": data["access"]}},
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


class DeleteOwnAccountView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request):
        user = request.user

        allowed = hasattr(user, "student_profile") or hasattr(
            user, "civil_servant_profile"
        )

        if not allowed:
            return Response(status=403)

        serializer = DeleteOwnAccountSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user.delete()

        response = Response(status=204)

        response.delete_cookie(
            "refresh_token",
            path=reverse("refresh-token"),
        )

        return response

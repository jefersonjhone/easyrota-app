import logging
from datetime import timedelta
from textwrap import dedent

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
    RequestReactivationSerializer,
    ResendOTPSerializer,
    StudentRegistrationSerializer,
    Verify2FASerializer,
    VerifyPasswordResetOTPSerializer,
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

OTP_EXPIRATION_MINUTES = 10


def build_otp_email_html(title, intro, code, helper_text):
    preheader = f"{title}: use o código {code} na EasyRota."

    return dedent(f"""
        <!doctype html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {{
              margin: 0;
              background: #f4f7fb;
              color: #1f2937;
              font-family: Arial, Helvetica, sans-serif;
            }}
            .preheader {{
              display: none;
              max-height: 0;
              overflow: hidden;
              opacity: 0;
            }}
            .wrapper {{
              width: 100%;
              padding: 32px 16px;
            }}
            .card {{
              max-width: 560px;
              margin: 0 auto;
              overflow: hidden;
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 18px;
            }}
            .header {{
              padding: 28px 32px;
              background: #fff7ed;
              border-bottom: 1px solid #fed7aa;
            }}
            .brand {{
              display: inline-block;
              margin-bottom: 18px;
              color: #bb4d00;
              font-size: 14px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }}
            h1 {{
              margin: 0;
              color: #111827;
              font-size: 24px;
              line-height: 1.25;
            }}
            .content {{
              padding: 30px 32px;
            }}
            p {{
              margin: 0 0 16px;
              color: #4b5563;
              font-size: 16px;
              line-height: 1.6;
            }}
            .code {{
              margin: 24px 0;
              padding: 20px 24px;
              background: #111827;
              color: #ffffff;
              border-radius: 14px;
              font-family: Consolas, Menlo, monospace;
              font-size: 34px;
              font-weight: 700;
              letter-spacing: 0.22em;
              text-align: center;
            }}
            .notice {{
              padding: 14px 16px;
              background: #f9fafb;
              border-left: 4px solid #bb4d00;
              border-radius: 10px;
              color: #374151;
              font-size: 14px;
            }}
            .footer {{
              padding: 20px 32px 28px;
              color: #6b7280;
              font-size: 13px;
              line-height: 1.5;
            }}
            @media (max-width: 480px) {{
              .wrapper {{
                padding: 18px 10px;
              }}
              .header,
              .content,
              .footer {{
                padding-left: 20px;
                padding-right: 20px;
              }}
              .code {{
                font-size: 28px;
                letter-spacing: 0.16em;
              }}
            }}
          </style>
        </head>
        <body>
          <div class="preheader">{preheader}</div>
          <table role="presentation" class="wrapper" cellspacing="0">
            <tr>
              <td>
                <table role="presentation" class="card" cellspacing="0">
                  <tr>
                    <td class="header">
                      <span class="brand">EasyRota</span>
                      <h1>{title}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="content">
                      <p>Olá!</p>
                      <p>{intro}</p>
                      <div class="code">{code}</div>
                      <p class="notice">{helper_text}</p>
                    </td>
                  </tr>
                  <tr>
                    <td class="footer">
                      Se você não solicitou este código, ignore este e-mail.
                      Para sua segurança, nunca compartilhe este código com
                      outras pessoas.
                      <br><br>
                      Equipe EasyRota
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
    """).strip()


def build_otp_text_message(title, intro, code, helper_text):
    return dedent(f"""
        {title}

        Olá!

        {intro}

        Código EasyRota: {code}

        {helper_text}

        Se você não solicitou este código, ignore este e-mail.
        Para sua segurança, nunca compartilhe este código com outras pessoas.

        Equipe EasyRota
    """).strip()


def build_verification_email(code, purpose="registration"):
    if purpose == "reactivation":
        subject = "Código para reativar sua conta EasyRota"
        title = "Vamos reativar sua conta"
        intro = (
            "Recebemos uma solicitação para reativar sua conta. Use o código "
            "abaixo na tela de verificação para voltar a acessar a plataforma."
        )
    else:
        subject = "Código de verificação EasyRota"
        title = "Confirme seu cadastro"
        intro = (
            "Seu cadastro está quase pronto. Use o código abaixo para confirmar "
            "seu e-mail institucional e ativar sua conta."
        )

    helper_text = (
        f"Este código expira em {OTP_EXPIRATION_MINUTES} minutos. "
        "Caso ele expire, solicite um novo código pela própria tela."
    )

    return (
        subject,
        build_otp_text_message(title, intro, code, helper_text),
        build_otp_email_html(title, intro, code, helper_text),
    )


def build_password_reset_email(code):
    subject = "Código para recuperar sua senha EasyRota"
    title = "Recupere sua senha"
    intro = (
        "Recebemos uma solicitação para redefinir sua senha. Use o código "
        "abaixo para confirmar sua identidade e continuar a recuperação."
    )
    helper_text = (
        f"Este código expira em {OTP_EXPIRATION_MINUTES} minutos. "
        "Se ele expirar, peça um novo código de recuperação."
    )

    return (
        subject,
        build_otp_text_message(title, intro, code, helper_text),
        build_otp_email_html(title, intro, code, helper_text),
    )

def build_qr_code_email(link):
    subject = "Qr Code para checkin na sua viagem com EasyRota"
    title = "Acesse seu QR Code"
    intro = (
        "Você foi adicionado como convidado em uma viagem com a EasyRota"
        "Acesse o link abaixo para verificar mais informações"
    )
    helper_text = (
        ""
    )

    return (
        subject,
        build_otp_text_message(title, intro, link, helper_text),
        build_otp_email_html(title, intro, link, helper_text),
    )

def send_qr_code_email(email, link):
    subject, message, html_message = build_qr_code_email(link)

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
            html_message=html_message,
        )
    except Exception:
        logger.exception("Erro ao enviar código OTP")

def unauthorized(message):
    response = Response(
        {"detail": message},
        status=401,
    )

    response.delete_cookie("refresh_token")

    return response


def send_registration_otp(email, code, purpose="registration"):
    subject, message, html_message = build_verification_email(code, purpose)

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
            html_message=html_message,
        )
    except Exception:
        logger.exception("Erro ao enviar código OTP")


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
            samesite="None",
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

        if challenge.purpose == MFAChallenge.Purpose.REGISTER:
            challenge.user.is_active = True
            challenge.user.save(update_fields=["is_active"])

        elif challenge.purpose == MFAChallenge.Purpose.REACTIVATE:
            challenge.user.is_deleted = False
            challenge.user.deleted_at = None
            challenge.user.is_active = True

            challenge.user.save(
                update_fields=[
                    "is_deleted",
                    "deleted_at",
                    "is_active",
                ]
            )

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


class ResendReactivationOTPView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ResendOTPSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = CustomUser.objects.filter(email=email, is_deleted=True).first()
        if not user:
            return Response(
                {"detail": "Conta não encontrada ou não está desativada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Revoga desafios anteriores
        MFAChallenge.objects.filter(
            user=user, purpose=MFAChallenge.Purpose.REACTIVATE, used=False
        ).update(revoked=True)

        token, jti = PartialTokenService.create(user, MFAChallenge.Purpose.REACTIVATE)
        code = generate_otp()

        print("seu código é: ", code)

        MFAChallenge.objects.create(
            user=user,
            jti=jti,
            purpose=MFAChallenge.Purpose.REACTIVATE,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        send_registration_otp(user.email, code, purpose="reactivation")

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

        user = CustomUser.objects.filter(email=email, is_active=True).first()
        if not user:
            raise serializer.ValidationError({
                "email": "Usuário não encontrado ou inativo."
            })

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
        subject, message, html_message = build_password_reset_email(code)

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
            html_message=html_message,
        )

        return Response(
            {
                "status": "verification_required",
                "token": token,
                "otp_destination": user.email,
            },
            status=status.HTTP_200_OK,
        )


def check_challenge_code(token, code, purpose=None):
    try:
        payload = PartialTokenService.decode(token)
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("O link expirou. Solicite novamente.")
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Token de verificação inválido.")

    if payload.get("type") != "2fa_pending":
        raise AuthenticationFailed("Tipo de token inválido.")

    if purpose and payload.get("purpose") != purpose:
        raise AuthenticationFailed("Propósito de token inválido.")

    challenge = (
        MFAChallenge.objects.filter(jti=payload["jti"]).select_related("user").first()
    )

    if not challenge:
        raise AuthenticationFailed("Desafio não encontrado")
    if challenge.used:
        raise AuthenticationFailed("Desafio já utilizado")
    if challenge.revoked:
        raise AuthenticationFailed("Desafio revogado")
    if challenge.is_expired():
        raise AuthenticationFailed("Desafio expirado")

    if not challenge.can_attempt():
        challenge.revoked = True
        challenge.save(update_fields=["revoked"])
        raise AuthenticationFailed("Muitas tentativas falhas. Solicite novamente.")

    challenge.attempts += 1
    challenge.save(update_fields=["attempts"])

    if not check_password(code, challenge.code_hash):
        raise AuthenticationFailed("Código inválido")

    return challenge


class VerifyPasswordResetOTPView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = VerifyPasswordResetOTPSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        check_challenge_code(
            serializer.validated_data["token"],
            serializer.validated_data["code"],
            purpose=MFAChallenge.Purpose.PASSWORD_RESET,
        )

        return Response({"status": "code_valid"}, status=status.HTTP_200_OK)


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
            samesite="None",
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
        except CustomUser.DoesNotExist:
            response = Response(
                {"detail": "Refresh token user not found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            response.delete_cookie(
                "refresh_token",
                path="/",
            )
            return response

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
                samesite="None",
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

        user.is_deleted = True
        user.deleted_at = timezone.now()
        user.is_active = False
        user.save(
            update_fields=[
                "is_deleted",
                "deleted_at",
                "is_active",
            ]
        )

        response = Response(status=204)

        response.delete_cookie(
            "refresh_token",
            path=reverse("refresh-token"),
        )

        return response


class RequestReactivationView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = RequestReactivationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = CustomUser.objects.filter(email=email, is_deleted=True).first()

        if not user:
            return Response({"detail": "A conta não foi encontrada."}, status=404)

        MFAChallenge.objects.filter(
            user=user,
            purpose=MFAChallenge.Purpose.REACTIVATE,
            used=False,
        ).update(revoked=True)

        token, jti = PartialTokenService.create(user, MFAChallenge.Purpose.REACTIVATE)

        code = generate_otp()
        print("Código reativação:", code)

        MFAChallenge.objects.create(
            user=user,
            jti=jti,
            purpose=MFAChallenge.Purpose.REACTIVATE,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        send_registration_otp(user.email, code, purpose="reactivation")

        return Response({
            "status": "verification_required",
            "token": token,
            "otp_destination": user.email,
        })

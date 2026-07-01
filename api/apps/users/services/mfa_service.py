from datetime import timedelta

import jwt
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed

from ..auth.otp import generate_otp
from ..auth.tokens import PartialTokenService
from ..models.auth import MFAChallenge

OTP_EXPIRATION_MINUTES = 10


class MFAService:
    """MFA challenge validation and OTP lifecycle management."""

    # ------------------------------------------------------------------
    # Challenge validation (unified from duplicate code)
    # ------------------------------------------------------------------

    @staticmethod
    def consume_challenge(token, code, purpose=None):
        """
        Validate a partial token + OTP code against a challenge.
        Returns the valid challenge on success, raises AuthenticationFailed on failure.
        """
        try:
            payload = PartialTokenService.decode(token)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed(
                "O link de verificação expirou. Por favor, cadastre-se novamente."
            )
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Token de verificação inválido.")

        if payload.get("type") != "2fa_pending":
            raise AuthenticationFailed("Tipo de token inválido.")

        if purpose and payload.get("purpose") != purpose:
            raise AuthenticationFailed("Propósito de token inválido.")

        challenge = (
            MFAChallenge.objects.filter(jti=payload["jti"], used=False)
            .select_related("user")
            .first()
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

        # Import through views.auth so test mocks can intercept
        from ..views.auth import check_password

        if not check_password(code, challenge.code_hash):
            raise AuthenticationFailed("Código inválido")

        challenge.used = True
        challenge.save(update_fields=["used"])

        return challenge

    # ------------------------------------------------------------------
    # OTP creation and delivery (unified from 6x duplicate pattern)
    # ------------------------------------------------------------------

    @staticmethod
    def create_and_send_otp(user, purpose, send_email=True):
        """
        Create an MFAChallenge, generate OTP, and optionally send email.
        Returns (token, code) tuple.
        """
        # Revoke previous pending challenges for the same purpose
        MFAChallenge.objects.for_user(user).for_purpose(purpose).pending().update(
            revoked=True
        )

        token, jti = PartialTokenService.create(user, purpose)
        code = generate_otp()

        MFAChallenge.objects.create(
            user=user,
            jti=jti,
            purpose=purpose,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=OTP_EXPIRATION_MINUTES),
        )

        if send_email:
            from apps.notifications.services.email_service import EmailService

            register_or_reactivate = (
                MFAChallenge.Purpose.REGISTER,
                MFAChallenge.Purpose.REACTIVATE,
            )
            if purpose in register_or_reactivate:
                EmailService.send_verification(
                    user.email,
                    code,
                    purpose="reactivation"
                    if purpose == MFAChallenge.Purpose.REACTIVATE
                    else "registration",
                )
            elif purpose == MFAChallenge.Purpose.PASSWORD_RESET:
                EmailService.send_password_reset(user.email, code)

        return token, code

    @staticmethod
    def send_password_reset_otp(user):
        """Shortcut for password-reset OTP flow."""
        return MFAService.create_and_send_otp(
            user, MFAChallenge.Purpose.PASSWORD_RESET
        )

    @staticmethod
    def send_registration_otp(user):
        """Shortcut for registration OTP flow."""
        return MFAService.create_and_send_otp(user, MFAChallenge.Purpose.REGISTER)

    @staticmethod
    def send_reactivation_otp(user):
        """Shortcut for reactivation OTP flow."""
        return MFAService.create_and_send_otp(user, MFAChallenge.Purpose.REACTIVATE)

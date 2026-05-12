import hashlib
import uuid
from datetime import timedelta

import jwt
from django.conf import settings
from django.utils import timezone


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class PartialTokenService:
    @staticmethod
    def create(user, purpose):

        jti = str(uuid.uuid4())

        payload = {
            "sub": str(user.id),
            "type": "2fa_pending",
            "purpose": purpose,
            "jti": jti,
            "iat": int(timezone.now().timestamp()),
            "exp": int((timezone.now() + timedelta(minutes=5)).timestamp()),
        }

        token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

        return token, jti

    @staticmethod
    def decode(token):

        return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

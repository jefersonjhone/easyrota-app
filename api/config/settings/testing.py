from .base import *

DEBUG = True

ALLOWED_HOSTS = ["*"]

"""
only for testing.
if you want test real hasher use overwrite settings:

from django.test import override_settings
    
    @override_settings(
        PASSWORD_HASHERS=[
            "django.contrib.auth.hashers.PBKDF2PasswordHasher",
        ]
    )
    def test_real_password_hashing():
        ...
"""
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
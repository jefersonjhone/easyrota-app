import os

from .testing import *  # noqa: F403

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-e2e-only-key-for-tests")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "e2e.sqlite3",  # noqa: F405
        "OPTIONS": {
            "timeout": 20,
        },
    }
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
DEFAULT_FROM_EMAIL = "e2e@easyrota.test"

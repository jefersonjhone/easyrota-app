from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

LOG_DIR = BASE_DIR / "logs"

if not LOG_DIR.exists():
    os.makedirs(LOG_DIR, exist_ok=True)

LOGGING["handlers"]["file"] = {
    "level": "DEBUG",
    "class": "logging.handlers.RotatingFileHandler",
    "filename": LOG_DIR / "api_dev.log",
    "maxBytes": 1024 * 1024 * 10,  # 10MB
    "backupCount": 5,
    "formatter": "verbose",
}

LOGGING["loggers"]["api"]["handlers"].append("file")
LOGGING["loggers"]["api"]["level"] = "DEBUG"

INSTALLED_APPS += [
    "drf_spectacular",
]

REST_FRAMEWORK["DEFAULT_SCHEMA_CLASS"] = "drf_spectacular.openapi.AutoSchema"

SPECTACULAR_SETTINGS = {
    "TITLE": "API EasyRota - Dev",
    "DESCRIPTION": "Development Enviroment",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": True,
    "SERVE_PERMISSIONS": ["rest_framework.permissions.AllowAny"],
}

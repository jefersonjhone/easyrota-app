from .base import *


DEBUG = True
ALLOWED_HOSTS = ["*"]

LOG_DIR = BASE_DIR / 'logs'

if not LOG_DIR.exists():
    os.makedirs(LOG_DIR, exist_ok=True)

LOGGING['handlers']['file'] = {
    'level': 'DEBUG',
    'class': 'logging.handlers.RotatingFileHandler',
    'filename': LOG_DIR/ "api_dev.log",
    'maxBytes': 1024 * 1024 * 10, # 10MB
    'backupCount': 5,
    'formatter': 'verbose',
}

LOGGING['loggers']['api']['handlers'].append('file')
LOGGING['loggers']['api']['level'] = 'DEBUG'
import logging

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from webpush import send_user_notification

logger = logging.getLogger("api")


class Command(BaseCommand):
    help = "Envia uma notificação de teste para todos os usuários inscritos"

    def handle(self, *args, **options):
        User = get_user_model()
        users = User.objects.all()
        payload = {
            "head": "Teste do EasyRota",
            "body": "🚀 Integração de Notificações funcionando!",
            "url": "/app/",
        }
        for user in users:
            self.stdout.write(f"Tentando enviar para: {user.email}")
            try:
                send_user_notification(user=user, payload=payload, ttl=1000)
            except Exception:
                logger.exception(
                    "Erro ao enviar push para %s",
                    user.email,
                )
            else:
                logger.info(f"email enviado com sucesso para {user.email}")

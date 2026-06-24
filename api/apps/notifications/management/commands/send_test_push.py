import logging

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from ...services.push_service import PushService

logger = logging.getLogger("api")


class Command(BaseCommand):
    help = "Envia uma notificação push de teste para todos os usuários"

    def handle(self, *args, **options):
        User = get_user_model()
        users = User.objects.all()
        payload = {
            "head": "Teste do EasyRota",
            "body": "🚀 Integração de Notificações funcionando!",
            "url": "/app/",
        }

        sent = PushService.send_to_users(users, payload)
        self.stdout.write(
            self.style.SUCCESS(
                f"Push enviado para {sent} de {users.count()} usuário(s)."
            )
        )

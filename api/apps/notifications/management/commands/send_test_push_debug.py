from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from ...backends.push_backend import PushBackend


class Command(BaseCommand):
    help = (
        "Envia uma notificação push de teste para todos os usuários "
        "com debug detalhado (via PushBackend direto)."
    )

    def handle(self, *args, **options):
        User = get_user_model()
        users = User.objects.all()
        backend = PushBackend()
        payload = {
            "head": "Teste do EasyRota",
            "body": "🚀 Integração de Notificações funcionando!",
            "url": "/app/",
        }

        for user in users:
            self.stdout.write(f"Tentando enviar para: {user.email}")
            try:
                success = backend.send(user, payload)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Envio {'OK' if success else 'FALHOU'} para {user.email}."
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(
                        f"Erro ao enviar para {user.email}: {type(e).__name__} - {e}"
                    )
                )

        self.stdout.write(self.style.SUCCESS("Comando de teste finalizado."))

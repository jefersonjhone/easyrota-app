from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from webpush import send_user_notification

class Command(BaseCommand):
    help = "Envia uma notificação de teste para todos os usuários inscritos"

    def handle(self, *args, **options):
        User = get_user_model()
        users = User.objects.all()
        payload = {
            "head": "Teste do EasyRota",
            "body": "🚀 Integração de Notificações funcionando!",
            "url": "/app/"
        }
        for user in users:
            self.stdout.write(f"Tentando enviar para: {user.email}")
            try:
                send_user_notification(user=user, payload=payload, ttl=1000)
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Erro ao enviar para {user.email}: {e}"))
        
        self.stdout.write(self.style.SUCCESS("Comando de teste finalizado."))

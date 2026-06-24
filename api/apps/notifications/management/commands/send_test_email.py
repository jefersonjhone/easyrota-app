from django.core.management.base import BaseCommand

from ...services.email_service import EmailService


class Command(BaseCommand):
    help = "Envia um email de teste usando o EmailService (Resend)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--to",
            type=str,
            required=True,
            help="Email destinatário",
        )

    def handle(self, *args, **options):
        email = options["to"]

        try:
            EmailService._send(
                email=email,
                subject="Teste EasyRota",
                title="Teste EasyRota",
                intro="Este é um email de teste enviado via NotificationService.",
                code="000000",
                helper="Se você recebeu este email, a integração está funcionando.",
            )
            self.stdout.write(
                self.style.SUCCESS(f"Email enviado com sucesso para: {email}")
            )
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Erro ao enviar email: {e}"))

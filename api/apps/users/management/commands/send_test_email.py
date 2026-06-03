import resend
from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Envia um email de teste usando Resend"

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
            resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [email],
            "subject": "Teste EasyRota",
            "html": "<h1>EasyRota</h1><p>Resend funcionando 🚀</p>",
        })
            self.stdout.write(
                self.style.SUCCESS(
                    f"Email enviado com sucesso para: {email}"
                )
            )

        except Exception as e:
            self.stderr.write(
                self.style.ERROR(
                    f"Erro ao enviar email: {e}"
                )
            )
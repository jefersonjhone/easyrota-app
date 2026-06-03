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
        resend.api_key = settings.RESEND_API_KEY

        email = options["to"]

        try:
            response = resend.Emails.send(
                {
                    "from": "onboarding@resend.dev",
                    "to": [email],
                    "subject": "Teste EasyRota",
                    "html": """
                    <h1>EasyRota</h1>
                    <p>Se você recebeu este email, o Resend está funcionando 🚀</p>
                    """,
                }
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Email enviado com sucesso: {response}"
                )
            )

        except Exception as e:
            self.stderr.write(
                self.style.ERROR(
                    f"Erro ao enviar email: {e}"
                )
            )
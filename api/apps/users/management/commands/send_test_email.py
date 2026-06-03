import resend
from django.conf import settings
from django.core.mail import send_mail
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
            send_mail(
                subject="Teste EasyRota",
                message="Se você recebeu este email, o Resend via Django está funcionando 🚀",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message="""
                <h1>EasyRota</h1>
                <p>Se você recebeu este email, o Resend via Django está funcionando 🚀</p>
                """,
                fail_silently=False,
            )

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
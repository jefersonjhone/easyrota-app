import logging
from textwrap import dedent

from django.conf import settings

logger = logging.getLogger("api")

OTP_EXPIRATION_MINUTES = 10


# ============================================================================
# EmailService — builds and sends transactional emails
# ============================================================================


class EmailService:
    """Build and send OTP/verification emails."""

    @staticmethod
    def _build_html(title, intro, code, helper_text):
        preheader = f"{title}: use o código {code} na EasyRota."
        return dedent(f"""
            <!doctype html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {{
                  margin: 0;
                  background: #f4f7fb;
                  color: #1f2937;
                  font-family: Arial, Helvetica, sans-serif;
                }}
                .preheader {{
                  display: none;
                  max-height: 0;
                  overflow: hidden;
                  opacity: 0;
                }}
                .wrapper {{
                  width: 100%;
                  padding: 32px 16px;
                }}
                .card {{
                  max-width: 560px;
                  margin: 0 auto;
                  overflow: hidden;
                  background: #ffffff;
                  border: 1px solid #e5e7eb;
                  border-radius: 18px;
                }}
                .header {{
                  padding: 28px 32px;
                  background: #fff7ed;
                  border-bottom: 1px solid #fed7aa;
                }}
                .brand {{
                  display: inline-block;
                  margin-bottom: 18px;
                  color: #bb4d00;
                  font-size: 14px;
                  font-weight: 700;
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                }}
                h1 {{
                  margin: 0;
                  color: #111827;
                  font-size: 24px;
                  line-height: 1.25;
                }}
                .content {{
                  padding: 30px 32px;
                }}
                p {{
                  margin: 0 0 16px;
                  color: #4b5563;
                  font-size: 16px;
                  line-height: 1.6;
                }}
                .code {{
                  margin: 24px 0;
                  padding: 20px 24px;
                  background: #111827;
                  color: #ffffff;
                  border-radius: 14px;
                  font-family: Consolas, Menlo, monospace;
                  font-size: 34px;
                  font-weight: 700;
                  letter-spacing: 0.22em;
                  text-align: center;
                }}
                .notice {{
                  padding: 14px 16px;
                  background: #f9fafb;
                  border-left: 4px solid #bb4d00;
                  border-radius: 10px;
                  color: #374151;
                  font-size: 14px;
                }}
                .footer {{
                  padding: 20px 32px 28px;
                  color: #6b7280;
                  font-size: 13px;
                  line-height: 1.5;
                }}
                @media (max-width: 480px) {{
                  .wrapper {{
                    padding: 18px 10px;
                  }}
                  .header,
                  .content,
                  .footer {{
                    padding-left: 20px;
                    padding-right: 20px;
                  }}
                  .code {{
                    font-size: 28px;
                    letter-spacing: 0.16em;
                  }}
                }}
              </style>
            </head>
            <body>
              <div class="preheader">{preheader}</div>
              <table role="presentation" class="wrapper" cellspacing="0">
                <tr>
                  <td>
                    <table role="presentation" class="card" cellspacing="0">
                      <tr>
                        <td class="header">
                          <span class="brand">EasyRota</span>
                          <h1>{title}</h1>
                        </td>
                      </tr>
                      <tr>
                        <td class="content">
                          <p>Olá!</p>
                          <p>{intro}</p>
                          <div class="code">{code}</div>
                          <p class="notice">{helper_text}</p>
                        </td>
                      </tr>
                      <tr>
                        <td class="footer">
                          Se você não solicitou este código, ignore este e-mail.
                          Para sua segurança, nunca compartilhe este código com
                          outras pessoas.
                          <br><br>
                          Equipe EasyRota
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
        """).strip()

    @staticmethod
    def _build_text(title, intro, code, helper_text):
        return dedent(f"""
            {title}

            Olá!

            {intro}

            Código EasyRota: {code}

            {helper_text}

            Se você não solicitou este código, ignore este e-mail.
            Para sua segurança, nunca compartilhe este código com outras pessoas.

            Equipe EasyRota
        """).strip()

    @staticmethod
    def _build_verification(code, purpose="registration"):
        if purpose == "reactivation":
            subject = "Código para reativar sua conta EasyRota"
            title = "Vamos reativar sua conta"
            intro = (
                "Recebemos uma solicitação para reativar sua conta. Use o código "
                "abaixo na tela de verificação para voltar a acessar a plataforma."
            )
        else:
            subject = "Código de verificação EasyRota"
            title = "Confirme seu cadastro"
            intro = (
                "Seu cadastro está quase pronto. Use o código abaixo para confirmar "
                "seu e-mail institucional e ativar sua conta."
            )

        helper = (
            f"Este código expira em {OTP_EXPIRATION_MINUTES} minutos. "
            "Caso ele expire, solicite um novo código pela própria tela."
        )
        return subject, title, intro, helper

    @staticmethod
    def _build_password_reset(code):
        subject = "Código para recuperar sua senha EasyRota"
        title = "Recupere sua senha"
        intro = (
            "Recebemos uma solicitação para redefinir sua senha. Use o código "
            "abaixo para confirmar sua identidade e continuar a recuperação."
        )
        helper = (
            f"Este código expira em {OTP_EXPIRATION_MINUTES} minutos. "
            "Se ele expirar, peça um novo código de recuperação."
        )
        return subject, title, intro, helper

    @staticmethod
    def send_verification(email, code, purpose="registration"):
        """Send a verification/reactivation email with OTP code."""
        subject, title, intro, helper = EmailService._build_verification(code, purpose)
        return EmailService._send(email, subject, title, intro, code, helper)

    @staticmethod
    def send_password_reset(email, code):
        """Send a password-reset email with OTP code."""
        subject, title, intro, helper = EmailService._build_password_reset(code)
        return EmailService._send(email, subject, title, intro, code, helper)

    @staticmethod
    def _send(email, subject, title, intro, code, helper):
        # Import send_mail through users.views.auth so test mocks can intercept
        # (lazy import avoids circular dependency at module-load time)
        from apps.users.views.auth import send_mail

        message = EmailService._build_text(title, intro, code, helper)
        html_message = EmailService._build_html(title, intro, code, helper)

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
                html_message=html_message,
            )
        except Exception:
            logger.exception("Erro ao enviar código OTP para %s", email)

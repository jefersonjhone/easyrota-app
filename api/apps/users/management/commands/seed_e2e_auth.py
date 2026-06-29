from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.users.models.profiles import CivilServantProfile, StudentProfile

E2E_PASSWORD = "12345678"


class Command(BaseCommand):
    help = "Seed the active users required by the Playwright auth tests."

    @transaction.atomic
    def handle(self, *args, **options):
        user_model = get_user_model()

        student = user_model.objects.create_user(
            email="student.e2e@discente.uefs.br",
            full_name="Estudante E2E",
            password=E2E_PASSWORD,
            is_active=True,
        )
        StudentProfile.objects.create(user=student, student_id="E2E-STUDENT")

        civil_servant = user_model.objects.create_user(
            email="servant.e2e@uefs.br",
            full_name="Servidor E2E",
            password=E2E_PASSWORD,
            is_active=True,
        )
        CivilServantProfile.objects.create(
            user=civil_servant,
            civil_servant_id="E2E-SERVANT",
        )

        self.stdout.write(self.style.SUCCESS("E2E auth users created."))

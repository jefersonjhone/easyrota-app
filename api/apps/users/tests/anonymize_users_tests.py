from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from apps.trips.management.commands.run_scheduler import anonymize_user_past_30_days
from apps.users.models.profiles import (
    CivilServantProfile,
    StudentProfile,
)
from apps.users.models.user import CustomUser


class AnonymizeUsersTests(APITestCase):
    def setUp(self):
        self.client = APIClient()

    def _create_civil_servant_and_guests(self):
        civ_user = CustomUser.objects.create_user(
            email="civil.servant@test.com",
            full_name="Civil Servant",
            password="12345678",
            is_active=True,
        )
        civ_profile = CivilServantProfile.objects.create(
            user=civ_user,
            civil_servant_id="11112222",
        )

        civ_profile.guest_set.create(
            name="Guest One",
            cpf="33334444",
        )
        civ_profile.guest_set.create(
            name="Guest Two",
            cpf="55556666",
        )

    def _create_student(self):
        student_user = CustomUser.objects.create_user(
            email="student@test.com",
            full_name="Student Test",
            password="12345678",
            is_active=True,
        )
        StudentProfile.objects.create(
            user=student_user,
            student_id="77778888",
        )

    def test_anonymize_civil_servant(self):
        self._create_civil_servant_and_guests()

        civ_profile = CivilServantProfile.objects.get(civil_servant_id="11112222")
        user = civ_profile.user
        user.is_deleted = True
        user.deleted_at = timezone.now() - timedelta(days=31)
        user.is_active = False
        user.save()

        anonymize_user_past_30_days()

        user.refresh_from_db()
        civ_profile.refresh_from_db()

        self.assertEqual(user.email, f"deleted_{user.id}@anonymize")
        self.assertEqual(user.full_name, "Usuário deletado")
        self.assertEqual(civ_profile.civil_servant_id, f"DEL_{user.id}")

        for guest in civ_profile.guest_set.all():
            self.assertEqual(guest.name, "Convidado deletado")
            self.assertEqual(guest.cpf, f"DEL_{guest.id}")

    def test_anonymize_student(self):
        self._create_student()

        student_profile = StudentProfile.objects.get(student_id="77778888")
        user = student_profile.user
        user.is_deleted = True
        user.deleted_at = timezone.now() - timedelta(days=31)
        user.is_active = False
        user.save()

        anonymize_user_past_30_days()
        student_profile.refresh_from_db()
        user.refresh_from_db()

        self.assertEqual(user.email, f"deleted_{user.id}@anonymize")
        self.assertEqual(user.full_name, "Usuário deletado")
        self.assertEqual(student_profile.student_id, f"DEL_{user.id}")



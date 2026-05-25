from datetime import timedelta

from django.utils import timezone

from apps.users.models.profiles import (
    CivilServantProfile,
    DriverProfile,
    StudentProfile,
)


class UserSelectors:
    @staticmethod
    def get_users_distribution():
        students = StudentProfile.objects.count()
        civil_servants = CivilServantProfile.objects.count()

        total = students + civil_servants

        return {
            "total_users": total,
            "profiles": [
                {
                    "label": "Estudantes",
                    "value": students,
                },
                {
                    "label": "Servidores",
                    "value": civil_servants,
                },
            ],
        }

    @staticmethod
    def get_users_growth(days=7):
        if days == -1:
            return UserSelectors.get_users_distribution()

        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        students = StudentProfile.objects.filter(
            user__date_joined__date__range=[start_date, today]
        ).count()

        civil_servants = CivilServantProfile.objects.filter(
            user__date_joined__date__range=[start_date, today]
        ).count()

        return {
            "days": days,
            "total_users": students + civil_servants,
            "profiles": [
                {
                    "label": "Estudantes",
                    "value": students,
                },
                {
                    "label": "Servidores",
                    "value": civil_servants,
                },
            ],
        }

    @staticmethod
    def get_drivers_count():
        return {
            "total_drivers": DriverProfile.objects.count(),
        }

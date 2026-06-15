import logging
from datetime import timedelta

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django.core.management.base import BaseCommand
from django.utils import timezone
from django_apscheduler import util
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution

from apps.reservations.services import (
    send_trip_quorum_warning_notification,
    sync_trip_status,
)
from apps.trips.models import Trip
from apps.users.models import CustomUser

logger = logging.getLogger(__name__)


def check_upcoming_trips_quorum():
    now = timezone.now()
    target_time_start = now + timedelta(minutes=29, seconds=30)
    target_time_end = now + timedelta(minutes=30, seconds=30)

    trips = Trip.objects.filter(
        departure_timestamp__gte=target_time_start,
        departure_timestamp__lt=target_time_end,
        status__in=["CONFIRMADA", "RISCO DE CANCELAMENTO"],
    )

    for trip in trips:
        sync_trip_status(trip)

        if not trip.has_minimum_quorum:
            logger.info("Trip %s sem quórum mínimo. Disparando notificações.", trip.id)
            trip.status = "RISCO DE CANCELAMENTO"
            trip.save()

            send_trip_quorum_warning_notification(trip)
        else:
            logger.info("Trip %s com quórum mínimo atendido.", trip.id)


def anonymize_user_past_30_days():
    limit = timezone.now() - timedelta(days=30)
    
    users_to_anonymize = CustomUser.objects.filter(
        is_deleted=True,
        deleted_at__lte=limit,
    ).select_related(
        'student_profile', 
        'civil_servant_profile'
        ).prefetch_related(
        'civil_servant_profile__guest_set')
    
    for user in users_to_anonymize:
        user.anonymize_user()


@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    DjangoJobExecution.objects.delete_old_job_executions(max_age)


class Command(BaseCommand):
    help = "Runs APScheduler."

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING(
                "Scheduler iniciado. Verificando notificações a cada 1 minuto."
            )
        )
        scheduler = BlockingScheduler(timezone=timezone.get_current_timezone())
        scheduler.add_jobstore(DjangoJobStore(), "default")

        scheduler.add_job(
            check_upcoming_trips_quorum,
            trigger=CronTrigger(minute="*/1"),  # Every minute
            id="check_upcoming_trips_quorum",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Added job 'check_upcoming_trips_quorum'.")

        scheduler.add_job(
            anonymize_user_past_30_days,
            trigger=CronTrigger(hour="03", minute="00"),
            id="anonymize_user_past_30_days",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Added daily job: 'anonymize_user_past_30_days'.")

        scheduler.add_job(
            delete_old_job_executions,
            trigger=CronTrigger(day_of_week="mon", hour="00", minute="00"),
            id="delete_old_job_executions",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Added weekly job: 'delete_old_job_executions'.")

        try:
            logger.info("Starting scheduler...")
            scheduler.start()
        except KeyboardInterrupt:
            logger.info("Stopping scheduler...")
            scheduler.shutdown()
            logger.info("Scheduler shut down successfully!")

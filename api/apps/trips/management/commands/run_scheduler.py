import logging
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util

from apps.trips.models import Trip
from webpush import send_user_notification

logger = logging.getLogger(__name__)

def check_upcoming_trips_quorum():
    # Verifica viagens que vão sair em 30 a 31 minutos
    now = timezone.now()
    target_time_start = now + timedelta(minutes=30)
    target_time_end = now + timedelta(minutes=31)

    trips = Trip.objects.filter(
        departure_timestamp__gte=target_time_start,
        departure_timestamp__lt=target_time_end,
        status="CONFIRMADA"  # Ou outro status apropriado
    )

    for trip in trips:
        if not trip.has_minimum_quorum:
            logger.info("Trip %s sem quórum mínimo. Disparando notificações.", trip.id)
            trip.status = "RISCO DE CANCELAMENTO"
            trip.save()

            # Notifica os passageiros confirmados
            reservations = trip.reservation_set.filter(status="CONFIRMADA")
            for reservation in reservations:
                user = reservation.student.user if reservation.student else reservation.civil_servant.user
                payload = {
                    "head": "Aviso de Quórum Mínimo",
                    "body": f"A viagem {trip} não atingiu o quórum mínimo. Há risco de cancelamento.",
                    "url": "/app/",
                }
                try:
                    send_user_notification(user=user, payload=payload, ttl=1000)
                except Exception as e:
                    logger.error(f"Failed to send webpush notification to {user}: {e}")
        else:
            logger.info("Trip %s com quórum mínimo atendido.", trip.id)

@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    DjangoJobExecution.objects.delete_old_job_executions(max_age)

class Command(BaseCommand):
    help = "Runs APScheduler."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Scheduler iniciado. Verificando notificações a cada 1 minuto."))
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

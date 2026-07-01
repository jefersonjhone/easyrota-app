import logging
import time
from datetime import timedelta

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django.core.management.base import BaseCommand
from django.utils import timezone
from django_apscheduler import util
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution

from apps.notifications.services.notification_service import NotificationService
from apps.trips.models import Trip
from apps.trips.services.trip_status_service import TripStatusService
from apps.users.models import CustomUser

logger = logging.getLogger(__name__)


def check_upcoming_trips_quorum():
    start = time.monotonic()
    now = timezone.now()
    target_time_start = now + timedelta(minutes=29, seconds=30)
    target_time_end = now + timedelta(minutes=30, seconds=30)

    trips = Trip.objects.filter(
        departure_timestamp__gte=target_time_start,
        departure_timestamp__lt=target_time_end,
        status__in=["CONFIRMADA", "RISCO DE CANCELAMENTO"],
    )

    total = trips.count()
    stats = {"quorum_warning": 0, "quorum_ok": 0, "errors": 0}

    logger.info(
        "[upcoming_quorum] Checking %d trips departing between %s and %s",
        total,
        target_time_start,
        target_time_end,
    )

    for trip in trips:
        try:
            TripStatusService.sync_trip_status(trip)

            if not trip.has_minimum_quorum:
                stats["quorum_warning"] += 1
                logger.info(
                    "[upcoming_quorum] Trip %s sem quórum - enviando notificação.",
                    trip.id,
                )
                trip.status = "RISCO DE CANCELAMENTO"
                trip.save()
                NotificationService.notify_quorum_warning(trip)
            else:
                stats["quorum_ok"] += 1
                logger.info(
                    "[upcoming_quorum] Trip %s com quórum mínimo.",
                    trip.id,
                )
        except Exception as exc:
            stats["errors"] += 1
            logger.error(
                "[upcoming_quorum] Error processing trip %s: %s",
                trip.id,
                exc,
                exc_info=True,
            )

    elapsed = time.monotonic() - start
    logger.info(
        "[upcoming_quorum] Done: trips=%d ok=%d warn=%d err=%d %.2fs",
        total,
        stats["quorum_ok"],
        stats["quorum_warning"],
        stats["errors"],
        elapsed,
    )


def anonymize_user_past_30_days():
    start = time.monotonic()
    limit = timezone.now() - timedelta(days=30)

    users_to_anonymize = (
        CustomUser.objects
        .filter(
            is_deleted=True,
            deleted_at__lte=limit,
        )
        .select_related(
            "student_profile",
            "civil_servant_profile",
        )
        .prefetch_related(
            "civil_servant_profile__guest_set",
        )
    )

    total = users_to_anonymize.count()
    stats = {"anonymized": 0, "errors": 0}

    logger.info(
        "[anonymize_users] Found %d users to anonymize (deleted_at <= %s)",
        total,
        limit,
    )

    if total == 0:
        logger.info("[anonymize_users] Nothing to anonymize.")
        return

    for user in users_to_anonymize:
        try:
            user.anonymize_user()
            stats["anonymized"] += 1
            logger.info(
                "[anonymize_users] User %s (%s) anonymized.",
                user.id,
                user.email,
            )
        except Exception as exc:
            stats["errors"] += 1
            logger.error(
                "[anonymize_users] Error anonymizing user %s: %s",
                user.id,
                exc,
                exc_info=True,
            )

    elapsed = time.monotonic() - start
    logger.info(
        "[anonymize_users] Done: anonymized=%d, errors=%d, elapsed=%.2fs",
        stats["anonymized"],
        stats["errors"],
        elapsed,
    )


def process_past_due_trips():
    """
    Finds trips past their expected arrival that are stuck in a
    non-final status (CONFIRMADA, RISCO DE CANCELAMENTO, EM ANDAMENTO)
    and transitions them to CONCLUÍDA or CANCELADA via TripStatusService.
    """
    start = time.monotonic()
    today = timezone.localdate()

    stats = {"processed": 0, "changed": 0, "errors": 0}
    transitions = {}

    trips = (
        Trip.objects
        .filter(
            trip_date__lte=today,
        )
        .exclude(
            status__in=["CONCLUÍDA", "CANCELADA"],
        )
        .select_related("route")
    )

    total = trips.count()
    logger.info(
        "[past_due_trips] Scanning %d non-final trips with trip_date <= %s",
        total,
        today,
    )

    if total == 0:
        logger.info("[past_due_trips] Nothing to process.")
        return

    for trip in trips.iterator(chunk_size=100):
        old_status = trip.status
        try:
            TripStatusService.compute_status(trip)
            stats["processed"] += 1
            if trip.status != old_status:
                stats["changed"] += 1
                key = f"{old_status}→{trip.status}"
                transitions[key] = transitions.get(key, 0) + 1
                logger.info(
                    "[past_due_trips] Trip %s changed: %s → %s | route=%s, date=%s",
                    trip.id,
                    old_status,
                    trip.status,
                    trip.route_id,
                    trip.trip_date,
                )
        except Exception as exc:
            stats["errors"] += 1
            logger.error(
                "[past_due_trips] Error processing trip %s: %s",
                trip.id,
                exc,
                exc_info=True,
            )

    elapsed = time.monotonic() - start
    parts = [
        f"processed={stats['processed']}",
        f"changed={stats['changed']}",
        f"errors={stats['errors']}",
        f"elapsed={elapsed:.2f}s",
    ]
    if transitions:
        parts.append(
            "transitions=" + ", ".join(f"{k}={v}" for k, v in transitions.items())
        )
    logger.info("[past_due_trips] Done. %s", " | ".join(parts))


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
        scheduler = BlockingScheduler(
            timezone=timezone.get_current_timezone()
        )
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
            process_past_due_trips,
            trigger=CronTrigger(minute="*/10"),
            id="process_past_due_trips",
            max_instances=1,
            replace_existing=True,
        )
        logger.info("Added job 'process_past_due_trips' (every 10 min).")

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

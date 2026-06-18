import logging

from ..backends.push_backend import PushBackend

logger = logging.getLogger("api")


class PushService:
    """Send push notifications to users via WebPush."""

    @staticmethod
    def send_to_user(user, payload: dict) -> bool:
        """Send a push notification to a single user."""
        backend = PushBackend()
        return backend.send(user, payload)

    @staticmethod
    def send_to_users(users, payload: dict) -> int:
        """Send a push notification to multiple users. Returns count of successes."""
        backend = PushBackend()
        sent = 0
        for user in users:
            if backend.send(user, payload):
                sent += 1
        return sent

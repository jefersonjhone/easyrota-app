class BaseNotificationBackend:
    """
    Abstract contract for notification delivery channels.
    New channels (SMS, WhatsApp, etc.) implement this interface.
    """

    def send(self, recipient, payload: dict) -> bool:
        """Deliver a notification. Returns True on success."""
        raise NotImplementedError

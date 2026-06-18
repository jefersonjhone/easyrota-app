from django.db import models
from django.utils import timezone


class CustomUserQuerySet(models.QuerySet):
    """Custom queryset methods for CustomUser model."""

    def active(self):
        """Users with is_active=True and not deleted."""
        return self.filter(is_active=True, is_deleted=False)

    def inactive(self):
        """Users with is_active=False."""
        return self.filter(is_active=False)

    def deleted(self):
        """Users marked as deleted."""
        return self.filter(is_deleted=True)

    def staff(self):
        """Staff/admin users."""
        return self.filter(is_staff=True)

    def superusers(self):
        """Superuser accounts."""
        return self.filter(is_superuser=True)

    def reactivatable(self):
        """Deleted users still within the 30-day reactivation window."""
        from datetime import timedelta

        cutoff = timezone.now() - timedelta(days=30)
        return self.filter(is_deleted=True, deleted_at__gte=cutoff)

    def by_email(self, email):
        """Find user by exact email (case-insensitive)."""
        return self.filter(email__iexact=email)


class MFAChallengeQuerySet(models.QuerySet):
    """Custom queryset methods for MFAChallenge model."""

    def pending(self):
        """Challenges that are not used, not revoked, and not expired."""
        return self.filter(used=False, revoked=False, expires_at__gt=timezone.now())

    def for_user(self, user):
        """Challenges belonging to a specific user."""
        return self.filter(user=user)

    def for_purpose(self, purpose):
        """Challenges with a specific purpose."""
        return self.filter(purpose=purpose)

    def unexpired(self):
        """Challenges that haven't expired yet."""
        return self.filter(expires_at__gt=timezone.now())

    def revoke_pending(self):
        """Mark all pending challenges as revoked."""
        return self.pending().update(revoked=True)


class AllowedStaffQuerySet(models.QuerySet):
    """Custom queryset methods for AllowedStaff model."""

    def search(self, query):
        """Search by name or registration number."""
        from django.db.models import Q

        if not query:
            return self
        return self.filter(
            Q(name__icontains=query) | Q(registration_number__icontains=query)
        )

    def by_details(self, name, registration_number):
        """Find staff by exact name and registration (case-insensitive)."""
        return self.filter(
            name__iexact=name.strip(),
            registration_number=registration_number.strip(),
        )

    def by_registration(self, registration_number):
        """Find staff by registration number."""
        return self.filter(registration_number=registration_number.strip())

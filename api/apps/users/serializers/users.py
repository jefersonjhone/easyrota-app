from django.db import transaction
from rest_framework import serializers

from ..models.profiles import (
    AdministratorProfile,
    CivilServantProfile,
    StudentProfile,
)
from ..models.user import CustomUser


class UserSummarySerializer(serializers.ModelSerializer):
    """Compact public representation of a user account."""

    class Meta:
        model = CustomUser
        fields = ("id", "email", "full_name")


class StudentProfileSerializer(serializers.ModelSerializer):
    """Public representation of a student profile."""

    class Meta:
        model = StudentProfile
        fields = ("id", "student_id")


class CivilServantProfileSerializer(serializers.ModelSerializer):
    """Public representation of a civil servant profile."""

    class Meta:
        model = CivilServantProfile
        fields = ("id", "civil_servant_id")


class AdministratorProfileSerializer(serializers.ModelSerializer):
    """Public representation of an admin profile hierarchy."""

    class Meta:
        model = AdministratorProfile
        fields = ("id", "role", "level", "created_by")


class CreateSubAdminSerializer(serializers.Serializer):
    """Validate payload and create a delegated subadmin account."""

    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.CharField(max_length=30)
    level = serializers.ChoiceField(
        choices=AdministratorProfile.Level.choices,
        required=False,
        default=AdministratorProfile.Level.SUBADMIN,
    )

    def validate_email(self, value):
        email = value.strip().lower()
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def validate_level(self, value):
        if value != AdministratorProfile.Level.SUBADMIN:
            raise serializers.ValidationError(
                "Only subadmin creation is allowed by this endpoint."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        creator_profile = self.context["request"].user.admin_profile
        password = validated_data.pop("password")
        level = validated_data.pop("level", AdministratorProfile.Level.SUBADMIN)
        role = validated_data.pop("role")

        user = CustomUser.objects.create_user(
            password=password,
            is_staff=True,
            **validated_data,
        )
        admin_profile = AdministratorProfile.objects.create(
            user=user,
            level=level,
            created_by=creator_profile,
            role=role,
        )
        return {"user": user, "admin_profile": admin_profile}

    def to_representation(self, instance):
        return {
            "user": AuthenticatedUserWithAdminProfileSerializer(instance["user"]).data,
            "admin_profile": AdministratorProfileSerializer(
                instance["admin_profile"]
            ).data,
        }


class AuthenticatedUserWithAdminProfileSerializer(serializers.ModelSerializer):
    """Authenticated user representation, including admin hierarchy when available."""

    admin_profile = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ("id", "email", "full_name", "admin_profile")

    def get_admin_profile(self, obj):
        admin_profile = getattr(obj, "admin_profile", None)
        if admin_profile is None:
            return None
        return AdministratorProfileSerializer(admin_profile).data

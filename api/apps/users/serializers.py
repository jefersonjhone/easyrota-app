from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers

from .models import (
    AdministratorProfile,
    CivilServantProfile,
    CustomUser,
    StudentProfile,
)


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


class RegistrationSerializer(serializers.Serializer):
    """Validate signup payload and create the user plus its profile."""

    PROFILE_CHOICES = (
        ("student", "Student"),
        ("civil-servant", "Civil servant"),
    )

    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirmation = serializers.CharField(write_only=True)
    profile_type = serializers.ChoiceField(choices=PROFILE_CHOICES)
    student_id = serializers.CharField(
        required=False, write_only=True, allow_blank=False
    )
    civil_servant_id = serializers.CharField(
        required=False, write_only=True, allow_blank=False
    )

    def validate_email(self, value):
        """Normalize the incoming email before uniqueness checks."""
        return value.strip().lower()

    def validate(self, attrs):
        """Enforce password confirmation and profile-specific payload rules."""
        if attrs["password"] != attrs["password_confirmation"]:
            raise serializers.ValidationError({
                "password_confirmation": "Passwords do not match."
            })

        profile_type = attrs["profile_type"]
        student_id = attrs.get("student_id")
        civil_servant_id = attrs.get("civil_servant_id")

        if profile_type == "student":
            if not student_id:
                raise serializers.ValidationError({
                    "student_id": "This field is required."
                })
            if civil_servant_id:
                raise serializers.ValidationError({
                    "civil_servant_id": (
                        "Do not send this field for student registration."
                    )
                })

        if profile_type == "civil-servant":
            if not civil_servant_id:
                raise serializers.ValidationError({
                    "civil_servant_id": "This field is required."
                })
            if student_id:
                raise serializers.ValidationError({
                    "student_id": (
                        "Do not send this field for civil servant registration."
                    )
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        """Create the user and exactly one associated profile atomically."""
        profile_type = validated_data.pop("profile_type")
        password = validated_data.pop("password")
        validated_data.pop("password_confirmation", None)
        student_id = validated_data.pop("student_id", None)
        civil_servant_id = validated_data.pop("civil_servant_id", None)

        user = CustomUser.objects.create_user(password=password, **validated_data)

        if profile_type == "student":
            profile = StudentProfile.objects.create(user=user, student_id=student_id)
        else:
            profile = CivilServantProfile.objects.create(
                user=user, civil_servant_id=civil_servant_id
            )

        return {"user": user, "profile": profile, "profile_type": profile_type}

    def to_representation(self, instance):
        """Shape the response payload returned by the registration endpoint."""
        user = instance["user"]
        profile = instance["profile"]
        profile_type = instance["profile_type"]

        if profile_type == "student":
            profile_data = StudentProfileSerializer(profile).data
        else:
            profile_data = CivilServantProfileSerializer(profile).data

        return {
            "user": UserSummarySerializer(user).data,
            "profile_type": profile_type,
            "profile": profile_data,
        }


class LoginSerializer(serializers.Serializer):
    """Validate sign in"""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, data):
        """Check if email and password are valid fields"""
        email = data["email"]
        password = data["password"]

        user = authenticate(email=email, password=password)
        if user is None:
            raise serializers.ValidationError({"detail": "Credenciais inválidas"})

        data["user"] = user

        return data


class AdministratorProfileSerializer(serializers.ModelSerializer):
    """Public representation of an admin profile hierarchy."""

    class Meta:
        model = AdministratorProfile
        fields = ("id", "role", "level", "created_by")


class LoginUserSummarySerializer(serializers.ModelSerializer):
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
            "user": LoginUserSummarySerializer(instance["user"]).data,
            "admin_profile": AdministratorProfileSerializer(
                instance["admin_profile"]
            ).data,
        }

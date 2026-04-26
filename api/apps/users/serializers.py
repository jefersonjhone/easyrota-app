from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers

from .models import CivilServantProfile, CustomUser, StudentProfile


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

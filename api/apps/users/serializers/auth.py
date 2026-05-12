from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers

from ..models.profiles import CivilServantProfile, ProfileType, StudentProfile
from ..models.user import CustomUser
from ..serializers.users import (
    CivilServantProfileSerializer,
    StudentProfileSerializer,
    UserSummarySerializer,
)


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

        self.user = user
        return data


class Verify2FASerializer(serializers.Serializer):
    token = serializers.CharField()

    code = serializers.CharField(max_length=6)


class BaseUserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    full_name = serializers.CharField(write_only=True, max_length=255)

    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    password_confirmation = serializers.CharField(
        write_only=True,
    )

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirmation"]:
            raise serializers.ValidationError({
                "password_confirmation": "Passwords do not match."
            })

        return attrs


class StudentRegistrationSerializer(BaseUserRegistrationSerializer):
    student_id = serializers.CharField(
        allow_blank=False,
        allow_null=False,
    )

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirmation")

        password = validated_data.pop("password")
        student_id = validated_data.pop("student_id")

        user = CustomUser.objects.create_user(
            password=password,
            **validated_data,
        )

        profile = StudentProfile.objects.create(
            user=user,
            student_id=student_id,
        )

        return {"user": user, "profile": profile, "profile_type": ProfileType.STUDENT}


class CivilServantRegistrationSerializer(BaseUserRegistrationSerializer):
    civil_servant_id = serializers.CharField(
        allow_blank=False,
        allow_null=False,
    )

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirmation")

        password = validated_data.pop("password")
        civil_servant_id = validated_data.pop("civil_servant_id")

        user = CustomUser.objects.create_user(
            password=password,
            **validated_data,
        )

        profile = CivilServantProfile.objects.create(
            user=user,
            civil_servant_id=civil_servant_id,
        )

        return {
            "user": user,
            "profile": profile,
            "profile_type": ProfileType.CIVIL_SERVANT,
        }


class RegistrationResponseSerializer(serializers.Serializer):
    user = UserSummarySerializer()
    profile_type = serializers.CharField()
    profile = serializers.SerializerMethodField()

    def get_profile(self, instance):
        if instance.get("profile_type") == ProfileType.STUDENT:
            return StudentProfileSerializer(instance.get("profile")).data

        return CivilServantProfileSerializer(instance.get("profile")).data

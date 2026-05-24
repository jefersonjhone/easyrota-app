from django.db import transaction
from rest_framework import serializers

from ..models.profiles import (
    AdministratorProfile,
    CivilServantProfile,
    DriverProfile,
    StudentProfile,
)
from ..models.user import CustomUser
from ..validators import validate_cnh


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
            raise serializers.ValidationError(
                "A user with this email already exists.")
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
        level = validated_data.pop(
            "level", AdministratorProfile.Level.SUBADMIN)
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
            "user": AuthenticatedUserWithProfileSerializer(instance["user"]).data,
            "admin_profile": AdministratorProfileSerializer(
                instance["admin_profile"]
            ).data,
        }


class AuthenticatedUserWithProfileSerializer(serializers.ModelSerializer):
    """Authenticated user representation, including admin hierarchy when available."""

    profile_type = serializers.SerializerMethodField()
    admin_profile = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ("id", "email", "full_name", "profile_type", "admin_profile")

    def get_profile_type(self, obj):
        admin_profile = getattr(obj, "admin_profile", None)
        if admin_profile is not None:
            return "ADMIN"

        civil_servant = getattr(obj, "civil_servant_profile", None)
        if civil_servant is not None:
            return "CIVIL-SERVANT"

        student_profile = getattr(obj, "student_profile", None)
        if student_profile is not None:
            return "STUDENT"

        driver = getattr(obj, "driver_profile", None)
        if driver is not None:
            return "DRIVER"

        return None

    def get_admin_profile(self, obj):
        admin_profile = getattr(obj, "admin_profile", None)
        if admin_profile is not None:
            return AdministratorProfileSerializer(admin_profile).data
        return None


class DriverSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name")
    email = serializers.EmailField(source="user.email")
    password = serializers.CharField(
        write_only=True, required=False, style={"input_type": "password"}
    )

    class Meta:
        model = DriverProfile
        fields = [
            "id",
            "full_name",
            "email",
            "password",
            "cnh",
        ]

    def create(self, validated_data):
        print(validated_data)
        user_data = validated_data.pop('user')
        password = validated_data.pop('password')

        user = CustomUser.objects.create_user(
            full_name=user_data["full_name"],
            email=user_data["email"],
            password=password,
        )
        driver_profile = DriverProfile.objects.create(
            user=user, **validated_data)
        return driver_profile

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        user = instance.user

        user.email = user_data.get("email", user.email)
        user.full_name = user_data.get("full_name", user.full_name)

        password = user_data.pop("password", None)

        if password:
            user.set_password(password)
        user.save()

        instance.cnh = validated_data.get("cnh", instance.cnh)

        instance.save()

        return instance

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "This field is required."})
        return attrs

    def validate_cnh(self, value):
        validate_cnh(value)
        return value

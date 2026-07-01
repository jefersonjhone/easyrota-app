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


class AdminListSerializer(serializers.ModelSerializer):
    """Admin listing with user details and creator name."""

    user_id = serializers.UUIDField(source="user.id")
    full_name = serializers.CharField(source="user.full_name")
    email = serializers.EmailField(source="user.email")
    is_active = serializers.BooleanField(source="user.is_active")
    date_joined = serializers.DateTimeField(source="user.date_joined")
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AdministratorProfile
        fields = (
            "id",
            "user_id",
            "full_name",
            "email",
            "is_active",
            "role",
            "level",
            "created_by_name",
            "date_joined",
        )

    def get_created_by_name(self, obj):
        if obj.created_by and hasattr(obj.created_by, "user"):
            return obj.created_by.user.full_name
        return None


class AdminUpdateSerializer(serializers.ModelSerializer):
    """Update an existing admin's fields."""

    full_name = serializers.CharField(source="user.full_name", max_length=255)
    email = serializers.EmailField(source="user.email")
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    role = serializers.CharField(max_length=30)
    level = serializers.ChoiceField(choices=AdministratorProfile.Level.choices)

    class Meta:
        model = AdministratorProfile
        fields = ("full_name", "email", "password", "role", "level")

    def validate_email(self, value):
        profile = self.instance
        qs = CustomUser.objects.filter(email=value)
        if profile:
            qs = qs.exclude(id=profile.user.id)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        password = validated_data.pop("password", None)

        user = instance.user
        if user_data.get("full_name"):
            user.full_name = user_data["full_name"]
        if user_data.get("email"):
            user.email = user_data["email"]
        if password:
            user.set_password(password)
        user.save()

        instance.role = validated_data.get("role", instance.role)
        instance.level = validated_data.get("level", instance.level)
        instance.save()

        return instance


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
            "user": AuthenticatedUserWithProfileSerializer(instance["user"]).data,
            "admin_profile": AdministratorProfileSerializer(
                instance["admin_profile"]
            ).data,
        }


class AuthenticatedUserWithProfileSerializer(serializers.ModelSerializer):
    """Authenticated user representation, including admin hierarchy when available."""

    profile_type = serializers.SerializerMethodField()
    admin_profile = serializers.SerializerMethodField()
    student_profile = serializers.SerializerMethodField()
    civil_servant_profile = serializers.SerializerMethodField()
    driver_profile = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            "id",
            "email",
            "full_name",
            "profile_type",
            "admin_profile",
            "student_profile",
            "civil_servant_profile",
            "driver_profile",
        )

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

    def get_student_profile(self, obj):
        student_profile = getattr(obj, "student_profile", None)
        if student_profile is not None:
            return StudentProfileSerializer(student_profile).data
        return None

    def get_civil_servant_profile(self, obj):
        civil_servant_profile = getattr(obj, "civil_servant_profile", None)
        if civil_servant_profile is not None:
            return CivilServantProfileSerializer(civil_servant_profile).data
        return None

    def get_driver_profile(self, obj):
        driver_profile = getattr(obj, "driver_profile", None)
        if driver_profile is not None:
            return {"id": driver_profile.id}
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
        user_data = validated_data.pop("user")
        password = validated_data.pop("password")

        with transaction.atomic():
            user = CustomUser.objects.create_user(
                full_name=user_data["full_name"],
                email=user_data["email"],
                password=password,
            )
            driver_profile = DriverProfile.objects.create(user=user, **validated_data)

        return driver_profile

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        user = instance.user

        user.email = user_data.get("email", user.email)
        user.full_name = user_data.get("full_name", user.full_name)

        password = validated_data.pop("password", None)

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

    def validate_email(self, value):
        queryset = CustomUser.objects.filter(email=value)

        if self.instance:
            queryset = queryset.exclude(id=self.instance.user.id)

        if queryset.exists():
            raise serializers.ValidationError("Já existe um usuário com este email.")

        return value


class CivilServantSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name")
    email = serializers.EmailField(source="user.email")
    password = serializers.CharField(
        write_only=True, required=False, style={"input_type": "password"}
    )
    user_id = serializers.UUIDField(source="user.id", read_only=True)

    class Meta:
        model = CivilServantProfile
        fields = [
            "id",
            "user_id",
            "full_name",
            "email",
            "password",
            "civil_servant_id",
        ]

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        password = validated_data.pop("password")

        with transaction.atomic():
            user = CustomUser.objects.create_user(
                full_name=user_data["full_name"],
                email=user_data["email"],
                password=password,
            )
            profile = CivilServantProfile.objects.create(user=user, **validated_data)

        return profile

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        user = instance.user

        user.email = user_data.get("email", user.email)
        user.full_name = user_data.get("full_name", user.full_name)

        password = validated_data.pop("password", None)

        if password:
            user.set_password(password)
        user.save()

        instance.civil_servant_id = validated_data.get(
            "civil_servant_id", instance.civil_servant_id
        )

        instance.save()

        return instance

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "This field is required."})
        return attrs

    def validate_email(self, value):
        queryset = CustomUser.objects.filter(email=value)

        if self.instance:
            queryset = queryset.exclude(id=self.instance.user.id)

        if queryset.exists():
            raise serializers.ValidationError("Já existe um usuário com este email.")

        return value


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name")
    email = serializers.EmailField(source="user.email")
    password = serializers.CharField(
        write_only=True, required=False, style={"input_type": "password"}
    )
    user_id = serializers.UUIDField(source="user.id", read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user_id",
            "full_name",
            "email",
            "password",
            "student_id",
        ]

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        password = validated_data.pop("password")

        with transaction.atomic():
            user = CustomUser.objects.create_user(
                full_name=user_data["full_name"],
                email=user_data["email"],
                password=password,
            )
            student_profile = StudentProfile.objects.create(user=user, **validated_data)

        return student_profile

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        user = instance.user

        user.email = user_data.get("email", user.email)
        user.full_name = user_data.get("full_name", user.full_name)

        password = validated_data.pop("password", None)

        if password:
            user.set_password(password)
        user.save()

        instance.student_id = validated_data.get("student_id", instance.student_id)

        instance.save()

        return instance

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "This field is required."})
        return attrs

    def validate_email(self, value):
        queryset = CustomUser.objects.filter(email=value)

        if self.instance:
            queryset = queryset.exclude(id=self.instance.user.id)

        if queryset.exists():
            raise serializers.ValidationError("Já existe um usuário com este email.")

        return value


class DriverAdminDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name")
    email = serializers.EmailField(source="user.email")
    is_active = serializers.BooleanField(source="user.is_active")
    date_joined = serializers.DateTimeField(source="user.date_joined")
    trip_count = serializers.SerializerMethodField()
    recent_trips = serializers.SerializerMethodField()
    user_id = serializers.UUIDField(source="user.id")

    class Meta:
        model = DriverProfile
        fields = [
            "id",
            "user_id",
            "full_name",
            "email",
            "cnh",
            "is_active",
            "date_joined",
            "trip_count",
            "recent_trips",
        ]

    def get_trip_count(self, obj):
        from apps.trips.models import Trip

        return Trip.objects.filter(driver=obj).count()

    def get_recent_trips(self, obj):
        from apps.trips.models import Trip

        trips = (
            Trip.objects
            .filter(driver=obj)
            .select_related("route")
            .order_by("-trip_date")[:50]
        )
        return [
            {
                "id": t.id,
                "trip_date": t.trip_date,
                "departure_time": t.route.departure_time.strftime("%H:%M")
                if t.route
                else None,
                "origin": t.route.origin if t.route else None,
                "destiny": t.route.destiny if t.route else None,
                "status": t.status,
            }
            for t in trips
        ]


class DeleteOwnAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError("Invalid password.")

        return value

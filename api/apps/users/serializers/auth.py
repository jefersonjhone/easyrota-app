from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from ..models.auth import AllowedStaff
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

        # Verifica se a conta existe mas está inativa antes de autenticar
        user_check = CustomUser.objects.filter(email=email).first()
        if user_check and not user_check.is_active:
            raise serializers.ValidationError({
                "detail": 
                    "Sua conta ainda não foi ativada. Por favor, verifique seu e-mail."
            })

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
        email = value.strip().lower()
        user = CustomUser.objects.filter(email=email).first()
        if user:
            if not user.is_active:
                raise serializers.ValidationError(
                    "Este e-mail já está cadastrado, mas a conta ainda não foi ativada."
                    "Por favor, verifique seu e-mail ou peça um novo código."
                )
            raise serializers.ValidationError("Este e-mail já está em uso.")
        return email

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
        validators=[UniqueValidator(queryset=StudentProfile.objects.all())],
    )

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirmation")

        password = validated_data.pop("password")
        student_id = validated_data.pop("student_id")

        user = CustomUser.objects.create_user(
            password=password,
            is_active=False,
            **validated_data,
        )

        profile = StudentProfile.objects.create(
            user=user,
            student_id=student_id,
        )

        return {"user": user, "profile": profile, "profile_type": ProfileType.STUDENT}

    def validate_email(self, value):
        email = super().validate_email(value)
        if not email.endswith("@discente.uefs.br"):
            raise serializers.ValidationError(
                "E-mail institucional de aluno deve terminar com @discente.uefs.br."
            )
        return email


class CivilServantRegistrationSerializer(BaseUserRegistrationSerializer):
    civil_servant_id = serializers.CharField(
        allow_blank=False,
        allow_null=False,
        validators=[UniqueValidator(queryset=CivilServantProfile.objects.all())],
    )

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirmation")

        password = validated_data.pop("password")
        civil_servant_id = validated_data.pop("civil_servant_id")

        user = CustomUser.objects.create_user(
            password=password,
            is_active=False,
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

    def validate_email(self, value):
        email = super().validate_email(value)
        if not email.endswith("@uefs.br"):
            raise serializers.ValidationError(
                "E-mail institucional de servidor deve terminar com @uefs.br."
            )
        return email

    def validate(self, attrs):
        attrs = super().validate(attrs)
        full_name = attrs["full_name"].strip().upper()
        civil_servant_id = attrs["civil_servant_id"].strip()

        if not AllowedStaff.objects.filter(
            name__iexact=full_name,
            registration_number=civil_servant_id,
        ).exists():
            raise serializers.ValidationError({
                "detail": "Servidor não encontrado na base autorizada."
            })

        attrs["full_name"] = full_name
        attrs["civil_servant_id"] = civil_servant_id
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    code = serializers.CharField(max_length=6)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirmation = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirmation"]:
            raise serializers.ValidationError({
                "password_confirmation": "Passwords do not match."
            })
        return attrs


class VerifyRegistrationOTPSerializer(serializers.Serializer):
    token = serializers.CharField()
    code = serializers.CharField(max_length=6)


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class CivilServantAllowedStaffSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    registration_number = serializers.CharField(max_length=32)

    def validate(self, attrs):
        normalized_name = attrs["name"].strip().upper()
        normalized_registration = attrs["registration_number"].strip()

        if not AllowedStaff.objects.filter(
            name__iexact=normalized_name,
            registration_number=normalized_registration,
        ).exists():
            raise serializers.ValidationError({
                "detail": "Servidor não encontrado na base autorizada."
            })

        attrs["name"] = normalized_name
        attrs["registration_number"] = normalized_registration
        return attrs


class LocalTripPassengerSerializer(serializers.Serializer):
    trip = serializers.IntegerField()
    passenger_type = serializers.CharField(required=False, allow_blank=True)
    kind = serializers.CharField(required=False, allow_blank=True)
    allowed_staff_id = serializers.IntegerField(required=False)
    associated_staff_id = serializers.IntegerField(required=False)
    name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    registration_number = serializers.CharField(
        required=False, allow_blank=True, max_length=32
    )
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    cpf = serializers.CharField(required=False, allow_blank=True, max_length=11)

    def _normalize_passenger_type(self, attrs):
        raw_type = (
            attrs.get("passenger_type")
            or attrs.get("kind")
            or "LOCAL_SERVER"
        )
        normalized_type = raw_type.strip().upper()
        aliases = {
            "SERVIDOR": "LOCAL_SERVER",
            "SERVER": "LOCAL_SERVER",
            "LOCAL_SERVER": "LOCAL_SERVER",
            "CONVIDADO": "LOCAL_GUEST",
            "GUEST": "LOCAL_GUEST",
            "LOCAL_GUEST": "LOCAL_GUEST",
        }

        try:
            return aliases[normalized_type]
        except KeyError as exc:
            raise serializers.ValidationError({
                "passenger_type": "Tipo de passageiro local invalido."
            }) from exc

    def _get_allowed_staff(self, attrs, id_field):
        staff_id = attrs.get(id_field)
        if staff_id:
            try:
                return AllowedStaff.objects.get(id=staff_id)
            except AllowedStaff.DoesNotExist as exc:
                raise serializers.ValidationError({
                    id_field: "Servidor nao encontrado na base autorizada."
                }) from exc

        normalized_name = attrs.get("name", "").strip().upper()
        normalized_registration = attrs.get("registration_number", "").strip()
        if normalized_name and normalized_registration:
            try:
                return AllowedStaff.objects.get(
                    name__iexact=normalized_name,
                    registration_number=normalized_registration,
                )
            except AllowedStaff.DoesNotExist as exc:
                raise serializers.ValidationError({
                    "detail": "Servidor nao encontrado na base autorizada."
                }) from exc

        raise serializers.ValidationError({
            id_field: "Informe o servidor da base autorizada."
        })

    def validate(self, attrs):
        passenger_type = self._normalize_passenger_type(attrs)
        attrs["passenger_type"] = passenger_type

        if passenger_type == "LOCAL_SERVER":
            attrs["allowed_staff"] = self._get_allowed_staff(
                attrs, "allowed_staff_id"
            )
            return attrs

        attrs["associated_staff"] = self._get_allowed_staff(
            attrs, "associated_staff_id"
        )
        full_name = attrs.get("full_name", "").strip()
        cpf = attrs.get("cpf", "").strip()

        if not full_name:
            raise serializers.ValidationError({
                "full_name": "Informe o nome do convidado."
            })

        if not cpf or len(cpf) != 11 or not cpf.isdigit():
            raise serializers.ValidationError({
                "cpf": "CPF deve conter 11 numeros."
            })

        attrs["full_name"] = full_name
        attrs["cpf"] = cpf
        return attrs


class AllowedStaffSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedStaff
        fields = ("id", "name", "registration_number")


class RegistrationResponseSerializer(serializers.Serializer):
    user = UserSummarySerializer()
    profile_type = serializers.CharField()
    profile = serializers.SerializerMethodField()

    def get_profile(self, instance):
        if instance.get("profile_type") == ProfileType.STUDENT:
            return StudentProfileSerializer(instance.get("profile")).data

        return CivilServantProfileSerializer(instance.get("profile")).data

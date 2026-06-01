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

        # Verifica se a conta existe e a senha está correta, mas está inativa
        user_check = CustomUser.objects.filter(email=email).first() 
        if not user_check or not user_check.check_password(password):
            raise serializers.ValidationError({"detail": "Credenciais inválidas"})

        if user_check and user_check.is_deleted:
            if user_check.can_reactivate_account():
                raise serializers.ValidationError({
                    "detail": "Esta conta foi desativada após "
                    "uma solicitação de exclusão."
                    "Você pode solicitar a reativação da conta.",
                    "can_reactivate": True
                })
            raise serializers.ValidationError({"detail": "Credenciais inválidas"})
        
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
            if not user.is_active and not user.is_deleted:
                raise serializers.ValidationError(
                    "Este e-mail já está cadastrado, " 
                    "mas a conta ainda não foi ativada. "
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


class RequestReactivationSerializer(serializers.Serializer):
    email = serializers.EmailField()
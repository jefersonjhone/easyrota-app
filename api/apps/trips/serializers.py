from .models import Bus

from rest_framework import serializers

class BusSerializer (serializers.ModelSerializer):
    """Validates bus data"""

    class Meta:
        model = Bus
        fields = '__all__'

    def validate_seating_capacity(self, value):
        """Ensures seating_capacity is greater than 0 and less than or equal to 120."""

        if (value <= 0):
            raise serializers.ValidationError("Capacidade deve ser maior que 0.")
        if value > 120:
            raise serializers.ValidationError("Capacidade muito alta para um ônibus.")
        return value
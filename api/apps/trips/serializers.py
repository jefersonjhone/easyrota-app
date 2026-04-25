from rest_framework import serializers
from .models import Route
from datetime import datetime, date, timedelta
import unicodedata

class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'
        
    def _remove_accents(self, text):
        if not text: return
        
        normalized_text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('ASCII')
        return normalized_text.strip().lower()

    def _check_locations(self, origin, destiny):
        if origin and destiny:
            
            origin_clear = self._remove_accents(origin)
            destiny_clear = self._remove_accents(destiny)
            
            if origin_clear == destiny_clear:
                raise serializers.ValidationError({
                    "destiny": "A origem e o destino não podem ser a mesma cidade."
                })
    
    def _check_times(self, departure, arrival):
        if arrival and departure:
            hoje = date.today()
            departure_date = datetime.combine(hoje, departure)
            arrival_date = datetime.combine(hoje, arrival)

            if arrival_date <= departure_date:
                arrival_date += timedelta(days=1)
            
            seconds = (arrival_date - departure_date).total_seconds()
            
            if seconds < 1800:
                raise serializers.ValidationError({
                    "arrival_time": "Uma viagem intermunicipal precisa durar no mínimo 30 minutos."
                })
            if seconds > 43200:
                raise serializers.ValidationError({
                    "arrival_time": "A viagem excede o tempo limite de 12 horas."
                })
    
    def validate(self, data):
        departure = data.get('departure_time') or (self.instance.departure_time if self.instance else None)
        arrival = data.get('arrival_time') or (self.instance.arrival_time if self.instance else None)
        
        origin = data.get('origin') or (self.instance.origin if self.instance else "")
        destiny = data.get('destiny') or (self.instance.destiny if self.instance else "")
        
        self._check_locations(origin, destiny)
        self._check_times(departure, arrival)
        
        return data
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.users.models import AdministratorProfile

User = get_user_model()

class RouteAPITests(APITestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(email='admin@teste.com', password='123')
        self.admin = AdministratorProfile.objects.create(user=self.user)
        self.url = reverse('route-list-create') 
        self.admin_id = self.admin.id

    def test_create_route_successfully(self):
        payload = {
            "origin": "Feira de Santana",
            "destiny": "Salvador",
            "departure_time": "08:00:00",
            "arrival_time": "10:00:00",
            "administrator": self.admin_id
        }
        
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['origin'], "Feira de Santana")

    def test_successful_trip_early_night(self):
        payload = {
            "origin": "Feira de Santana",
            "destiny": "Salvador",
            "departure_time": "23:00:00",
            "arrival_time": "00:30:00",
            "administrator": self.admin_id
        }
        
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_fail_route_same_city_accents(self):
        payload = {
            "origin": "Feira de Santana",
            "destiny": "féírá dé santanâ",
            "departure_time": "08:00:00",
            "arrival_time": "10:00:00",
            "administrator": self.admin_id
        }
        
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("A origem e o destino não podem ser a mesma cidade.", str(response.data))

    def test_fail_route_too_short(self):
        payload = {
            "origin": "Feira de Santana",
            "destiny": "Salvador",
            "departure_time": "08:00:00",
            "arrival_time": "08:15:00",
            "administrator": self.admin_id
        }
        
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Uma viagem intermunicipal precisa durar no mínimo 30 minutos.", str(response.data))

    def test_failed_trip_too_long(self):
        payload = {
            "origin": "Feira de Santana",
            "destiny": "Salvador",
            "departure_time": "10:00:00",
            "arrival_time": "09:00:00",
            "administrator": self.admin_id
        }
        
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("A viagem excede o tempo limite de 12 horas.", str(response.data))
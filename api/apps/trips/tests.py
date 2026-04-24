from rest_framework import status
from rest_framework.test import APITestCase

from .models import Bus
from ..users.models import CustomUser, DriverProfile, AdministratorProfile

class BusViewTests (APITestCase):
    """Tests all request operations for buses."""

    def setUp(self):
        self.url = "/api/buses/"

        self.admin = CustomUser.objects.create_superuser(email="admin@teste.com", password="12345678")
        self.admin_profile = AdministratorProfile.objects.create(user=self.admin, role="Administrator")

        self.user_driver = CustomUser.objects.create_user(email="driver@teste.com", password="123")
        self.driver_profile = DriverProfile.objects.create(user=self.user_driver, cnh="12345678901")

        self.regular_user = CustomUser.objects.create_user(email="user@teste.com", password="12345678")

        self.payload = {
            "number_plate": "ABC123",
            "seating_capacity": 40,
            "driver": self.driver_profile.id,
            "administrator": self.admin_profile.id
        }


    def test_list_buses_authenticated(self):
        """Authenticated users should NOT be able to list buses."""
        
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
    

    def test_list_buses_unauthenticated(self):
        """Unauthenticated users should NOT be able to list buses."""

        response = self.client.get(self.url, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    
    def test_list_buses_as_driver(self):
        """Drivers should be able to list buses."""

        self.client.force_authenticate(user=self.user_driver)
        response = self.client.get(self.url, format='json')

        assert response.status_code == status.HTTP_200_OK
    

    def test_retrieve_bus_authenticated(self):
        """Users should NOT be able to retrieve a bus by ID."""

        bus = Bus.objects.create(
            number_plate=self.payload["number_plate"],
            seating_capacity=self.payload["seating_capacity"],
            driver_id=self.payload["driver"],
            administrator_id=self.payload["administrator"] 
        )

        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f'/api/buses/{bus.id}/', format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN


    def test_create_bus_as_user(self):
        """Regular users should NOT be able to create a bus."""

        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.url, self.payload, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
    

    def test_create_bus_unauthenticated(self):
        """Unauthenticated users should NOT be able to create a bus."""

        response = self.client.post(self.url, self.payload, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_bus_as_driver(self):
        """Drivers should NOT be able to create a bus."""

        self.client.force_authenticate(user=self.user_driver)
        response = self.client.post(self.url, self.payload, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_bus_as_admin(self):
        """Administrators should be able to create a bus successfully."""

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, self.payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["number_plate"] == "ABC123"
        
    
    def test_update_bus_as_admin(self):
        """Administrators should be able to update a bus successfully."""

        bus = Bus.objects.create(
            number_plate=self.payload["number_plate"],
            seating_capacity=self.payload["seating_capacity"],
            driver_id=self.payload["driver"],
            administrator_id=self.payload["administrator"] 
        )
        self.client.force_authenticate(user=self.admin)

        update_payload = {
            "number_plate": "XYZ321",
            "seating_capacity": 30,
            "driver": self.driver_profile.id,
            "administrator": self.admin.id
        }
        
        response = self.client.put(f'/api/buses/{bus.id}/', update_payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data["number_plate"] == "XYZ321"
        assert response.data["seating_capacity"] == 30
    
    def test_delete_bus_as_admin(self):
        """Administrators should be able to delete a bus successfully."""

        bus = Bus.objects.create(
            number_plate=self.payload["number_plate"],
            seating_capacity=self.payload["seating_capacity"],
            driver_id=self.payload["driver"],
            administrator_id=self.payload["administrator"] 
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(f'/api/buses/{bus.id}/', format='json')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
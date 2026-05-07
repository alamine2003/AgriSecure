from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser

class UserViewSetTest(APITestCase):
    def setUp(self):
        self.superuser = CustomUser.objects.create_superuser(
            email='admin@test.com',
            nin='ADMIN123',
            password='adminpassword'
        )
        self.client.force_authenticate(user=self.superuser)
        self.url = '/api/v1/users/'
        
    def test_create_user(self):
        data = {
            'email': 'newagent@test.com',
            'nin': 'AGENT789',
            'first_name': 'New',
            'last_name': 'Agent'
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CustomUser.objects.count(), 2)

    def test_login_and_must_change_password(self):
        self.client.logout()
        # Agent logs in with their NIN
        data = {'email': 'newagent@test.com', 'nin': 'AGENT789', 'first_name': 'New', 'last_name': 'Agent'}
        self.client.post(self.url, data) # Create
        
        login_data = {'email': 'newagent@test.com', 'password': 'AGENT789'}
        response = self.client.post('/api/v1/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain info that password must be changed
        self.assertTrue(response.data['user']['must_change_password'])

        access = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        blocked = self.client.get('/api/v1/surveillance/cameras/')
        self.assertEqual(blocked.status_code, status.HTTP_403_FORBIDDEN)

        change_payload = {
            'old_password': 'AGENT789',
            'new_password': 'NewStrongPass123!',
            'confirm_password': 'NewStrongPass123!',
        }
        changed = self.client.post('/api/v1/auth/change-password/', change_payload)
        self.assertEqual(changed.status_code, status.HTTP_200_OK)

        ok = self.client.get('/api/v1/surveillance/cameras/')
        self.assertIn(ok.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

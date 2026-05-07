from django.test import TestCase
from users.models import CustomUser

class CustomUserModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='agent@test.com',
            nin='NIN123456',
            first_name='Agent',
            last_name='Test',
            password='testpassword'
        )

    def test_user_creation(self):
        self.assertEqual(self.user.email, 'agent@test.com')
        self.assertEqual(self.user.role, 'agent_agricole')
        self.assertTrue(self.user.must_change_password)

    def test_nin_hash(self):
        hash_val = self.user.nin_hash()
        self.assertIsNotNone(hash_val)

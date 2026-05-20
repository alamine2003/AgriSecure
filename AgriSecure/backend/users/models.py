import uuid
import hashlib
import random
from datetime import timedelta
from django.db import models, transaction
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, nin, password=None, **extra_fields):
        if not email:
            raise ValueError('L\'email est obligatoire')
        if not nin:
            raise ValueError('Le NIN est obligatoire')
        email = self.normalize_email(email)

        # Définir date_joined si non fourni
        extra_fields.setdefault('date_joined', timezone.now())

        user = self.model(email=email, nin=nin, **extra_fields)

        # Le mot de passe initial est le NIN si non fourni
        if not password:
            password = nin

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nin, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'maintenancier')
        extra_fields.setdefault('must_change_password', False)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, nin, password, **extra_fields)

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('maintenancier', 'Maintenancier'),
        ('agent_agricole', 'Agent Agricole'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nin = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True, max_length=255)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='agent_agricole')
    must_change_password = models.BooleanField(default=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nin', 'first_name', 'last_name']

    # Désactiver le champ username
    username = None

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
        
    def nin_hash(self):
        """Retourne le hash du NIN pour comparaison si besoin"""
        return hashlib.sha256(self.nin.encode()).hexdigest()


class OTPCode(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='otp_codes')
    code = models.CharField(max_length=6)
    session_token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def generate_for(cls, user):
        with transaction.atomic():
            cls.objects.select_for_update().filter(user=user, is_used=False).delete()
            return cls.objects.create(
                user=user,
                code=f"{random.randint(100000, 999999)}",
                expires_at=timezone.now() + timedelta(minutes=10),
            )

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


class TrustedDevice(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='trusted_devices')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    user_agent = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def create_for(cls, user, user_agent=''):
        return cls.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(days=90),
            user_agent=user_agent[:300],
        )

    @property
    def is_valid(self):
        return timezone.now() < self.expires_at

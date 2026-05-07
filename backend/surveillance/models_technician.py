import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Technician(models.Model):
    """Technicien pour installations physiques"""
    SPECIALITY_CHOICES = (
        ('CAMERA', 'Installation Caméra'),
        ('NETWORK', 'Réseau & Connectivité'),
        ('POWER', 'Alimentation Électrique'),
        ('GENERAL', 'Généraliste'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='technician_profile')
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    speciality = models.CharField(max_length=20, choices=SPECIALITY_CHOICES, default='GENERAL')
    phone = models.CharField(max_length=20)
    is_available = models.BooleanField(default=True)
    region = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Technicien'
        verbose_name_plural = 'Techniciens'

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"

    def assign_appointment(self, appointment):
        """Assigner un rendez-vous au technicien"""
        appointment.technician = self
        appointment.save()

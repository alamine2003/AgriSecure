import uuid
from django.db import models
from django.conf import settings
from .models_technician import Technician

# Important : importer ici les modèles définis dans des fichiers séparés
# pour que Django les enregistre dans l'app 'surveillance'.
# Sans ces imports, Django ne les "voit" pas et génère une migration
# de SUPPRESSION (FieldPerimeter, Subscription, Payment).
from .models_perimeter import FieldPerimeter  # noqa: F401
from .models_subscription import Subscription, Payment 

class Camera(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255, null=True, blank=True)
    camera_index = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cameras')

    # Coordonnées GPS de la caméra
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, help_text="Latitude GPS")
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, help_text="Longitude GPS")

    # Date d'installation
    installed_at = models.DateTimeField(null=True, blank=True, help_text="Date d'installation de la caméra")

    class Meta:
        verbose_name = 'Caméra'
        verbose_name_plural = 'Caméras'

    def __str__(self):
        return f"{self.name} ({self.location})"

class Detection(models.Model):
    DANGER_CHOICES = (
        ('LOW', 'Faible'),
        ('MEDIUM', 'Moyen'),
        ('HIGH', 'Élevé'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='detections')
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='detections')
    label = models.CharField(max_length=50)
    confidence = models.FloatField()
    danger_level = models.CharField(max_length=10, choices=DANGER_CHOICES)
    bbox = models.JSONField(null=True, blank=True)
    frame_capture = models.URLField(max_length=500, null=True, blank=True)
    detected_at = models.DateTimeField(auto_now_add=True)
    is_alert = models.BooleanField(default=False)

    class Meta:
        ordering = ['-detected_at']
        verbose_name = 'Détection'
        verbose_name_plural = 'Détections'

    def __str__(self):
        return f"{self.label} ({self.danger_level}) - {self.detected_at}"

class Alert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    detection = models.OneToOneField(Detection, on_delete=models.CASCADE, related_name='alert')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Alerte'
        verbose_name_plural = 'Alertes'

    def __str__(self):
        return f"Alerte: {self.message}"


class InstallationAppointment(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "En attente"),
        ("SCHEDULED", "Planifié"),
        ("DONE", "Terminé"),
        ("CANCELLED", "Annulé"),
    )

    REGION_CHOICES = (
        ("Dakar", "Dakar"),
        ("Diourbel", "Diourbel"),
        ("Fatick", "Fatick"),
        ("Kaffrine", "Kaffrine"),
        ("Kaolack", "Kaolack"),
        ("Kedougou", "Kédougou"),
        ("Kolda", "Kolda"),
        ("Louga", "Louga"),
        ("Matam", "Matam"),
        ("Saint-Louis", "Saint-Louis"),
        ("Sedhiou", "Sédhiou"),
        ("Tambacounda", "Tambacounda"),
        ("Thies", "Thiès"),
        ("Ziguinchor", "Ziguinchor"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='installation_appointments')
    technician = models.ForeignKey('surveillance.Technician', on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
    region = models.CharField(max_length=50, choices=REGION_CHOICES)
    locality = models.CharField(max_length=120)
    address = models.CharField(max_length=255, blank=True, default="")
    requested_date = models.DateField(null=True, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="PENDING")
    notes = models.TextField(blank=True, default="")

    # Coordonnées GPS du lieu d'installation
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, help_text="Latitude GPS du lieu")
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, help_text="Longitude GPS du lieu")

    # Informations sur l'équipement installé
    equipment_installed = models.JSONField(null=True, blank=True, help_text="Liste des équipements installés")
    installation_notes = models.TextField(blank=True, default="", help_text="Notes techniques d'installation")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True, help_text="Date de complétion de l'installation")

    class Meta:
        ordering = ["status", "-created_at"]
        verbose_name = "Rendez-vous installation"
        verbose_name_plural = "Rendez-vous installations"

    def __str__(self):
        return f"{self.agent_id} - {self.region}/{self.locality} ({self.status})"


class AgentRegistrationRequest(models.Model):
    """Demande d'inscription depuis la page d'accueil (publique)"""
    STATUS_CHOICES = (
        ("PENDING", "En attente"),
        ("APPROVED", "Approuvé"),
        ("REJECTED", "Rejeté"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nin = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True, max_length=255)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    region = models.CharField(max_length=50, choices=InstallationAppointment.REGION_CHOICES)
    locality = models.CharField(max_length=120)
    address = models.CharField(max_length=255)
    farm_size = models.CharField(max_length=100, blank=True, help_text="Superficie de l'exploitation")
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="PENDING")
    rejection_reason = models.TextField(blank=True, default="")
    is_archived = models.BooleanField(default=False, help_text="Demande archivée (masquée de la liste principale)")
    created_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_from_request')
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Demande d'inscription"
        verbose_name_plural = "Demandes d'inscription"

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.email} ({self.status})"


class AuditLog(models.Model):
    """Traçabilité des actions maintenancier"""
    ACTION_CHOICES = (
        ('CREATE_AGENT', 'Création agent'),
        ('UPDATE_AGENT', 'Modification agent'),
        ('DELETE_AGENT', 'Suppression agent'),
        ('ACTIVATE_AGENT', 'Activation agent'),
        ('DEACTIVATE_AGENT', 'Désactivation agent'),
        ('APPROVE_REQUEST', 'Approbation demande'),
        ('REJECT_REQUEST', 'Rejet demande'),
        ('CREATE_APPOINTMENT', 'Création rendez-vous'),
        ('UPDATE_APPOINTMENT', 'Modification rendez-vous'),
        ('ASSIGN_TECHNICIAN', 'Assignation technicien'),
        ('COMPLETE_INSTALLATION', 'Installation terminée'),
        ('CREATE_CAMERA', 'Création caméra'),
        ('CREATE_PERIMETER', 'Création périmètre'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=50, help_text="Type d'objet (User, AgentRegistrationRequest, etc.)")
    target_id = models.CharField(max_length=100, help_text="ID de l'objet ciblé")
    target_name = models.CharField(max_length=255, help_text="Nom/description de l'objet")
    details = models.JSONField(null=True, blank=True, help_text="Détails supplémentaires")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Log d'audit"
        verbose_name_plural = "Logs d'audit"
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.get_action_display()} - {self.created_at}"


# Technician model moved to models_technician.py

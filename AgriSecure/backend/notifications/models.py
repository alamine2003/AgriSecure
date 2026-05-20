import uuid
from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Notification(models.Model):
    """Modèle pour les notifications utilisateur"""
    TYPE_CHOICES = (
        ('INFO', 'Information'),
        ('WARNING', 'Avertissement'),
        ('ERROR', 'Erreur'),
        ('SUCCESS', 'Succès'),
        ('ALERT', 'Alerte'),
    )
    
    PRIORITY_CHOICES = (
        ('LOW', 'Basse'),
        ('MEDIUM', 'Moyenne'),
        ('HIGH', 'Haute'),
        ('URGENT', 'Urgente'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200, verbose_name="Titre")
    message = models.TextField(verbose_name="Message")
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='INFO')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    # Référence optionnelle à d'autres objets
    content_type = models.CharField(max_length=50, null=True, blank=True)
    object_id = models.UUIDField(null=True, blank=True)
    
    # État et suivi
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Métadonnées
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
            models.Index(fields=['priority', 'created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.get_full_name() or self.user.email}"

    def mark_as_read(self):
        """Marquer la notification comme lue"""
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])

    def mark_as_sent(self):
        """Marquer la notification comme envoyée"""
        self.is_sent = True
        self.sent_at = timezone.now()
        self.save(update_fields=['is_sent', 'sent_at'])


class NotificationTemplate(models.Model):
    """Modèle pour les templates de notifications"""
    CHANNEL_CHOICES = (
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('PUSH', 'Push Notification'),
        ('WEBSOCKET', 'WebSocket'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, verbose_name="Nom")
    subject = models.CharField(max_length=200, verbose_name="Sujet")
    content = models.TextField(verbose_name="Contenu")
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='EMAIL')
    
    # Variables pour template
    variables = models.JSONField(default=dict, blank=True, help_text="Variables disponibles pour le template")
    
    # État
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Template de Notification'
        verbose_name_plural = 'Templates de Notifications'
        ordering = ['name']

    def __str__(self):
        return self.name


class NotificationChannel(models.Model):
    """Préférences de notification pour les utilisateurs"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_channels')
    channel_type = models.CharField(max_length=20, choices=NotificationTemplate.CHANNEL_CHOICES)
    is_enabled = models.BooleanField(default=True)
    configuration = models.JSONField(default=dict, blank=True, help_text="Configuration spécifique au canal")
    
    class Meta:
        verbose_name = 'Canal de Notification'
        verbose_name_plural = 'Canaux de Notifications'
        unique_together = ['user', 'channel_type']

    def __str__(self):
        return f"{self.user.email} - {self.channel_type}"

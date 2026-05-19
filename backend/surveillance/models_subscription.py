import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

class Subscription(models.Model):
    """Gestion des abonnements Premium pour les agents agricoles"""
    
    PLAN_CHOICES = (
        ('BASIC', 'Basique'),
        ('PREMIUM', 'Premium'),
        ('ENTERPRISE', 'Entreprise'),
    )
    
    STATUS_CHOICES = (
        ('ACTIVE', 'Actif'),
        ('EXPIRED', 'Expiré'),
        ('CANCELLED', 'Annulé'),
        ('SUSPENDED', 'Suspendu'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='BASIC')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Dates
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Tarification (en FCFA)
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Fonctionnalités incluses
    includes_camera = models.BooleanField(default=True)
    includes_perimeter_mapping = models.BooleanField(default=False)
    includes_advanced_analytics = models.BooleanField(default=False)
    includes_email_alerts = models.BooleanField(default=False)
    includes_phone_alerts = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Abonnement'
        verbose_name_plural = 'Abonnements'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.agent.email} - {self.plan} ({self.status})"

    def is_active(self):
        """Vérifier si l'abonnement est actif (lecture seule, sans effet de bord)"""
        if self.status != 'ACTIVE':
            return False
        if self.end_date and self.end_date < timezone.now():
            return False
        return True

    def expire_if_needed(self):
        """Expirer l'abonnement si la date de fin est dépassée"""
        if self.status == 'ACTIVE' and self.end_date and self.end_date < timezone.now():
            self.status = 'EXPIRED'
            self.save(update_fields=['status'])
            return True
        return False

    def has_feature(self, feature):
        """Vérifier si une fonctionnalité est incluse"""
        if not self.is_active():
            return False
        
        feature_map = {
            'camera': self.includes_camera,
            'perimeter_mapping': self.includes_perimeter_mapping,
            'advanced_analytics': self.includes_advanced_analytics,
            'email_alerts': self.includes_email_alerts,
            'phone_alerts': self.includes_phone_alerts,
        }
        
        return feature_map.get(feature, False)

    def extend_subscription(self, months):
        """Prolonger l'abonnement de N mois"""
        from datetime import timedelta
        
        if self.end_date and self.end_date > timezone.now():
            self.end_date += timedelta(days=30 * months)
        else:
            self.end_date = timezone.now() + timedelta(days=30 * months)
        
        self.status = 'ACTIVE'
        self.cancelled_at = None
        self.save()

    def cancel_subscription(self):
        """Annuler l'abonnement"""
        self.status = 'CANCELLED'
        self.cancelled_at = timezone.now()
        self.save()

class Payment(models.Model):
    """Historique des paiements"""
    
    PAYMENT_METHOD_CHOICES = (
        ('ORANGE_MONEY', 'Orange Money'),
        ('WAVE', 'Wave'),
        ('BANK_TRANSFER', 'Virement Bancaire'),
        ('CASH', 'Espèces'),
    )
    
    STATUS_CHOICES = (
        ('PENDING', 'En attente'),
        ('COMPLETED', 'Complété'),
        ('FAILED', 'Échoué'),
        ('REFUNDED', 'Remboursé'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Référence de transaction externe
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Dates
    payment_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subscription.agent.email} - {self.amount} FCFA ({self.status})"

    def mark_completed(self, transaction_id=None):
        """Marquer le paiement comme complété"""
        self.status = 'COMPLETED'
        self.payment_date = timezone.now()
        if transaction_id:
            self.transaction_id = transaction_id
        self.save()
        
        # Activer ou prolonger l'abonnement
        if self.subscription.status in ['ACTIVE', 'EXPIRED']:
            months = int(self.amount / self.subscription.monthly_price) if self.subscription.monthly_price > 0 else 1
            self.subscription.extend_subscription(months)

def create_subscription_for_agent(agent, plan='BASIC'):
    """Créer un abonnement pour un nouvel agent"""
    plan_configs = {
        'BASIC': {
            'monthly_price': 5000,
            'includes_camera': True,
            'includes_perimeter_mapping': False,
            'includes_advanced_analytics': False,
            'includes_email_alerts': False,
            'includes_phone_alerts': False,
        },
        'PREMIUM': {
            'monthly_price': 15000,
            'includes_camera': True,
            'includes_perimeter_mapping': True,
            'includes_advanced_analytics': True,
            'includes_email_alerts': True,
            'includes_phone_alerts': False,
        },
        'ENTERPRISE': {
            'monthly_price': 50000,
            'includes_camera': True,
            'includes_perimeter_mapping': True,
            'includes_advanced_analytics': True,
            'includes_email_alerts': True,
            'includes_phone_alerts': True,
        },
    }
    
    config = plan_configs.get(plan, plan_configs['BASIC'])
    
    subscription = Subscription.objects.create(
        agent=agent,
        plan=plan,
        **config
    )
    
    return subscription

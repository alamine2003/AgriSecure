from rest_framework import serializers
from .models_subscription import Subscription, Payment, create_subscription_for_agent

class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer pour les abonnements"""
    agent_name = serializers.CharField(source='agent.get_full_name', read_only=True)
    agent_email = serializers.CharField(source='agent.email', read_only=True)
    is_active_subscription = serializers.BooleanField(source='is_active', read_only=True)
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'agent', 'agent_name', 'agent_email', 'plan', 'status',
            'start_date', 'end_date', 'cancelled_at', 'monthly_price',
            'includes_camera', 'includes_perimeter_mapping', 'includes_advanced_analytics',
            'includes_email_alerts', 'includes_phone_alerts',
            'is_active_subscription', 'days_remaining', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'start_date', 'created_at', 'updated_at']

    def get_days_remaining(self, obj):
        """Calculer les jours restants"""
        if not obj.end_date:
            return None
        
        from django.utils import timezone
        delta = obj.end_date - timezone.now()
        return max(0, delta.days)

class PaymentSerializer(serializers.ModelSerializer):
    """Serializer pour les paiements"""
    agent_name = serializers.CharField(source='subscription.agent.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'subscription', 'agent_name', 'amount', 'payment_method',
            'status', 'transaction_id', 'payment_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de paiement"""
    
    class Meta:
        model = Payment
        fields = ['subscription', 'amount', 'payment_method', 'transaction_id']

    def validate(self, attrs):
        """Validation du paiement"""
        subscription = attrs['subscription']
        amount = attrs['amount']
        
        # Vérifier que le montant correspond au prix mensuel
        if amount < subscription.monthly_price:
            raise serializers.ValidationError(
                f"Le montant minimum est de {subscription.monthly_price} FCFA"
            )
        
        # Vérifier que l'abonnement est actif ou expiré
        if subscription.status not in ['ACTIVE', 'EXPIRED']:
            raise serializers.ValidationError(
                "Impossible de payer pour un abonnement annulé ou suspendu"
            )
        
        return attrs

class SubscriptionCreateSerializer(serializers.Serializer):
    """Serializer pour créer un abonnement pour un agent"""
    agent_id = serializers.UUIDField()
    plan = serializers.ChoiceField(choices=Subscription.PLAN_CHOICES)
    
    def validate_agent_id(self, value):
        """Validation de l'agent"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            agent = User.objects.get(id=value, role='agent_agricole')
            if hasattr(agent, 'subscription'):
                raise serializers.ValidationError("Cet agent a déjà un abonnement")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Agent agricole non trouvé")

    def create(self, validated_data):
        """Créer l'abonnement"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        agent = User.objects.get(id=validated_data['agent_id'])
        plan = validated_data['plan']
        
        return create_subscription_for_agent(agent, plan)

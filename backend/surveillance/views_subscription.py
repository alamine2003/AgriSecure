from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from .models_subscription import Subscription, Payment
from .serializers_subscription import (
    SubscriptionSerializer, PaymentSerializer, 
    PaymentCreateSerializer, SubscriptionCreateSerializer
)
from users.permissions import IsMaintenancier, IsAgentAgricole, MustChangePasswordPermission

class SubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des abonnements"""
    serializer_class = SubscriptionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['plan', 'status']
    search_fields = ['agent__email', 'agent__first_name', 'agent__last_name']
    ordering_fields = ['created_at', 'end_date', 'monthly_price']
    ordering = ['-created_at']

    def get_permissions(self):
        """Permissions selon l'action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'statistics']:
            return [IsAuthenticated(), MustChangePasswordPermission(), IsMaintenancier()]
        elif self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), MustChangePasswordPermission()]
        return [IsAuthenticated(), MustChangePasswordPermission()]

    def get_queryset(self):
        """Filtrer selon le rôle"""
        user = self.request.user
        
        if user.role == 'maintenancier':
            return Subscription.objects.select_related('agent').all()
        
        # Agent ne voit que son abonnement
        return Subscription.objects.filter(agent=user)

    def get_serializer_class(self):
        """Serializer différent pour la création"""
        if self.action == 'create':
            return SubscriptionCreateSerializer
        return SubscriptionSerializer

    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        """Prolonger un abonnement (maintenancier uniquement)"""
        if request.user.role != 'maintenancier':
            return Response(
                {'error': 'Action réservée aux maintenanciers'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        subscription = self.get_object()
        months = int(request.data.get('months', 1))
        
        if months < 1 or months > 12:
            return Response(
                {'error': 'Le nombre de mois doit être entre 1 et 12'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subscription.extend_subscription(months)
        
        return Response({
            'status': f'Abonnement prolongé de {months} mois',
            'new_end_date': subscription.end_date,
            'status': subscription.status
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annuler un abonnement (maintenancier uniquement)"""
        if request.user.role != 'maintenancier':
            return Response(
                {'error': 'Action réservée aux maintenanciers'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        subscription = self.get_object()
        subscription.cancel_subscription()
        
        return Response({
            'status': 'Abonnement annulé',
            'cancelled_at': subscription.cancelled_at
        })

    @action(detail=True, methods=['get'])
    def check_feature(self, request, pk=None):
        """Vérifier si une fonctionnalité est disponible"""
        subscription = self.get_object()
        feature = request.query_params.get('feature')
        
        if not feature:
            return Response(
                {'error': 'Paramètre "feature" requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        available = subscription.has_feature(feature)
        
        return Response({
            'feature': feature,
            'available': available,
            'subscription_status': subscription.status,
            'is_active': subscription.is_active()
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Statistiques sur les abonnements (maintenancier uniquement)"""
        if request.user.role != 'maintenancier':
            return Response(
                {'error': 'Action réservée aux maintenanciers'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_subscriptions = Subscription.objects.count()
        active_subscriptions = Subscription.objects.filter(status='ACTIVE').count()
        
        stats_by_plan = Subscription.objects.values('plan').annotate(
            count=Count('id'),
            active_count=Count('id', filter=Q(status='ACTIVE')),
            revenue=Sum('monthly_price', filter=Q(status='ACTIVE'))
        ).order_by('plan')
        
        # Revenu mensuel total
        monthly_revenue = Subscription.objects.filter(
            status='ACTIVE'
        ).aggregate(total=Sum('monthly_price'))['total'] or 0
        
        return Response({
            'total_subscriptions': total_subscriptions,
            'active_subscriptions': active_subscriptions,
            'monthly_revenue': monthly_revenue,
            'by_plan': list(stats_by_plan)
        })

class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des paiements"""
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subscription', 'payment_method', 'status']
    search_fields = ['transaction_id', 'subscription__agent__email']
    ordering_fields = ['created_at', 'payment_date', 'amount']
    ordering = ['-created_at']

    def get_permissions(self):
        """Uniquement les maintenanciers peuvent gérer les paiements"""
        return [IsAuthenticated(), MustChangePasswordPermission(), IsMaintenancier()]

    def get_queryset(self):
        """Retourner les paiements avec détails"""
        return Payment.objects.select_related('subscription', 'subscription__agent').all()

    def get_serializer_class(self):
        """Serializer différent pour la création"""
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Marquer un paiement comme complété"""
        payment = self.get_object()
        transaction_id = request.data.get('transaction_id')
        
        if payment.status == 'COMPLETED':
            return Response(
                {'error': 'Ce paiement est déjà complété'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment.mark_completed(transaction_id)
        
        return Response({
            'status': 'Paiement complété',
            'payment_date': payment.payment_date,
            'subscription_status': payment.subscription.status
        })

    @action(detail=False, methods=['get'])
    def revenue_summary(self, request):
        """Résumé des revenus par période"""
        from django.db.models import Sum
        from django.utils import timezone
        from datetime import timedelta
        
        # Filtres de période
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        payments = Payment.objects.filter(
            status='COMPLETED',
            payment_date__gte=start_date
        )
        
        total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0
        
        revenue_by_method = payments.values('payment_method').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-total')
        
        return Response({
            'period_days': days,
            'total_revenue': total_revenue,
            'by_payment_method': list(revenue_by_method)
        })

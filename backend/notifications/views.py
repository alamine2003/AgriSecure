from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Notification, NotificationTemplate, NotificationChannel
from .serializers import (
    NotificationSerializer, NotificationTemplateSerializer, 
    NotificationChannelSerializer, NotificationCreateSerializer,
    BulkNotificationSerializer
)
from users.permissions import (
    IsMaintenancier, IsAgentAgricole,
    MustChangePasswordPermission
)

User = get_user_model()


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet pour les notifications utilisateur"""
    serializer_class = NotificationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['notification_type', 'priority', 'is_read']
    ordering_fields = ['created_at', 'priority']

    def get_permissions(self):
        """Tous les utilisateurs authentifiés peuvent voir leurs notifications"""
        return [IsAuthenticated(), MustChangePasswordPermission()]

    def get_queryset(self):
        """Un utilisateur ne voit que ses propres notifications"""
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['POST'])
    def mark_all_read(self, request):
        """Marquer toutes les notifications comme lues"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
        
        return Response({
            'message': f'{count} notifications marquées comme lues',
            'count': count
        })

    @action(detail=True, methods=['POST'])
    def mark_read(self, request, pk=None):
        """Marquer une notification spécifique comme lue"""
        notification = self.get_object()
        notification.mark_as_read()
        
        return Response({
            'message': 'Notification marquée comme lue',
            'notification_id': str(notification.id)
        })

    def perform_create(self, serializer):
        """Créer une notification pour l'utilisateur connecté"""
        serializer.save(user=self.request.user)


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet pour les templates de notifications (maintenancier uniquement)"""
    serializer_class = NotificationTemplateSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['channel', 'is_active']
    ordering_fields = ['name']

    def get_permissions(self):
        """Seul les maintenanciers peuvent gérer les templates"""
        return [IsAuthenticated(), MustChangePasswordPermission(), IsMaintenancier()]

    @action(detail=False, methods=['POST'])
    def send_test(self, request):
        """Envoyer une notification de test"""
        template_id = request.data.get('template_id')
        test_user_id = request.data.get('user_id')
        
        if not template_id:
            raise ValidationError({'template_id': 'Template ID requis'})
        
        try:
            template = NotificationTemplate.objects.get(id=template_id, is_active=True)
            user = User.objects.get(id=test_user_id) if test_user_id else request.user
            
            # Créer notification à partir du template
            notification = Notification.objects.create(
                user=user,
                title=template.subject,
                message=template.content,
                notification_type='INFO',
                priority='MEDIUM',
                content_type='notification_template',
                object_id=str(template.id),
                metadata={'template_name': template.name}
            )
            
            # TODO: Envoyer notification via le canal approprié
            # notification.send_notification()
            
            return Response({
                'message': 'Notification de test créée',
                'notification_id': str(notification.id)
            })
            
        except NotificationTemplate.DoesNotExist:
            return Response(
                {'error': 'Template non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )


class NotificationChannelViewSet(viewsets.ModelViewSet):
    """ViewSet pour les canaux de notification utilisateur"""
    serializer_class = NotificationChannelSerializer

    def get_permissions(self):
        """Un utilisateur peut gérer ses propres canaux"""
        return [IsAuthenticated(), MustChangePasswordPermission()]

    def get_queryset(self):
        """Un utilisateur ne voit que ses propres canaux"""
        return NotificationChannel.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Créer un canal pour l'utilisateur connecté"""
        serializer.save(user=self.request.user)


class AdminNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet pour les notifications administratives (maintenancier uniquement)"""
    serializer_class = BulkNotificationSerializer

    def get_permissions(self):
        """Seul les maintenanciers peuvent envoyer des notifications en masse"""
        return [IsAuthenticated(), IsMaintenancier(), MustChangePasswordPermission()]

    @action(detail=False, methods=['POST'])
    def broadcast(self, request):
        """Envoyer une notification à plusieurs utilisateurs"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        users = serializer.validated_data.get('users', [])
        title = serializer.validated_data.get('title')
        message = serializer.validated_data.get('message')
        notification_type = serializer.validated_data.get('notification_type', 'INFO')
        priority = serializer.validated_data.get('priority', 'MEDIUM')
        
        notifications_created = []
        for user in users:
            notification = Notification.objects.create(
                user=user,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority
            )
            notifications_created.append(notification)
        
        # TODO: Envoyer notifications via les canaux configurés
        # for notification in notifications_created:
        #     notification.send_notification()
        
        return Response({
            'message': f'{len(notifications_created)} notifications créées',
            'notifications_count': len(notifications_created)
        })

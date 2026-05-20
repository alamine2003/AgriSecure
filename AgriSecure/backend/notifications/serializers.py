from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification, NotificationTemplate, NotificationChannel

User = get_user_model()


class NotificationSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les notifications"""
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'priority',
            'is_read', 'is_sent', 'created_at', 'read_at', 'sent_at',
            'content_type', 'object_id', 'metadata'
        ]
        read_only_fields = ['id', 'created_at', 'read_at', 'sent_at']

    def get_notification_type_display(self, obj):
        return obj.get_notification_type_display()

    def get_priority_display(self, obj):
        return obj.get_priority_display()


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les templates de notifications"""
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'subject', 'content', 'channel',
            'variables', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_channel_display(self, obj):
        return obj.get_channel_display()


class NotificationChannelSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les canaux de notification"""
    class Meta:
        model = NotificationChannel
        fields = [
            'id', 'channel_type', 'is_enabled', 'configuration',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_channel_type_display(self, obj):
        return obj.get_channel_type_display()


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour créer des notifications"""
    class Meta:
        model = Notification
        fields = ['user', 'title', 'message', 'notification_type', 'priority']

    def validate_user(self, value):
        """Validation personnalisée pour l'utilisateur"""
        if not value:
            raise serializers.ValidationError("L'utilisateur est requis.")
        return value


class BulkNotificationSerializer(serializers.Serializer):
    """Sérialiseur pour les notifications en masse"""
    users = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        help_text="Liste des IDs utilisateurs à notifier"
    )
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    notification_type = serializers.ChoiceField(
        choices=Notification.TYPE_CHOICES,
        default='INFO'
    )
    priority = serializers.ChoiceField(
        choices=Notification.PRIORITY_CHOICES,
        default='MEDIUM'
    )
    template_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Template optionnel à utiliser"
    )
    template_variables = serializers.JSONField(
        required=False,
        default=dict,
        help_text="Variables pour le template"
    )

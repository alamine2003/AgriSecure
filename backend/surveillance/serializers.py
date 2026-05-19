import re
from rest_framework import serializers
from .models import Camera, Detection, Alert, InstallationAppointment, AgentRegistrationRequest, AuditLog
from users.models import CustomUser

_HTML_RE = re.compile(r'<[^>]+>')

class CameraSerializer(serializers.ModelSerializer):
    agent_id = serializers.PrimaryKeyRelatedField(
        source='agent',
        queryset=CustomUser.objects.filter(role='agent_agricole'),
        write_only=True,
        required=False,
        allow_null=True,
    )
    agent_email = serializers.ReadOnlyField(source='agent.email')

    class Meta:
        model = Camera
        fields = [
            'id', 'name', 'location', 'camera_index', 'is_active',
            'agent', 'agent_id', 'agent_email',
            'latitude', 'longitude', 'installed_at',
        ]
        read_only_fields = ['id', 'agent']

class DetectionSerializer(serializers.ModelSerializer):
    camera_name = serializers.ReadOnlyField(source='camera.name')
    class Meta:
        model = Detection
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    detection_detail = DetectionSerializer(source='detection', read_only=True)
    class Meta:
        model = Alert
        fields = '__all__'


class InstallationAppointmentSerializer(serializers.ModelSerializer):
    agent_email = serializers.ReadOnlyField(source="agent.email")
    agent_first_name = serializers.ReadOnlyField(source="agent.first_name")
    agent_last_name = serializers.ReadOnlyField(source="agent.last_name")

    agent_id = serializers.PrimaryKeyRelatedField(
        source="agent",
        queryset=CustomUser.objects.filter(role="agent_agricole"),
        write_only=True,
    )

    class Meta:
        model = InstallationAppointment
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class AgentRegistrationRequestSerializer(serializers.ModelSerializer):
    """Serializer pour les demandes d'inscription publiques"""

    class Meta:
        model = AgentRegistrationRequest
        fields = [
            'id', 'nin', 'email', 'first_name', 'last_name', 'phone',
            'region', 'locality', 'address', 'farm_size', 'status',
            'rejection_reason', 'created_at', 'processed_at'
        ]
        read_only_fields = ['id', 'status', 'rejection_reason', 'created_at', 'processed_at']

    def validate_nin(self, value):
        if CustomUser.objects.filter(nin=value).exists():
            raise serializers.ValidationError("Cette demande ne peut pas être traitée.")
        return value

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cette demande ne peut pas être traitée.")
        return value

    def validate_first_name(self, value):
        return _HTML_RE.sub('', value).strip()

    def validate_last_name(self, value):
        return _HTML_RE.sub('', value).strip()

    def validate_locality(self, value):
        return _HTML_RE.sub('', value).strip()

    def validate_address(self, value):
        return _HTML_RE.sub('', value).strip()


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer pour les logs d'audit"""
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'user_name', 'action', 'action_display',
            'target_type', 'target_id', 'target_name', 'details',
            'ip_address', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

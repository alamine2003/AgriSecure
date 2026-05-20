from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'nin', 'first_name', 'last_name',
            'phone', 'role', 'must_change_password',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'must_change_password', 'role', 'nin', 'email', 'is_active']
        # NIN est inclus dans fields et read_only pour affichage uniquement

class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'email', 'nin', 'first_name', 'last_name', 
            'phone', 'role'
        ]

    def validate_role(self, value):
        if value != 'agent_agricole':
            raise serializers.ValidationError("Seul le rôle 'agent_agricole' est autorisé via cette API.")
        return value

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Les mots de passe ne correspondent pas."})
        return attrs

from rest_framework import serializers
from .models import Technician

class TechnicianSerializer(serializers.ModelSerializer):
    """Serializer pour les techniciens"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Technician
        fields = [
            'id', 'user', 'user_name', 'user_email', 'employee_id',
            'speciality', 'phone', 'is_available', 'region',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class TechnicianCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de technicien"""
    user_email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    
    class Meta:
        model = Technician
        fields = [
            'user_email', 'first_name', 'last_name', 'employee_id',
            'speciality', 'phone', 'is_available', 'region'
        ]

    def validate_employee_id(self, value):
        """Validation de l'unicité de l'ID employé"""
        if Technician.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("Cet ID employé existe déjà")
        return value

    def create(self, validated_data):
        """Créer un utilisateur technicien et son profil"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Extraire les données utilisateur
        user_email = validated_data.pop('user_email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        
        # Créer l'utilisateur technicien
        user = User.objects.create_user(
            email=user_email,
            nin=f"TECH_{validated_data['employee_id']}",  # NIN temporaire
            first_name=first_name,
            last_name=last_name,
            role='agent_agricole',  # Les techniciens sont des agents agricoles
            phone=validated_data.get('phone'),
            must_change_password=True
        )
        
        # Créer le profil technicien
        technician = Technician.objects.create(user=user, **validated_data)
        return technician

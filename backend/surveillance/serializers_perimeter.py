from rest_framework import serializers
from .models_perimeter import FieldPerimeter

class FieldPerimeterSerializer(serializers.ModelSerializer):
    """Serializer pour les périmètres de champs"""
    
    class Meta:
        model = FieldPerimeter
        fields = [
            'id', 'agent', 'name', 'description', 'coordinates',
            'center_lat', 'center_lng', 'area_hectares', 
            'is_premium_visible', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'agent', 'area_hectares', 'created_at', 'updated_at']

    def validate_coordinates(self, value):
        """Validation des coordonnées GPS"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Les coordonnées doivent être une liste de points [lat, lng]")
        
        if len(value) < 3:
            raise serializers.ValidationError("Un périmètre doit avoir au moins 3 points")
        
        for point in value:
            if not isinstance(point, list) or len(point) != 2:
                raise serializers.ValidationError("Chaque point doit être une liste [latitude, longitude]")
            
            lat, lng = point
            if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
                raise serializers.ValidationError("Les coordonnées doivent être numériques")
            
            if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                raise serializers.ValidationError("Coordonnées GPS invalides")
        
        return value

    def create(self, validated_data):
        """Création d'un périmètre avec calcul automatique"""
        perimeter = super().create(validated_data)
        
        # Calculer le centre si non fourni
        if not perimeter.center_lat or not perimeter.center_lng and perimeter.coordinates:
            lats = [point[0] for point in perimeter.coordinates]
            lngs = [point[1] for point in perimeter.coordinates]
            perimeter.center_lat = sum(lats) / len(lats)
            perimeter.center_lng = sum(lngs) / len(lngs)
        
        # Calculer la surface
        perimeter.area_hectares = perimeter.calculate_area()
        perimeter.save()
        
        return perimeter

    def update(self, instance, validated_data):
        """Mise à jour avec recalcul automatique"""
        instance = super().update(instance, validated_data)
        
        # Recalculer le centre si les coordonnées ont changé
        if 'coordinates' in validated_data and instance.coordinates:
            lats = [point[0] for point in instance.coordinates]
            lngs = [point[1] for point in instance.coordinates]
            instance.center_lat = sum(lats) / len(lats)
            instance.center_lng = sum(lngs) / len(lngs)
        
        # Recalculer la surface
        instance.area_hectares = instance.calculate_area()
        instance.save()
        
        return instance

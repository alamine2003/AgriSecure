from rest_framework import serializers
from .models_perimeter import FieldPerimeter

class FieldPerimeterSerializer(serializers.ModelSerializer):
    """Serializer pour les périmètres de champs"""
    
    class Meta:
        model = FieldPerimeter
        fields = [
            'id', 'agent', 'name', 'description', 'coordinates',
            'center_lat', 'center_lng', 'area_hectares',
            'is_active', 'is_premium_visible', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'agent', 'area_hectares', 'created_at', 'updated_at']

    def validate_coordinates(self, value):
        """Validation et normalisation des coordonnées GPS.

        Accepte [lat, lng] (tableaux) ET {lat, lng} (objets frontend).
        Normalise tout en [[lat, lng]] pour le stockage.
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("Les coordonnées doivent être une liste de points")

        normalized = []
        for i, point in enumerate(value):
            if isinstance(point, dict) and 'lat' in point and 'lng' in point:
                lat, lng = point['lat'], point['lng']
            elif isinstance(point, (list, tuple)) and len(point) == 2:
                lat, lng = point[0], point[1]
            else:
                raise serializers.ValidationError(f"Point {i} invalide : format attendu [lat, lng] ou {{lat, lng}}")

            if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
                raise serializers.ValidationError(f"Point {i} : les coordonnées doivent être numériques")

            if not (-90 <= lat <= 90):
                raise serializers.ValidationError(f"Latitude {lat} hors limites [-90, 90]")
            if not (-180 <= lng <= 180):
                raise serializers.ValidationError(f"Longitude {lng} hors limites [-180, 180]")

            normalized.append([lat, lng])

        if len(normalized) < 3:
            raise serializers.ValidationError("Un périmètre doit avoir au moins 3 points")

        return normalized

    def create(self, validated_data):
        """Création d'un périmètre avec calcul automatique"""
        perimeter = super().create(validated_data)
        
        # Calculer le centre si non fourni
        if (not perimeter.center_lat or not perimeter.center_lng) and perimeter.coordinates:
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
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class FieldPerimeter(models.Model):
    """Périmètre agricole avec délimitation GPS"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='field_perimeters')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Coordonnées GPS du périmètre (polygone)
    coordinates = models.JSONField(
        help_text="Liste de points [lat, lng] définissant le périmètre",
        default=list
    )
    
    # Centre approximatif pour affichage carte
    center_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    center_lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Surface en hectares
    area_hectares = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Statut du périmètre
    is_active = models.BooleanField(default=True)
    is_premium_visible = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Périmètre de champ'
        verbose_name_plural = 'Périmètres de champs'

    def __str__(self):
        return f"{self.name} - {self.agent.get_full_name()}"

    def calculate_area(self):
        """Calculer surface à partir des coordonnées GPS"""
        if len(self.coordinates) < 3:
            return 0
        
        # Algorithme de Shoelace pour calculer surface polygone
        # Implémentation simplifiée
        n = len(self.coordinates)
        area = 0.0
        
        for i in range(n):
            j = (i + 1) % n
            area += self.coordinates[i][0] * self.coordinates[j][1]
            area -= self.coordinates[j][0] * self.coordinates[i][1]
        
        area = abs(area) / 2.0
        # Conversion en hectares (approximation)
        # degrees² × 111.32² = km², × 100 = hectares
        return area * 111.32 * 111.32 * 100
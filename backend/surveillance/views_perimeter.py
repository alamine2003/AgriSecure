from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models_perimeter import FieldPerimeter
from .serializers_perimeter import FieldPerimeterSerializer
from users.permissions import IsOwnerOrMaintenancier, IsMaintenancier, IsAgentAgricole, MustChangePasswordPermission

class FieldPerimeterViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des périmètres de champs"""
    serializer_class = FieldPerimeterSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agent', 'is_premium_visible']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']

    def get_permissions(self):
        """Permissions selon l'action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), MustChangePasswordPermission(), IsMaintenancier()]
        elif self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), MustChangePasswordPermission(), IsOwnerOrMaintenancier()]
        return [IsAuthenticated(), MustChangePasswordPermission()]

    def get_queryset(self):
        """Filtrer selon le rôle de l'utilisateur"""
        user = self.request.user
        
        if user.role == 'maintenancier':
            return FieldPerimeter.objects.select_related('agent').all()
        
        # Agent agricole ne voit que ses périmètres
        return FieldPerimeter.objects.filter(agent=user)

    def perform_create(self, serializer):
        """Assigner automatiquement l'agent lors de la création"""
        if self.request.user.role == 'maintenancier':
            agent_id = self.request.data.get('agent_id')
            if agent_id:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    agent = User.objects.get(id=agent_id, role='agent_agricole')
                    serializer.save(agent=agent)
                    return
                except User.DoesNotExist:
                    pass
        
        # Si pas d'agent spécifié ou agent agricole lui-même
        serializer.save(agent=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_premium_visibility(self, request, pk=None):
        """Activer/désactiver la visibilité premium (maintenancier uniquement)"""
        if request.user.role != 'maintenancier':
            return Response(
                {'error': 'Action réservée aux maintenanciers'}, 
                status=403
            )
        
        perimeter = self.get_object()
        perimeter.is_premium_visible = not perimeter.is_premium_visible
        perimeter.save()
        
        return Response({
            'status': 'Visibilité premium mise à jour',
            'is_premium_visible': perimeter.is_premium_visible
        })

    @action(detail=False, methods=['get'])
    def map_data(self, request):
        """Retourner les données pour la carte (maintenancier uniquement)"""
        if request.user.role != 'maintenancier':
            return Response(
                {'error': 'Action réservée aux maintenanciers'}, 
                status=403
            )
        
        perimeters = self.get_queryset().filter(
            is_premium_visible=True
        ).values('id', 'name', 'center_lat', 'center_lng', 'area_hectares', 'agent__email')
        
        return Response({'perimeters': list(perimeters)})

    @action(detail=True, methods=['get'])
    def coordinates_geojson(self, request, pk=None):
        """Retourner les coordonnées au format GeoJSON pour la carte"""
        perimeter = self.get_object()
        
        # Vérifier les droits d'accès
        if (request.user.role != 'maintenancier' and 
            not perimeter.is_premium_visible and 
            perimeter.agent != request.user):
            return Response(
                {'error': 'Périmètre non visible (abonnement Premium requis)'}, 
                status=403
            )
        
        geojson = {
            "type": "Feature",
            "properties": {
                "id": str(perimeter.id),
                "name": perimeter.name,
                "description": perimeter.description,
                "area_hectares": perimeter.area_hectares,
                "agent": perimeter.agent.get_full_name() or perimeter.agent.email
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [perimeter.coordinates] if perimeter.coordinates else []
            }
        }
        
        return Response(geojson)

import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db.models import Q, Count, Avg
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Camera, Detection
from .models_perimeter import FieldPerimeter
from .serializers_perimeter import FieldPerimeterSerializer
from users.permissions import (
    IsMaintenancier, IsAgentAgricole, CanViewAllPerimeters, 
    CanManageOwnPerimeters, MustChangePasswordPermission
)


class FieldPerimeterViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des périmètres avec géolocalisation"""
    serializer_class = FieldPerimeterSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['agent', 'is_active']
    search_fields = ['name', 'description']

    def get_permissions(self):
        """Permissions basées sur l'action"""
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            return [IsAuthenticated(), MustChangePasswordPermission(), IsAgentAgricole()]
        return [IsAuthenticated(), MustChangePasswordPermission(), CanViewAllPerimeters()]

    def get_queryset(self):
        """Filtrage selon le rôle de l'utilisateur"""
        if self.request.user.role == 'maintenancier':
            # Maintenancier voit tous les périmètres
            return FieldPerimeter.objects.all()
        
        # Agent agricole ne voit que ses périmètres actifs
        return FieldPerimeter.objects.filter(
            agent=self.request.user,
            is_active=True
        ).select_related('agent')

    @action(detail=True, methods=['GET'])
    def calculate_area(self, request, pk=None):
        """Calculer la superficie du périmètre en hectares"""
        perimeter = self.get_object()
        
        if not perimeter.coordinates:
            return Response(
                {'error': 'Coordonnées non définies'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Calculer la superficie avec la formule de Shoelace (sans GDAL)
            coords = json.loads(perimeter.coordinates)
            if len(coords) < 3:
                return Response(
                    {'error': 'Un périmètre nécessite au moins 3 points'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Formule de Shoelace pour calculer l'aire d'un polygone
            area = 0.0
            n = len(coords)
            for i in range(n):
                j = (i + 1) % n
                area += coords[i][0] * coords[j][1]
                area -= coords[j][0] * coords[i][1]
            
            area = abs(area) / 2.0
            
            # Conversion approximative en hectares (1 degré² ≈ 111.32 km² à l'équateur)
            # C'est une approximation simple pour éviter GDAL
            area_hectares = area * 11132  # Approximation
            
            return Response({
                'area_m2': round(area_hectares * 10000, 2),
                'area_hectares': round(area_hectares, 2),
                'area_formatted': f"{area_hectares:.2f} ha"
            })
            
        except (json.JSONDecodeError, ValueError) as e:
            return Response(
                {'error': f'Format de coordonnées invalide: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['GET'])
    def calculate_center(self, request, pk=None):
        """Calculer le centre géographique du périmètre"""
        perimeter = self.get_object()
        
        if not perimeter.coordinates:
            return Response(
                {'error': 'Coordonnées non définies'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            coords = json.loads(perimeter.coordinates)
            if len(coords) < 3:
                return Response(
                    {'error': 'Un périmètre nécessite au moins 3 points'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculer le centre (moyenne des coordonnées) — format [lng, lat]
            avg_lat = sum(point[1] for point in coords) / len(coords)
            avg_lng = sum(point[0] for point in coords) / len(coords)
            
            return Response({
                'center': {
                    'latitude': round(avg_lat, 6),
                    'longitude': round(avg_lng, 6)
                }
            })
            
        except (json.JSONDecodeError, ValueError) as e:
            return Response(
                {'error': f'Format de coordonnées invalide: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['GET'])
    def validate_coordinates(self, request, pk=None):
        """Valider les coordonnées du périmètre"""
        perimeter = self.get_object()
        
        if not perimeter.coordinates:
            return Response(
                {'error': 'Coordonnées non définies'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            coords = json.loads(perimeter.coordinates)
            
            validation_result = {
                'is_valid': True,
                'errors': [],
                'warnings': [],
                'stats': {
                    'points_count': len(coords),
                    'is_closed': coords[0] == coords[-1] if len(coords) > 0 else False
                }
            }
            
            # Vérifications de base
            if len(coords) < 3:
                validation_result['is_valid'] = False
                validation_result['errors'].append('Un périmètre nécessite au moins 3 points')
            
            # Vérifier que les coordonnées sont valides
            for i, point in enumerate(coords):
                if not isinstance(point, (list, tuple)) or len(point) != 2:
                    validation_result['is_valid'] = False
                    validation_result['errors'].append(f'Point {i} invalide: {point}')
                    continue
                
                lng, lat = point
                if not (-180 <= lng <= 180):
                    validation_result['is_valid'] = False
                    validation_result['errors'].append(f'Longitude {lng} hors limites [-180, 180]')
                
                if not (-90 <= lat <= 90):
                    validation_result['is_valid'] = False
                    validation_result['errors'].append(f'Latitude {lat} hors limites [-90, 90]')
            
            # Vérification simple d'auto-intersection (sans GDAL)
            if len(coords) > 3:
                # Validation simple : vérifier que les points sont uniques
                unique_points = set((point[0], point[1]) for point in coords)
                if len(unique_points) != len(coords):
                    validation_result['is_valid'] = False
                    validation_result['errors'].append('Le périmètre contient des points dupliqués')
            
            return Response(validation_result)
            
        except json.JSONDecodeError as e:
            return Response(
                {'error': f'Format JSON invalide: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        serializer.save(agent=self.request.user)

    @action(detail=True, methods=['GET'])
    def geojson(self, request, pk=None):
        """Retourner les coordonnees au format GeoJSON"""
        perimeter = self.get_object()

        if not perimeter.coordinates:
            return Response(
                {'error': 'Coordonnees non definies'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            coords = json.loads(perimeter.coordinates) if isinstance(perimeter.coordinates, str) else perimeter.coordinates
        except (json.JSONDecodeError, TypeError):
            coords = []

        geojson = {
            "type": "Feature",
            "properties": {
                "id": str(perimeter.id),
                "name": perimeter.name,
                "description": perimeter.description,
                "area_hectares": float(perimeter.area_hectares) if perimeter.area_hectares else None,
                "agent": perimeter.agent.get_full_name() or perimeter.agent.email
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [coords] if coords else []
            }
        }

        return Response(geojson)

    @action(detail=False, methods=['GET'])
    def map_data(self, request):
        """Récupérer les données pour la carte (maintenancier uniquement)"""
        if request.user.role != 'maintenancier':
            return Response(
                {'error': 'Accès réservé aux maintenanciers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer tous les périmètres avec leurs agents
        perimeters = FieldPerimeter.objects.select_related('agent').all()
        
        map_data = []
        for perimeter in perimeters:
            if perimeter.coordinates:
                try:
                    coords = json.loads(perimeter.coordinates)
                    map_data.append({
                        'id': str(perimeter.id),
                        'name': perimeter.name,
                        'agent': {
                            'id': str(perimeter.agent.id),
                            'name': perimeter.agent.get_full_name() or perimeter.agent.email,
                            'email': perimeter.agent.email
                        },
                        'coordinates': coords,
                        'is_active': perimeter.is_active,
                        'created_at': perimeter.created_at.isoformat(),
                        'area_hectares': perimeter.area_hectares
                    })
                except json.JSONDecodeError:
                    continue
        
        return Response({
            'perimeters': map_data,
            'total_count': len(map_data)
        })

    @action(detail=False, methods=['POST'])
    def batch_validate(self, request):
        """Valider plusieurs périmètres en une fois"""
        perimeter_ids = request.data.get('perimeter_ids', [])
        
        if not perimeter_ids:
            return Response(
                {'error': 'IDs de périmètres requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = []
        for perimeter_id in perimeter_ids:
            try:
                perimeter = FieldPerimeter.objects.get(id=perimeter_id)
                
                # Vérifier les permissions
                if (request.user.role != 'maintenancier' and 
                    perimeter.agent != request.user):
                    results.append({
                        'id': perimeter_id,
                        'valid': False,
                        'error': 'Accès non autorisé'
                    })
                    continue
                
                # Valider les coordonnées
                if not perimeter.coordinates:
                    results.append({
                        'id': perimeter_id,
                        'valid': False,
                        'error': 'Coordonnées non définies'
                    })
                    continue
                
                coords = json.loads(perimeter.coordinates)
                is_valid = len(coords) >= 3
                
                results.append({
                    'id': perimeter_id,
                    'valid': is_valid,
                    'points_count': len(coords),
                    'error': None if is_valid else 'Moins de 3 points'
                })
                
            except FieldPerimeter.DoesNotExist:
                results.append({
                    'id': perimeter_id,
                    'valid': False,
                    'error': 'Périmètre non trouvé'
                })
            except json.JSONDecodeError:
                results.append({
                    'id': perimeter_id,
                    'valid': False,
                    'error': 'Format JSON invalide'
                })
        
        return Response({
            'validation_results': results,
            'total_processed': len(results)
        })
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from .models import Technician, InstallationAppointment
from .serializers_technician import TechnicianSerializer, TechnicianCreateSerializer
from users.permissions import IsMaintenancier, MustChangePasswordPermission

class TechnicianViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des techniciens"""
    serializer_class = TechnicianSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['speciality', 'is_available', 'region']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'employee_id']
    ordering_fields = ['created_at', 'user__last_name', 'employee_id']
    ordering = ['user__last_name']

    def get_permissions(self):
        """Uniquement les maintenanciers peuvent gérer les techniciens"""
        return [IsAuthenticated(), MustChangePasswordPermission(), IsMaintenancier()]

    def get_queryset(self):
        """Retourner les techniciens avec leurs statistiques"""
        return Technician.objects.select_related('user').annotate(
            appointments_count=Count('appointments')
        )

    def get_serializer_class(self):
        """Serializer différent pour la création"""
        if self.action == 'create':
            return TechnicianCreateSerializer
        return TechnicianSerializer

    @action(detail=True, methods=['patch'])
    def toggle_availability(self, request, pk=None):
        """Activer/désactiver la disponibilité d'un technicien"""
        technician = self.get_object()
        technician.is_available = not technician.is_available
        technician.save()
        
        return Response({
            'status': 'Disponibilité mise à jour',
            'is_available': technician.is_available
        })

    @action(detail=True, methods=['get'])
    def appointments(self, request, pk=None):
        """Lister les rendez-vous d'un technicien"""
        technician = self.get_object()
        appointments = InstallationAppointment.objects.filter(
            technician=technician
        ).select_related('agent').order_by('-created_at')
        
        from .serializers import InstallationAppointmentSerializer
        serializer = InstallationAppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_appointment(self, request, pk=None):
        """Assigner un rendez-vous à ce technicien"""
        technician = self.get_object()
        appointment_id = request.data.get('appointment_id')
        
        if not appointment_id:
            return Response(
                {'error': 'appointment_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            appointment = InstallationAppointment.objects.get(id=appointment_id)
            
            if not technician.is_available:
                return Response(
                    {'error': 'Ce technicien n\'est pas disponible'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier si le technicien est dans la bonne région
            if technician.region and technician.region != appointment.region:
                return Response(
                    {'error': 'Ce technicien n\'est pas dans la région du rendez-vous'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Assigner le rendez-vous
            technician.assign_appointment(appointment)
            
            return Response({
                'status': 'Rendez-vous assigné avec succès',
                'appointment_id': str(appointment.id),
                'technician': technician.user.get_full_name()
            })
            
        except InstallationAppointment.DoesNotExist:
            return Response(
                {'error': 'Rendez-vous non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def available_for_region(self, request):
        """Lister les techniciens disponibles pour une région"""
        region = request.query_params.get('region')
        speciality = request.query_params.get('speciality')
        
        queryset = self.get_queryset().filter(is_available=True)
        
        if region:
            queryset = queryset.filter(region=region)
        
        if speciality:
            queryset = queryset.filter(speciality=speciality)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Statistiques sur les techniciens"""
        total = Technician.objects.count()
        available = Technician.objects.filter(is_available=True).count()
        
        stats_by_speciality = Technician.objects.values('speciality').annotate(
            count=Count('id'),
            available_count=Count('id', filter=models.Q(is_available=True))
        ).order_by('speciality')
        
        stats_by_region = Technician.objects.values('region').annotate(
            count=Count('id'),
            available_count=Count('id', filter=models.Q(is_available=True))
        ).exclude(region__isnull=True).order_by('region')
        
        return Response({
            'total_technicians': total,
            'available_technicians': available,
            'by_speciality': list(stats_by_speciality),
            'by_region': list(stats_by_region)
        })

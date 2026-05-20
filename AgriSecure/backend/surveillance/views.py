import os
import logging
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.http import Http404, StreamingHttpResponse

logger = logging.getLogger(__name__)
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle

class RegistrationRateThrottle(AnonRateThrottle):
    scope = 'registration'
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Avg, Q
from minio import Minio


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200
from .models import Camera, Detection, Alert, InstallationAppointment, AgentRegistrationRequest, AuditLog
from .serializers import CameraSerializer, DetectionSerializer, AlertSerializer, InstallationAppointmentSerializer, AgentRegistrationRequestSerializer, AuditLogSerializer
from .audit import log_action
from users.permissions import (
    IsOwnerOrMaintenancier, IsAgentAgricole, IsMaintenancier,
    CanManageOwnCameras, CanManageOwnDetections, CanManageOwnAlerts,
    CanManageAppointments, CanManageTechnicians, MustChangePasswordPermission
)

class CameraViewSet(viewsets.ModelViewSet):
    serializer_class = CameraSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'location']

    def get_permissions(self):
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            return [IsAuthenticated(), MustChangePasswordPermission(), IsMaintenancier()]
        return [IsAuthenticated(), MustChangePasswordPermission(), IsOwnerOrMaintenancier()]

    def get_queryset(self):
        qs = Camera.objects.select_related('agent').order_by('-id')
        if self.request.user.role == 'maintenancier':
            return qs
        return qs.filter(agent=self.request.user)

    def perform_create(self, serializer):
        agent = serializer.validated_data.get("agent")
        if agent is None:
            raise ValidationError({"agent_id": "Ce champ est requis."})
        camera = serializer.save(agent=agent)
        log_action(self.request.user, 'CREATE_CAMERA', camera, self.request)

class DetectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DetectionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['camera', 'danger_level', 'label', 'is_alert']
    ordering_fields = ['detected_at', 'confidence']
    pagination_class = StandardPagination

    def get_permissions(self):
        return [IsAuthenticated(), MustChangePasswordPermission()]

    def get_queryset(self):
        if self.request.user.role == 'maintenancier' or self.request.user.is_superuser:
            return Detection.objects.all()
        return Detection.objects.filter(agent=self.request.user)

    @action(detail=True, methods=['get'])
    def capture(self, request, pk=None):
        detection = self.get_object()

        endpoint = os.getenv("MINIO_ENDPOINT")
        access_key = os.getenv("MINIO_ACCESS_KEY") or os.getenv("MINIO_ROOT_USER")
        secret_key = os.getenv("MINIO_SECRET_KEY") or os.getenv("MINIO_ROOT_PASSWORD")
        bucket = os.getenv("MINIO_BUCKET_DETECTIONS", "detections")
        if not endpoint or not access_key or not secret_key:
            raise Http404()

        secure = endpoint.startswith("https://")
        endpoint_clean = endpoint.replace("https://", "").replace("http://", "")
        client = Minio(endpoint_clean, access_key=access_key, secret_key=secret_key, secure=secure)

        object_name = f"detections/{detection.camera_id}/{detection.id}.jpg"

        obj = None
        try:
            obj = client.get_object(bucket, object_name)
            response = StreamingHttpResponse(obj.stream(32 * 1024), content_type="image/jpeg")
            response["Cache-Control"] = "no-store"
            return response
        except Exception:
            raise Http404()
        finally:
            try:
                if obj is not None:
                    obj.close()
                    obj.release_conn()
            except Exception:
                pass

class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        return [IsAuthenticated(), MustChangePasswordPermission(), IsAgentAgricole()]

    def get_queryset(self):
        return Alert.objects.filter(detection__agent=self.request.user)

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response({'status': 'Alerte marquée comme lue'})


class InstallationAppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = InstallationAppointmentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["region", "locality", "status", "agent"]
    search_fields = ["region", "locality", "address", "notes", "agent__email"]
    ordering_fields = ["created_at", "scheduled_at", "status"]

    def get_permissions(self):
        return [IsAuthenticated(), MustChangePasswordPermission(), IsMaintenancier()]

    def get_queryset(self):
        return InstallationAppointment.objects.select_related("agent", "technician", "technician__user").all()

    @action(detail=True, methods=['post'])
    def complete_installation(self, request, pk=None):
        """
        Marquer l'installation comme terminée.
        Cela active automatiquement le compte agent et crée les caméras associées.
        """
        appointment = self.get_object()

        if appointment.status == 'DONE':
            return Response(
                {"error": "Cette installation est déjà marquée comme terminée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Récupération des données d'installation
        equipment_data = request.data.get('equipment_installed', [])
        installation_notes = request.data.get('installation_notes', '')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        # Mise à jour du rendez-vous
        appointment.status = 'DONE'
        appointment.completed_at = timezone.now()
        appointment.equipment_installed = equipment_data
        appointment.installation_notes = installation_notes

        if latitude and longitude:
            appointment.latitude = latitude
            appointment.longitude = longitude

        appointment.save()

        # Activation automatique du compte agent
        agent = appointment.agent
        if not agent.is_active:
            agent.is_active = True
            agent.save()

        # Création des caméras installées
        cameras_created = []
        for i, equipment in enumerate(equipment_data):
            camera = Camera.objects.create(
                name=equipment.get('name', f"Caméra {i+1}"),
                location=f"{appointment.region}, {appointment.locality}",
                camera_index=equipment.get('index', i),
                agent=agent,
                latitude=equipment.get('latitude', latitude),
                longitude=equipment.get('longitude', longitude),
                installed_at=timezone.now(),
                is_active=True
            )
            cameras_created.append({
                'id': str(camera.id),
                'name': camera.name,
                'location': camera.location
            })

        # Notification agent
        try:
            from notifications.services import create_notification
            create_notification(
                user=agent,
                title="Installation terminée",
                message=f"Votre installation à {appointment.locality} est terminée. {len(cameras_created)} caméra(s) activée(s).",
                notification_type='SUCCESS',
                priority='HIGH',
                content_type='appointment',
                object_id=str(appointment.id),
            )
        except Exception as exc:
            logger.warning("Notification installation terminée non envoyée: %s", exc)

        # Log d'audit
        AuditLog.objects.create(
            user=request.user,
            action='COMPLETE_INSTALLATION',
            target_type='InstallationAppointment',
            target_id=str(appointment.id),
            target_name=f"{agent.get_full_name()} - {appointment.region}",
            details={
                'agent_email': agent.email,
                'cameras_created': len(cameras_created),
                'equipment': equipment_data,
                'location': {
                    'latitude': str(latitude) if latitude else None,
                    'longitude': str(longitude) if longitude else None,
                }
            },
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )

        return Response({
            'message': 'Installation terminée avec succès',
            'appointment': InstallationAppointmentSerializer(appointment).data,
            'cameras_created': cameras_created,
            'agent_activated': agent.is_active
        }, status=status.HTTP_200_OK)



class MaintenancierDashboardViewSet(viewsets.ViewSet):
    """ViewSet pour le dashboard du maintenancier"""
    
    @action(detail=False, methods=['GET'])
    def overview(self, request):
        """Vue d'ensemble pour le maintenancier"""
        if request.user.role != 'maintenancier':
            return Response(
                {'error': 'Accès réservé aux maintenanciers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Statistiques générales
        total_users = get_user_model().objects.filter(role='agent_agricole').count()
        active_cameras = Camera.objects.filter(is_active=True).count()
        total_alerts = Alert.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        return Response({
            'total_agents': total_users,
            'active_cameras': active_cameras,
            'weekly_alerts': total_alerts,
            'system_status': 'operational'
        })


class AgentDashboardViewSet(viewsets.ViewSet):
    """ViewSet pour le dashboard de l'agent agricole"""

    @action(detail=False, methods=['GET'])
    def overview(self, request):
        """Vue d'ensemble pour l'agent agricole"""
        if request.user.role != 'agent_agricole':
            return Response(
                {'error': 'Accès réservé aux agents agricoles'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Statistiques de l'utilisateur
        user_cameras = Camera.objects.filter(agent=request.user, is_active=True).count()
        user_detections = Detection.objects.filter(
            agent=request.user,
            detected_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        user_alerts = Alert.objects.filter(
            detection__agent=request.user,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()

        last = (Detection.objects.filter(agent=request.user)
                .order_by('-detected_at')
                .values('detected_at')
                .first())
        return Response({
            'cameras_count': user_cameras,
            'weekly_detections': user_detections,
            'weekly_alerts': user_alerts,
            'last_detection': last['detected_at'] if last else None,
        })


class AgentRegistrationRequestViewSet(viewsets.ModelViewSet):
    """ViewSet pour les demandes d'inscription publiques"""
    serializer_class = AgentRegistrationRequestSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'region']
    ordering_fields = ['created_at']
    pagination_class = StandardPagination

    def get_throttles(self):
        if self.action == 'create':
            return [RegistrationRateThrottle()]
        return super().get_throttles()

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated(), MustChangePasswordPermission(), IsMaintenancier()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role == 'maintenancier':
            qs = AgentRegistrationRequest.objects.all()
            show_archived = self.request.query_params.get('archived', 'false').lower() == 'true'
            if not show_archived:
                qs = qs.filter(is_archived=False)
            return qs
        return AgentRegistrationRequest.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsMaintenancier])
    def approve(self, request, pk=None):
        """Approuver une demande et créer le compte agent"""
        registration_request = self.get_object()

        if registration_request.status != 'PENDING':
            return Response(
                {'error': 'Cette demande a déjà été traitée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Créer l'utilisateur
            user = get_user_model().objects.create_user(
                email=registration_request.email,
                nin=registration_request.nin,
                first_name=registration_request.first_name,
                last_name=registration_request.last_name,
                phone=registration_request.phone,
                role='agent_agricole'
            )

            # Créer le rendez-vous d'installation
            appointment = InstallationAppointment.objects.create(
                agent=user,
                region=registration_request.region,
                locality=registration_request.locality,
                address=registration_request.address,
                status='PENDING'
            )

            # Marquer la demande comme approuvée
            registration_request.status = 'APPROVED'
            registration_request.processed_at = timezone.now()
            registration_request.created_user = user
            registration_request.save()

            # Créer le canal de notification EMAIL pour l'agent
            try:
                from notifications.models import NotificationChannel
                NotificationChannel.objects.get_or_create(
                    user=user,
                    channel_type='EMAIL',
                    defaults={'is_enabled': True, 'configuration': {'email': user.email}},
                )
            except Exception as exc:
                logger.warning("Création canal email agent %s échouée: %s", user.email, exc)

            # Notification in-app
            try:
                from notifications.services import notify_registration_approved, notify_appointment_scheduled
                notify_registration_approved(user)
                notify_appointment_scheduled(user, appointment)
            except Exception as exc:
                logger.warning("Notification approbation agent %s échouée: %s", user.email, exc)

            log_action(request.user, 'APPROVE_REQUEST', registration_request, request,
                       {'created_user_id': str(user.id)})
            log_action(request.user, 'CREATE_AGENT', user, request,
                       {'from_request': str(registration_request.id)})

            return Response({
                'status': 'success',
                'message': 'Demande approuvée et compte créé',
                'user_id': str(user.id),
                'appointment_id': str(appointment.id)
            })

        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la création du compte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsMaintenancier])
    def reject(self, request, pk=None):
        """Rejeter une demande d'inscription"""
        registration_request = self.get_object()

        if registration_request.status != 'PENDING':
            return Response(
                {'error': 'Cette demande a déjà été traitée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '')
        registration_request.status = 'REJECTED'
        registration_request.rejection_reason = reason
        registration_request.processed_at = timezone.now()
        registration_request.save()

        log_action(request.user, 'REJECT_REQUEST', registration_request, request,
                   {'reason': reason})

        return Response({
            'status': 'success',
            'message': 'Demande rejetée'
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsMaintenancier])
    def archive(self, request, pk=None):
        """Archiver une demande traitée"""
        registration_request = self.get_object()
        if registration_request.status == 'PENDING':
            return Response(
                {'error': 'Seules les demandes traitées peuvent être archivées'},
                status=status.HTTP_400_BAD_REQUEST
            )
        registration_request.is_archived = True
        registration_request.save(update_fields=['is_archived'])
        return Response({'status': 'success', 'message': 'Demande archivée'})


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les logs d'audit (lecture seule)"""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsMaintenancier]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['action', 'target_type', 'user']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    pagination_class = StandardPagination

    def get_queryset(self):
        return AuditLog.objects.select_related('user').all()


class MaintenancierStatsViewSet(viewsets.ViewSet):
    """ViewSet pour les statistiques maintenancier (KPI, courbes)"""
    permission_classes = [IsAuthenticated, IsMaintenancier]

    @action(detail=False, methods=['GET'])
    def kpi(self, request):
        """KPIs principaux pour dashboard"""
        from django.db.models import Count, Q
        from django.db.models.functions import TruncDate

        # Compter agents actifs
        total_agents = get_user_model().objects.filter(role='agent_agricole').count()
        active_agents = get_user_model().objects.filter(role='agent_agricole', is_active=True).count()

        # Compter demandes
        pending_requests = AgentRegistrationRequest.objects.filter(status='PENDING').count()
        approved_requests = AgentRegistrationRequest.objects.filter(status='APPROVED').count()
        rejected_requests = AgentRegistrationRequest.objects.filter(status='REJECTED').count()

        # Compter rendez-vous
        total_appointments = InstallationAppointment.objects.count()
        pending_appointments = InstallationAppointment.objects.filter(status='PENDING').count()

        # Compter caméras et détections
        total_cameras = Camera.objects.count()
        active_cameras = Camera.objects.filter(is_active=True).count()

        # Détections cette semaine
        week_ago = timezone.now() - timedelta(days=7)
        weekly_detections = Detection.objects.filter(detected_at__gte=week_ago).count()

        # Alertes critiques
        critical_alerts = Alert.objects.filter(
            detection__danger_level='HIGH',
            is_read=False
        ).count()

        return Response({
            'agents': {
                'total': total_agents,
                'active': active_agents,
                'inactive': total_agents - active_agents
            },
            'requests': {
                'pending': pending_requests,
                'approved': approved_requests,
                'rejected': rejected_requests,
                'total': pending_requests + approved_requests + rejected_requests
            },
            'appointments': {
                'total': total_appointments,
                'pending': pending_appointments
            },
            'cameras': {
                'total': total_cameras,
                'active': active_cameras
            },
            'detections': {
                'weekly': weekly_detections
            },
            'alerts': {
                'critical': critical_alerts
            }
        })

    @action(detail=False, methods=['GET'])
    def trends(self, request):
        """Données pour graphiques de tendances (30 derniers jours)"""
        from django.db.models.functions import TruncDate
        from django.db.models import Count

        # Calculer les 30 derniers jours
        days_back = 30
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days_back)

        # Créations d'agents par jour
        agent_creation_trend = list(
            get_user_model().objects
            .filter(role='agent_agricole', date_joined__date__gte=start_date)
            .annotate(date=TruncDate('date_joined'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        # Demandes d'inscription par jour
        request_trend = list(
            AgentRegistrationRequest.objects
            .filter(created_at__date__gte=start_date)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        # Détections par jour
        detection_trend = list(
            Detection.objects
            .filter(detected_at__date__gte=start_date)
            .annotate(date=TruncDate('detected_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        return Response({
            'agent_creation': agent_creation_trend,
            'registration_requests': request_trend,
            'detections': detection_trend,
            'period': {
                'start': start_date,
                'end': end_date,
                'days': days_back
            }
        })

    @action(detail=False, methods=['GET'])
    def recent_activity(self, request):
        """Activités récentes (20 dernières actions)"""
        recent_logs = AuditLog.objects.select_related('user').all()[:20]
        serializer = AuditLogSerializer(recent_logs, many=True)
        return Response(serializer.data)

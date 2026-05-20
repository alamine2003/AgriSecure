from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, Sum
from django.db.models.functions import TruncDate, ExtractHour
from django.utils import timezone
from datetime import timedelta
from .models import Camera, Detection, Alert, InstallationAppointment, Technician
from .models_subscription import Subscription
from users.models import CustomUser
from users.permissions import IsMaintenancier, IsAgentAgricole, MustChangePasswordPermission

class DashboardViewSet(viewsets.GenericViewSet):
    """ViewSet pour les dashboards selon le rôle"""
    permission_classes = [IsAuthenticated, MustChangePasswordPermission]

    @action(detail=False, methods=['get'])
    def maintenancier(self, request):
        """Dashboard du Maintenancier"""
        if request.user.role != 'maintenancier':
            return Response(
                {'error': 'Accès réservé aux maintenanciers'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Statistiques générales
        total_agents = CustomUser.objects.filter(role='agent_agricole').count()
        active_agents = CustomUser.objects.filter(role='agent_agricole', is_active=True).count()
        total_cameras = Camera.objects.count()
        active_cameras = Camera.objects.filter(is_active=True).count()
        
        # Statistiques des abonnements
        total_subscriptions = Subscription.objects.count()
        active_subscriptions = Subscription.objects.filter(status='ACTIVE').count()
        monthly_revenue = Subscription.objects.filter(
            status='ACTIVE'
        ).aggregate(total=Sum('monthly_price'))['total'] or 0
        
        # Statistiques des techniciens
        total_technicians = Technician.objects.count()
        available_technicians = Technician.objects.filter(is_available=True).count()
        
        # Rendez-vous en attente
        pending_appointments = InstallationAppointment.objects.filter(
            status='PENDING'
        ).count()
        
        # Dernières détections
        recent_detections = Detection.objects.select_related('camera', 'agent').order_by(
            '-detected_at'
        )[:10].values(
            'id', 'label', 'danger_level', 'detected_at',
            'camera__name', 'agent__email'
        )
        
        # Rendez-vous récents
        recent_appointments = InstallationAppointment.objects.select_related(
            'agent', 'technician__user'
        ).order_by('-created_at')[:10].values(
            'id', 'region', 'locality', 'status', 'created_at',
            'agent__email', 'technician__user__first_name', 'technician__user__last_name'
        )
        
        return Response({
            'statistics': {
                'agents': {
                    'total': total_agents,
                    'active': active_agents,
                    'inactive': total_agents - active_agents
                },
                'cameras': {
                    'total': total_cameras,
                    'active': active_cameras,
                    'inactive': total_cameras - active_cameras
                },
                'subscriptions': {
                    'total': total_subscriptions,
                    'active': active_subscriptions,
                    'monthly_revenue': monthly_revenue
                },
                'technicians': {
                    'total': total_technicians,
                    'available': available_technicians,
                    'busy': total_technicians - available_technicians
                },
                'appointments': {
                    'pending': pending_appointments
                }
            },
            'recent_detections': list(recent_detections),
            'recent_appointments': list(recent_appointments)
        })

    @action(detail=False, methods=['get'])
    def agent_agricole(self, request):
        """Dashboard de l'Agent Agricole"""
        if request.user.role != 'agent_agricole':
            return Response(
                {'error': 'Accès réservé aux agents agricoles'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        agent = request.user
        
        # Vérifier l'abonnement
        subscription = getattr(agent, 'subscription', None)
        has_premium = subscription and subscription.is_active() and subscription.plan in ['PREMIUM', 'ENTERPRISE']
        
        # Statistiques des caméras
        total_cameras = Camera.objects.filter(agent=agent).count()
        active_cameras = Camera.objects.filter(agent=agent, is_active=True).count()
        
        # Statistiques des détections (30 derniers jours)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        detections_30d = Detection.objects.filter(
            agent=agent, 
            detected_at__gte=thirty_days_ago
        )
        
        total_detections_30d = detections_30d.count()
        high_danger_detections_30d = detections_30d.filter(danger_level='HIGH').count()
        
        # Statistiques par type d'objet détecté
        detections_by_label = detections_30d.values('label').annotate(
            count=Count('id'),
            high_danger_count=Count('id', filter=Q(danger_level='HIGH'))
        ).order_by('-count')
        
        # Alertes non lues
        unread_alerts = Alert.objects.filter(
            detection__agent=agent, 
            is_read=False
        ).count()
        
        # Dernières détections
        recent_detections = Detection.objects.filter(agent=agent).order_by(
            '-detected_at'
        )[:10].values(
            'id', 'label', 'confidence', 'danger_level', 'detected_at',
            'camera__name', 'frame_capture', 'is_alert'
        )
        
        # Périmètres (si premium)
        perimeters = []
        if has_premium:
            perimeters = agent.field_perimeters.values(
                'id', 'name', 'area_hectares', 'is_premium_visible'
            )
        
        # État de l'abonnement
        subscription_info = None
        if subscription:
            subscription_info = {
                'plan': subscription.plan,
                'status': subscription.status,
                'is_active': subscription.is_active(),
                'end_date': subscription.end_date,
                'features': {
                    'camera': subscription.has_feature('camera'),
                    'perimeter_mapping': subscription.has_feature('perimeter_mapping'),
                    'advanced_analytics': subscription.has_feature('advanced_analytics'),
                    'email_alerts': subscription.has_feature('email_alerts'),
                    'phone_alerts': subscription.has_feature('phone_alerts'),
                }
            }
        
        return Response({
            'profile': {
                'name': agent.get_full_name(),
                'email': agent.email,
                'phone': agent.phone,
                'must_change_password': agent.must_change_password
            },
            'subscription': subscription_info,
            'cameras': {
                'total': total_cameras,
                'active': active_cameras
            },
            'detections_30_days': {
                'total': total_detections_30d,
                'high_danger': high_danger_detections_30d,
                'by_label': list(detections_by_label)
            },
            'alerts': {
                'unread_count': unread_alerts
            },
            'perimeters': list(perimeters) if has_premium else [],
            'recent_detections': list(recent_detections)
        })

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Analytics de surveillance — agent agricole ou maintenancier avec ?agent_id="""
        if request.user.role == 'maintenancier':
            agent_id = request.query_params.get('agent_id')
            if not agent_id:
                return Response(
                    {'error': 'Paramètre agent_id requis pour le maintenancier'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            agent = get_object_or_404(CustomUser, id=agent_id, role='agent_agricole')
        elif request.user.role == 'agent_agricole':
            agent = request.user
        else:
            return Response(
                {'error': 'Accès non autorisé'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            days = max(1, min(int(request.query_params.get('days', 30)), 365))
        except (ValueError, TypeError):
            days = 30
        start_date = timezone.now() - timedelta(days=days)

        base_qs = Detection.objects.filter(agent=agent, detected_at__gte=start_date)
        confirmed_qs = base_qs.filter(is_false_positive=False)
        total_detections = base_qs.count()
        fp_count = base_qs.filter(is_false_positive=True).count()
        confirmed_count = total_detections - fp_count
        high_danger_count = base_qs.filter(danger_level='HIGH').count()

        # Détections par heure — distribution complète 0-23
        by_hour_raw = {
            row['hour']: row['count']
            for row in base_qs.annotate(hour=ExtractHour('detected_at'))
            .values('hour').annotate(count=Count('id'))
        }
        by_hour = [{'hour': h, 'count': by_hour_raw.get(h, 0)} for h in range(24)]

        # Tendance sur la période sélectionnée — hors faux positifs (cohérent avec top_labels)
        by_day = list(
            confirmed_qs
            .annotate(date=TruncDate('detected_at'))
            .values('date')
            .annotate(
                total=Count('id'),
                HIGH=Count('id', filter=Q(danger_level='HIGH')),
                MEDIUM=Count('id', filter=Q(danger_level='MEDIUM')),
                LOW=Count('id', filter=Q(danger_level='LOW')),
            )
            .order_by('date')
        )

        # Performance par caméra
        camera_stats = list(
            base_qs.values('camera__name').annotate(
                total=Count('id'),
                high=Count('id', filter=Q(danger_level='HIGH')),
                avg_confidence=Avg('confidence'),
                fp=Count('id', filter=Q(is_false_positive=True)),
            ).order_by('-total')
        )
        camera_performance = [
            {
                'name': c['camera__name'],
                'total': c['total'],
                'high': c['high'],
                'avg_confidence': round((c['avg_confidence'] or 0) * 100, 1),
                'fp': c['fp'],
            }
            for c in camera_stats
        ]

        # Top labels détectés
        top_labels = list(
            base_qs.filter(is_false_positive=False)
            .values('label')
            .annotate(count=Count('id'))
            .order_by('-count')[:6]
        )

        # Taux de résolution des alertes
        total_alerts = Alert.objects.filter(detection__agent=agent, created_at__gte=start_date).count()
        resolved_alerts = Alert.objects.filter(
            detection__agent=agent, created_at__gte=start_date, resolved_at__isnull=False
        ).count()

        avg_confidence = base_qs.aggregate(avg=Avg('confidence'))['avg'] or 0

        unread_alerts_count = Alert.objects.filter(
            detection__agent=agent, created_at__gte=start_date, is_read=False
        ).count()

        return Response({
            'period_days': days,
            'by_hour': by_hour,
            'by_day': by_day,
            'camera_performance': camera_performance,
            'top_labels': top_labels,
            'quality_metrics': {
                'total_detections': total_detections,
                'confirmed_detections': confirmed_count,
                'false_positives': fp_count,
                'false_positive_rate': round(fp_count / total_detections * 100, 1) if total_detections else 0,
                'avg_confidence': round(avg_confidence * 100, 1),
                'total_alerts': total_alerts,
                'resolved_alerts': resolved_alerts,
                'unread_alerts': unread_alerts_count,
                'high_danger_detections': high_danger_count,
                'alert_resolution_rate': round(resolved_alerts / total_alerts * 100, 1) if total_alerts else 0,
            }
        })

    @action(detail=False, methods=['get'])
    def system_status(self, request):
        """État du système (maintenancier uniquement)"""
        if request.user.role != 'maintenancier':
            return Response(
                {'error': 'Accès réservé aux maintenanciers'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # État des caméras
        camera_status = Camera.objects.values('is_active').annotate(
            count=Count('id')
        ).order_by('is_active')
        
        # État des techniciens par région
        technician_status = Technician.objects.values('region').annotate(
            total=Count('id'),
            available=Count('id', filter=Q(is_available=True))
        ).exclude(region__isnull=True).order_by('region')
        
        # Rendez-vous par statut
        appointment_status = InstallationAppointment.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Dernières alertes critiques
        critical_alerts = Alert.objects.filter(
            detection__danger_level='HIGH',
            is_read=False
        ).select_related('detection__agent', 'detection__camera').order_by(
            '-created_at'
        )[:10].values(
            'id', 'message', 'created_at',
            'detection__agent__email',
            'detection__camera__name'
        )
        
        return Response({
            'camera_status': list(camera_status),
            'technician_status': list(technician_status),
            'appointment_status': list(appointment_status),
            'critical_alerts': list(critical_alerts)
        })

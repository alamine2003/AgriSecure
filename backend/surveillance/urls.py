from django.urls import path, include
from core.router import SafeFormatSuffixRouter
from .views import (
    CameraViewSet, DetectionViewSet, AlertViewSet,
    InstallationAppointmentViewSet,
    AgentRegistrationRequestViewSet, AuditLogViewSet, MaintenancierStatsViewSet
)
from .views_technician import TechnicianViewSet
from .geolocation_views import FieldPerimeterViewSet
from .views_subscription import SubscriptionViewSet, PaymentViewSet
from .views_dashboard import DashboardViewSet

router = SafeFormatSuffixRouter()
router.register(r'cameras', CameraViewSet, basename='cameras')
router.register(r'detections', DetectionViewSet, basename='detections')
router.register(r'alerts', AlertViewSet, basename='alerts')
router.register(r'installation-appointments', InstallationAppointmentViewSet, basename='installation-appointments')
router.register(r'perimeters', FieldPerimeterViewSet, basename='perimeters')
router.register(r'technicians', TechnicianViewSet, basename='technicians')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscriptions')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'registration-requests', AgentRegistrationRequestViewSet, basename='registration-requests')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')
router.register(r'maintenancier-stats', MaintenancierStatsViewSet, basename='maintenancier-stats')

urlpatterns = [
    path('', include(router.urls)),
]

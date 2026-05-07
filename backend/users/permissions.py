from rest_framework import permissions

class IsMaintenancier(permissions.BasePermission):
    """Accès réservé aux maintenanciers"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == 'maintenancier' or request.user.is_superuser
        )

class IsAgentAgricole(permissions.BasePermission):
    """Accès réservé aux agents agricoles"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'agent_agricole'

class MustChangePasswordPermission(permissions.BasePermission):
    """
    Bloque l'accès si l'utilisateur doit changer son mot de passe,
    sauf pour l'action de changement de mot de passe elle-même.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return True
        
        # Autoriser si le mot de passe est déjà changé
        if not request.user.must_change_password:
            return True

        return request.path.rstrip('/').endswith('/auth/change-password')

class IsOwnerOrMaintenancier(permissions.BasePermission):
    """Accès au propriétaire ou au maintenancier"""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
            
        if request.user.role == 'maintenancier' or request.user.is_superuser:
            return True
            
        # Pour les détections ou rapports liés à un agent
        if hasattr(obj, 'agent'):
            return obj.agent == request.user
        
        # Pour l'utilisateur lui-même
        return obj == request.user

# Permissions granulaires pour les maintenanciers
class CanManageUsers(permissions.BasePermission):
    """Peut gérer les utilisateurs"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == 'maintenancier' or request.user.is_superuser
        )

class CanManageTechnicians(permissions.BasePermission):
    """Peut gérer les techniciens"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == 'maintenancier' or request.user.is_superuser
        )

class CanManageAppointments(permissions.BasePermission):
    """Peut gérer les rendez-vous d'installation"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == 'maintenancier' or request.user.is_superuser
        )

class CanViewAllPerimeters(permissions.BasePermission):
    """Peut voir tous les périmètres (maintenance premium)"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Maintenancier peut voir tous les périmètres
        if request.user.role == 'maintenancier' or request.user.is_superuser:
            return True
        
        # Agent agricole peut voir ses propres périmètres
        return request.user.role == 'agent_agricole'

# Permissions granulaires pour les agents agricoles
class CanManageOwnCameras(permissions.BasePermission):
    """Peut gérer ses propres caméras"""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Maintenancier peut tout gérer
        if request.user.role == 'maintenancier' or request.user.is_superuser:
            return True
        
        # Agent agricole peut gérer ses caméras
        return request.user.role == 'agent_agricole' and hasattr(obj, 'agent') and obj.agent == request.user

class CanManageOwnPerimeters(permissions.BasePermission):
    """Peut gérer ses propres périmètres"""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Maintenancier peut tout gérer
        if request.user.role == 'maintenancier' or request.user.is_superuser:
            return True
        
        # Agent agricole peut gérer ses périmètres
        return request.user.role == 'agent_agricole' and hasattr(obj, 'agent') and obj.agent == request.user

class CanManageOwnDetections(permissions.BasePermission):
    """Peut gérer ses propres détections"""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Maintenancier peut tout gérer
        if request.user.role == 'maintenancier' or request.user.is_superuser:
            return True
        
        # Agent agricole peut gérer ses détections
        return request.user.role == 'agent_agricole' and hasattr(obj, 'agent') and obj.agent == request.user

class CanManageOwnAlerts(permissions.BasePermission):
    """Peut gérer ses propres alertes"""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Maintenancier peut tout gérer
        if request.user.role == 'maintenancier' or request.user.is_superuser:
            return True
        
        # Agent agricole peut gérer ses alertes
        return request.user.role == 'agent_agricole' and hasattr(obj, 'detection') and obj.detection.agent == request.user

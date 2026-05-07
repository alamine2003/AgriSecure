"""
Exceptions personnalisées pour le projet de surveillance agricole.
Permet une gestion d'erreurs plus précise et un meilleur débogage.
"""

class SurveillanceException(Exception):
    """Exception de base pour le module de surveillance."""
    pass

class CameraException(SurveillanceException):
    """Exception liée aux opérations de caméra."""
    pass

class CameraNotFoundError(CameraException):
    """Exception levée quand une caméra n'est pas trouvée."""
    pass

class CameraAccessDeniedError(CameraException):
    """Exception levée quand l'accès à une caméra est refusé."""
    pass

class CameraInitializationError(CameraException):
    """Exception levée quand l'initialisation d'une caméra échoue."""
    pass

class CameraStreamError(CameraException):
    """Exception levée quand le flux vidéo est interrompu."""
    pass

class AIEngineException(SurveillanceException):
    """Exception liée au moteur IA."""
    pass

class ModelLoadError(AIEngineException):
    """Exception levée quand le chargement du modèle IA échoue."""
    pass

class ModelInferenceError(AIEngineException):
    """Exception levée quand l'inférence du modèle échoue."""
    pass

class CacheError(AIEngineException):
    """Exception liée aux opérations de cache."""
    pass

class NotificationException(SurveillanceException):
    """Exception liée aux notifications."""
    pass

class WebSocketError(NotificationException):
    """Exception liée aux erreurs WebSocket."""
    pass

class DatabaseException(SurveillanceException):
    """Exception liée aux opérations de base de données."""
    pass

class StorageException(SurveillanceException):
    """Exception liée aux opérations de stockage (MinIO)."""
    pass

class AuthenticationException(SurveillanceException):
    """Exception liée à l'authentification."""
    pass

class PermissionException(AuthenticationException):
    """Exception levée quand les permissions sont insuffisantes."""
    pass

"""
Configuration avancée du logging pour le projet de surveillance agricole.
Structure les logs pour Grafana/Prometheus et facilite le monitoring.
"""

import os
import logging
import json
from datetime import datetime
from pythonjsonlogger import jsonlogger

class CustomJSONFormatter(jsonlogger.JsonFormatter):
    """Formateur JSON personnalisé pour Grafana."""
    
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        
        # Ajout de champs personnalisés pour Grafana
        log_record['service'] = os.getenv('SERVICE_NAME', 'surveillance-backend')
        log_record['environment'] = os.getenv('ENVIRONMENT', 'development')
        log_record['version'] = os.getenv('APP_VERSION', '1.0.0')
        log_record['timestamp'] = datetime.utcnow().isoformat() + 'Z'
        
        # Ajout du niveau de log en format numérique pour Grafana
        log_record['level_numeric'] = record.levelno
        
        # Informations sur l'utilisateur si disponible
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id
        if hasattr(record, 'camera_id'):
            log_record['camera_id'] = record.camera_id
        if hasattr(record, 'detection_count'):
            log_record['detection_count'] = record.detection_count

class SurveillanceLoggerAdapter(logging.LoggerAdapter):
    """Adapter pour ajouter automatiquement le contexte aux logs."""
    
    def process(self, msg, kwargs):
        # Ajout du contexte utilisateur/caméra si disponible
        if hasattr(self, 'extra'):
            kwargs.setdefault('extra', {}).update(self.extra)
        return msg, kwargs

def setup_logging():
    """Configure le logging structuré pour toute l'application."""
    
    # Création du formateur JSON
    formatter = CustomJSONFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )
    
    # Configuration des handlers
    handlers = {}
    
    # Handler console pour Docker
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    handlers['console'] = console_handler
    
    # Handler fichier pour logs persistants (optionnel)
    log_file = os.getenv('LOG_FILE_PATH')
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        handlers['file'] = file_handler
    
    # Configuration du logging root
    logging_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                '()': CustomJSONFormatter,
                'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'json',
                'level': os.getenv('LOG_LEVEL', 'INFO')
            }
        },
        'loggers': {
            '': {  # Root logger
                'handlers': ['console'],
                'level': os.getenv('LOG_LEVEL', 'INFO'),
                'propagate': False
            },
            'django': {
                'handlers': ['console'],
                'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
                'propagate': False
            },
            'camera': {
                'handlers': ['console'],
                'level': os.getenv('CAMERA_LOG_LEVEL', 'INFO'),
                'propagate': False
            },
            'ai_engine': {
                'handlers': ['console'],
                'level': os.getenv('AI_LOG_LEVEL', 'INFO'),
                'propagate': False
            },
            'surveillance': {
                'handlers': ['console'],
                'level': os.getenv('SURVEILLANCE_LOG_LEVEL', 'INFO'),
                'propagate': False
            },
            'celery': {
                'handlers': ['console'],
                'level': os.getenv('CELERY_LOG_LEVEL', 'INFO'),
                'propagate': False
            },
            'channels': {
                'handlers': ['console'],
                'level': os.getenv('CHANNELS_LOG_LEVEL', 'INFO'),
                'propagate': False
            }
        }
    }
    
    # Ajout du handler fichier si configuré
    if log_file:
        logging_config['handlers']['file'] = {
            'class': 'logging.FileHandler',
            'filename': log_file,
            'formatter': 'json',
            'level': os.getenv('LOG_LEVEL', 'INFO')
        }
        for logger_config in logging_config['loggers'].values():
            logger_config['handlers'].append('file')
    
    logging.config.dictConfig(logging_config)

def get_logger_with_context(name, **context):
    """Retourne un logger avec contexte personnalisé."""
    logger = logging.getLogger(name)
    return SurveillanceLoggerAdapter(logger, context)

# Fonctions utilitaires pour les métriques
def log_detection_metrics(logger, camera_id, detection_count, processing_time):
    """Enregistre les métriques de détection pour Grafana."""
    logger.info(
        "Détections traitées",
        extra={
            'camera_id': str(camera_id),
            'detection_count': detection_count,
            'processing_time_ms': processing_time * 1000,
            'metric_type': 'detection_performance'
        }
    )

def log_camera_status(logger, camera_id, status, error_message=None):
    """Enregistre le statut de la caméra."""
    extra = {
        'camera_id': str(camera_id),
        'status': status,
        'metric_type': 'camera_status'
    }
    if error_message:
        extra['error_message'] = error_message
    
    if status == 'online':
        logger.info(f"Caméra {camera_id} en ligne", extra=extra)
    elif status == 'offline':
        logger.warning(f"Caméra {camera_id} hors ligne", extra=extra)
    elif status == 'error':
        logger.error(f"Caméra {camera_id} en erreur: {error_message}", extra=extra)

def log_ai_performance(logger, model_name, inference_time, cache_hit=False):
    """Enregistre les métriques de performance IA."""
    logger.info(
        f"Performance IA {model_name}",
        extra={
            'model_name': model_name,
            'inference_time_ms': inference_time * 1000,
            'cache_hit': cache_hit,
            'metric_type': 'ai_performance'
        }
    )

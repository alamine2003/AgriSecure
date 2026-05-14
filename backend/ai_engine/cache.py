import os
import json
import hashlib
import logging
import redis
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class YOLOCache:
    """
    Cache intelligent pour les détections YOLO avec Redis.
    Réduit la charge CPU en mettant en cache les détections similaires.
    """
    
    def __init__(self):
        self.redis_client = None
        self.cache_ttl = int(os.getenv('YOLO_CACHE_TTL_SECONDS', '30'))  # 30 secondes par défaut
        self.similarity_threshold = float(os.getenv('YOLO_SIMILARITY_THRESHOLD', '0.85'))
        self._connect_redis()
    
    def _connect_redis(self):
        """Connexion au serveur Redis pour le cache."""
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'redis'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                password=os.getenv('REDIS_PASSWORD'),
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
            # Test de connexion
            self.redis_client.ping()
            logger.info("Cache YOLO connecté à Redis")
        except Exception as e:
            logger.warning(f"Impossible de se connecter à Redis pour le cache YOLO: {e}")
            self.redis_client = None
    
    def _generate_frame_hash(self, frame_shape: tuple, frame_bytes_sample: bytes) -> str:
        # frame_bytes_sample est déjà un échantillon spatial (~1/400ème de la frame)
        hash_input = f"{frame_shape}_{hashlib.md5(frame_bytes_sample).hexdigest()}"
        return hashlib.sha256(hash_input.encode()).hexdigest()[:16]
    
    def get_cached_detections(self, frame_shape: tuple, frame_bytes_sample: bytes) -> Optional[List[Dict[str, Any]]]:
        """
        Récupère les détections depuis le cache si disponibles.
        
        Args:
            frame_shape: Tuple (height, width, channels) de la frame
            frame_bytes_sample: Échantillon des bytes de la frame
            
        Returns:
            List des détections en cache ou None
        """
        if not self.redis_client:
            return None
        
        try:
            frame_hash = self._generate_frame_hash(frame_shape, frame_bytes_sample)
            cache_key = f"yolo_detection:{frame_hash}"
            
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                parsed = json.loads(cached_data)
                # Extract the detections list from the cached dict
                detections = parsed.get('detections', parsed) if isinstance(parsed, dict) else parsed
                logger.debug(f"Cache hit YOLO pour frame {frame_hash}")
                return detections
                
        except Exception as e:
            logger.warning(f"Erreur lecture cache YOLO: {e}")
        
        return None
    
    def cache_detections(self, frame_shape: tuple, frame_bytes_sample: bytes, detections: List[Dict[str, Any]]):
        """
        Met en cache les détections pour une frame.
        
        Args:
            frame_shape: Tuple (height, width, channels) de la frame
            frame_bytes_sample: Échantillon des bytes de la frame
            detections: List des détections à mettre en cache
        """
        if not self.redis_client or not detections:
            return
        
        try:
            frame_hash = self._generate_frame_hash(frame_shape, frame_bytes_sample)
            cache_key = f"yolo_detection:{frame_hash}"
            
            # Ajouter timestamp pour suivi
            cache_data = {
                'detections': detections,
                'cached_at': datetime.now().isoformat(),
                'frame_shape': frame_shape
            }
            
            self.redis_client.setex(
                cache_key, 
                self.cache_ttl, 
                json.dumps(cache_data)
            )
            
            logger.debug(f"Détections YOLO mises en cache pour frame {frame_hash}")
            
        except Exception as e:
            logger.warning(f"Erreur écriture cache YOLO: {e}")
    
    def clear_cache(self):
        """Nettoie toutes les entrées de cache YOLO."""
        if not self.redis_client:
            return
        
        try:
            pattern = "yolo_detection:*"
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
                logger.info(f"Cache YOLO nettoyé: {len(keys)} entrées supprimées")
        except Exception as e:
            logger.error(f"Erreur nettoyage cache YOLO: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Retourne des statistiques sur l'utilisation du cache."""
        if not self.redis_client:
            return {'connected': False}
        
        try:
            pattern = "yolo_detection:*"
            keys = self.redis_client.keys(pattern)
            return {
                'connected': True,
                'cached_frames': len(keys),
                'ttl_seconds': self.cache_ttl,
                'similarity_threshold': self.similarity_threshold
            }
        except Exception as e:
            return {'connected': False, 'error': str(e)}

# Instance globale du cache
_yolo_cache = None

def get_yolo_cache() -> YOLOCache:
    """Retourne l'instance singleton du cache YOLO."""
    global _yolo_cache
    if _yolo_cache is None:
        _yolo_cache = YOLOCache()
    return _yolo_cache

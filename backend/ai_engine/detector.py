import os
import threading
import logging
from ultralytics import YOLO
from .danger_scorer import get_danger_score
from .cache import get_yolo_cache

logger = logging.getLogger(__name__)

class YOLODetector:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(YOLODetector, cls).__new__(cls)
                cls._instance._initialize()
            return cls._instance

    def _initialize(self):
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'yolov8n.pt')
            if not os.path.exists(model_path):
                os.makedirs(os.path.dirname(model_path), exist_ok=True)
                logger.info("Téléchargement du modèle YOLOv8n...")
                self.model = YOLO('yolov8n.pt')
            else:
                self.model = YOLO(model_path)
            
            self.conf_threshold = float(os.getenv('YOLO_CONFIDENCE_THRESHOLD', 0.5))
            # Classes COCO pertinentes
            self.relevant_classes = {
                0: 'person', 
                14: 'bird', 
                15: 'cat', 
                16: 'dog', 
                17: 'horse', 
                18: 'sheep', 
                19: 'cow',
                # YOLOv8 n'a pas 'goat' par défaut dans COCO, souvent confondu avec sheep ou cow
            }
            
            # Initialisation du cache
            self.cache = get_yolo_cache()
            
            logger.info("Détecteur YOLOv8 initialisé avec cache Redis")
        except Exception as e:
            logger.error(f"Erreur initialisation YOLO: {e}")
            self.model = None
            self.cache = None

    def analyze(self, frame_numpy):
        if self.model is None:
            return []
        
        # Vérifier le cache en premier
        if self.cache:
            try:
                frame_shape = frame_numpy.shape
                # Échantillon spatial (1 pixel sur 20) au lieu du tobytes() complet (~6 MB pour 1080p)
                frame_bytes_sample = frame_numpy[::20, ::20].tobytes()

                cached_detections = self.cache.get_cached_detections(frame_shape, frame_bytes_sample)
                if cached_detections:
                    logger.debug("Utilisation des détections YOLO depuis le cache")
                    return cached_detections
            except Exception as e:
                logger.warning(f"Erreur lecture cache YOLO: {e}")
        
        # Pas de cache hit, procéder à la détection
        results = self.model(frame_numpy, conf=self.conf_threshold, verbose=False)
        detections = []
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                label = self.model.names[cls_id]
                
                # On ne garde que ce qui nous intéresse ou tout avec filtrage danger
                conf = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()
                
                danger = get_danger_score(label)
                
                detections.append({
                    'label': label,
                    'confidence': conf,
                    'bbox': xyxy,
                    'danger_level': danger['level'],
                    'color': danger['color']
                })
        
        # Mettre en cache les détections pour usage futur
        if self.cache and detections:
            try:
                self.cache.cache_detections(frame_shape, frame_bytes_sample, detections)
                logger.debug("Détections YOLO mises en cache")
            except Exception as e:
                logger.warning(f"Erreur écriture cache YOLO: {e}")
        
        return detections

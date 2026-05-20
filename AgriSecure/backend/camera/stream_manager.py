import threading
import logging
from .capture import CameraCapture

logger = logging.getLogger(__name__)

class StreamManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(StreamManager, cls).__new__(cls)
                cls._instance.streams = {}
            return cls._instance

    def start_camera(self, camera_id, camera_index=0):
        with self._lock:
            if camera_id not in self.streams or not self.streams[camera_id].running:
                logger.info(f"Lancement du thread de capture pour {camera_id}")
                capture_thread = CameraCapture(camera_id, camera_index)
                capture_thread.daemon = True
                capture_thread.start()
                self.streams[camera_id] = capture_thread
            else:
                logger.info(f"Le flux pour {camera_id} est déjà en cours")

    def stop_camera(self, camera_id):
        with self._lock:
            if camera_id in self.streams:
                logger.info(f"Arrêt du thread de capture pour {camera_id}")
                self.streams[camera_id].stop()
                # On ne join pas pour ne pas bloquer l'ASGI, 
                # le thread s'arrêtera de lui-même à la prochaine itération
                del self.streams[camera_id]

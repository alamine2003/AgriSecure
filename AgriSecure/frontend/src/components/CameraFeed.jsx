import React, { useRef, useEffect, useState } from 'react';

const CameraFeed = ({ cameraId }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const detectionsRef = useRef([]);
  const [isConnected, setIsConnected] = useState(false);

  const drawBoundingBoxes = (detections) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // Dimensionner le canvas une seule fois (ou quand la résolution change)
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox;
      const color = det.color || '#39ff14';

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      const label = `${det.label} ${Math.round(det.confidence * 100)}%`;
      ctx.font = 'bold 13px Arial';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(x1, y1 - 20, tw + 8, 20);
      ctx.fillStyle = '#000';
      ctx.fillText(label, x1 + 4, y1 - 5);
    });
  };

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('access_token') || '';
    // Token passé via subprotocol WebSocket — n'apparaît pas dans les URLs ni les logs
    const wsUrl = `${protocol}//${window.location.host}/ws/surveillance/${cameraId}/`;
    const socket = token ? new WebSocket(wsUrl, [token]) : new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
      socket.send(JSON.stringify({ command: 'start_stream' }));
    };

    socket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === 'camera_frame') {
        // Stocker les détections sans passer par le state React (pas de re-render)
        detectionsRef.current = data.detections || [];
        // Mettre à jour l'image — drawBoundingBoxes sera appelé dans onLoad
        if (imgRef.current) {
          imgRef.current.src = data.frame_b64;
        }
      }
    };

    socket.onclose = () => setIsConnected(false);
    socket.onerror = () => setIsConnected(false);

    return () => socket.close();
  }, [cameraId]);

  return (
    <div className="relative border-4 border-slate-800 rounded-lg overflow-hidden bg-black aspect-video">
      <img
        ref={imgRef}
        alt="Camera Stream"
        className="w-full h-full object-contain"
        onLoad={() => drawBoundingBoxes(detectionsRef.current)}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-white text-xs font-bold shadow-lg uppercase">
          {isConnected ? 'Live' : 'Déconnecté'}
        </span>
      </div>

      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <p className="text-white font-medium">Connexion au flux caméra...</p>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;

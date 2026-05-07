import React, { useRef, useEffect, useState } from 'react';

const CameraFeed = ({ cameraId }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastDetections, setLastDetections] = useState([]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = localStorage.getItem('access_token');
    const wsUrl = `${protocol}//${host}/ws/surveillance/${cameraId}/?token=${encodeURIComponent(token || '')}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
      socket.send(JSON.stringify({ command: 'start_stream' }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'camera_frame') {
        imgRef.current.src = data.frame_b64;
        setLastDetections(data.detections);
        drawBoundingBoxes(data.detections);
      }
    };

    socket.onclose = () => setIsConnected(false);
    setWs(socket);

    return () => socket.close();
  }, [cameraId]);

  const drawBoundingBoxes = (detections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox;
      const color = det.color || '#639922';

      // Draw box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Draw label
      ctx.fillStyle = color;
      ctx.font = '16px Arial';
      const label = `${det.label} (${Math.round(det.confidence * 100)}%)`;
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x1, y1 - 25, textWidth + 10, 25);
      ctx.fillStyle = 'white';
      ctx.fillText(label, x1 + 5, y1 - 7);
    });
  };

  return (
    <div className="relative border-4 border-slate-800 rounded-lg overflow-hidden bg-black aspect-video">
      <img
        ref={imgRef}
        alt="Camera Stream"
        className="w-full h-full object-contain"
        onLoad={() => {
          if (imgRef.current && canvasRef.current) {
            canvasRef.current.width = imgRef.current.naturalWidth;
            canvasRef.current.height = imgRef.current.naturalHeight;
          }
        }}
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

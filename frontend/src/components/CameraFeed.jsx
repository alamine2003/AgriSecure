import React, { useRef, useEffect, useState, useCallback } from 'react';

const MAX_ATTEMPTS = 5;
// Délai exponentiel plafonné à 30s
const reconnectDelay = (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000);

const CameraFeed = ({ cameraId }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const detectionsRef = useRef([]);
  const socketRef = useRef(null);
  const attemptRef = useRef(0);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectInfo, setReconnectInfo] = useState(null); // { attempt, total, seconds }
  const [failed, setFailed] = useState(false);

  const drawBoundingBoxes = (detections) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
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

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const connect = useCallback(() => {
    clearCountdown();
    if (timerRef.current) clearTimeout(timerRef.current);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('access_token') || '';
    const wsUrl = `${protocol}//${window.location.host}/ws/surveillance/${cameraId}/`;
    const socket = token ? new WebSocket(wsUrl, [token]) : new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setReconnectInfo(null);
      setFailed(false);
      attemptRef.current = 0;
      socket.send(JSON.stringify({ command: 'start_stream' }));
    };

    socket.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'camera_frame') {
        detectionsRef.current = data.detections || [];
        if (imgRef.current) imgRef.current.src = data.frame_b64;
      }
    };

    socket.onclose = (e) => {
      setIsConnected(false);
      if (e.code === 1000) return; // fermeture normale

      const attempt = attemptRef.current;
      if (attempt >= MAX_ATTEMPTS) {
        setFailed(true);
        setReconnectInfo(null);
        return;
      }

      attemptRef.current += 1;
      const delay = reconnectDelay(attempt);
      const seconds = Math.ceil(delay / 1000);

      setReconnectInfo({ attempt: attemptRef.current, total: MAX_ATTEMPTS, seconds });

      // Countdown affiché à l'utilisateur
      let remaining = seconds;
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearCountdown();
        } else {
          setReconnectInfo(prev => prev ? { ...prev, seconds: remaining } : null);
        }
      }, 1000);

      timerRef.current = setTimeout(connect, delay);
    };

    socket.onerror = () => setIsConnected(false);
  }, [cameraId]);

  useEffect(() => {
    connect();
    return () => {
      clearCountdown();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (socketRef.current) socketRef.current.close(1000, 'Unmount');
    };
  }, [connect]);

  const handleManualReconnect = () => {
    clearCountdown();
    if (timerRef.current) clearTimeout(timerRef.current);
    attemptRef.current = 0;
    setFailed(false);
    setReconnectInfo(null);
    connect();
  };

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

      {/* Indicateur de statut */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-white text-xs font-bold shadow-lg uppercase">
          {isConnected ? 'Live' : reconnectInfo ? 'Reconnexion…' : 'Déconnecté'}
        </span>
      </div>

      {/* Overlay reconnexion */}
      {!isConnected && !failed && reconnectInfo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/85 gap-3">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm font-medium">
              Reconnexion automatique dans{' '}
              <span className="text-primary font-bold">{reconnectInfo.seconds}s</span>
            </p>
            <p className="text-slate-400 text-xs">
              Tentative {reconnectInfo.attempt} / {reconnectInfo.total}
            </p>
          </div>
          <button
            onClick={handleManualReconnect}
            className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Reconnecter maintenant
          </button>
        </div>
      )}

      {/* Overlay connexion initiale */}
      {!isConnected && !failed && !reconnectInfo && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <p className="text-white font-medium text-sm">Connexion au flux caméra…</p>
        </div>
      )}

      {/* Overlay échec définitif */}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 gap-3">
          <p className="text-red-400 font-semibold text-sm">Connexion impossible</p>
          <p className="text-slate-400 text-xs text-center px-4">
            Le serveur ne répond pas après {MAX_ATTEMPTS} tentatives.
          </p>
          <button
            onClick={handleManualReconnect}
            className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary/80 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;

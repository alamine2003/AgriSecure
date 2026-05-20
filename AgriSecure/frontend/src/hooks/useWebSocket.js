import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebSocket = (cameraId) => {
    const [socket, setSocket] = useState(null);
    const [data, setData] = useState(null);
    const [status, setStatus] = useState('disconnected');
    const [error, setError] = useState(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        if (!cameraId) {
            setError('Camera ID requis');
            return;
        }
        
        const token = localStorage.getItem('access_token');
        if (!token) {
            setError('Token d\'authentification manquant');
            return;
        }

        try {
            const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/surveillance/${cameraId}/?token=${token}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setStatus('connected');
                setError(null);
                reconnectAttemptsRef.current = 0;
                console.log(`WebSocket connecté pour la caméra ${cameraId}`);
            };

            ws.onclose = (event) => {
                setStatus('disconnected');
                setSocket(null);
                
                // Tentative de reconnexion automatique
                if (reconnectAttemptsRef.current < maxReconnectAttempts && event.code !== 1000) {
                    reconnectAttemptsRef.current++;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    
                    console.log(`Tentative de reconnexion ${reconnectAttemptsRef.current}/${maxReconnectAttempts} dans ${delay}ms`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, delay);
                } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    setError('Impossible de se reconnecter après plusieurs tentatives');
                }
            };

            ws.onerror = (event) => {
                setStatus('error');
                setError(`Erreur WebSocket: ${event.message || 'Connexion échouée'}`);
                console.error('Erreur WebSocket:', event);
            };

            ws.onmessage = (event) => {
                try {
                    const parsedData = JSON.parse(event.data);
                    setData(parsedData);
                } catch (parseError) {
                    console.error('Erreur parsing message WebSocket:', parseError);
                    setError('Erreur de format de données reçues');
                }
            };

            setSocket(ws);
            
            return () => {
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
                ws.close(1000, 'Fermeture normale');
            };
        } catch (err) {
            setError(`Erreur de connexion: ${err.message}`);
            setStatus('error');
        }
    }, [cameraId]);

    useEffect(() => {
        const cleanup = connect();
        return cleanup;
    }, [connect]);

    const sendCommand = useCallback((cmd) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                socket.send(JSON.stringify({ command: cmd }));
            } catch (err) {
                setError(`Erreur envoi commande: ${err.message}`);
            }
        } else {
            setError('WebSocket non connecté');
        }
    }, [socket]);

    const reconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectAttemptsRef.current = 0;
        connect();
    }, [connect]);

    return { 
        data, 
        status, 
        error, 
        sendCommand, 
        reconnect,
        isConnected: status === 'connected',
        isConnecting: status === 'connecting'
    };
};

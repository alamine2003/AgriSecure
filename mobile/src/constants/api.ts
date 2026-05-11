// Priorité : variable d'environnement EAS → fallback local
// Pour modifier l'host de prod, changer EXPO_PUBLIC_API_HOST dans eas.json
const HOST  = process.env.EXPO_PUBLIC_API_HOST  ?? '192.168.0.147';
const HTTPS = process.env.EXPO_PUBLIC_USE_HTTPS === 'true';

const http = HTTPS ? 'https' : 'http';
const ws   = HTTPS ? 'wss'   : 'ws';

export const API_BASE_URL = `${http}://${HOST}/api`;
export const WS_BASE_URL  = `${ws}://${HOST}`;

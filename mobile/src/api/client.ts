import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';
import { mockGet, mockPatch } from './mockData';

// Force mock si env var activée (build démo), sinon auto-fallback si serveur injoignable
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function get<T>(path: string): Promise<T> {
  if (USE_MOCK) return mockGet<T>(path);
  try {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}${path}`, { headers, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch {
    // Serveur injoignable → données démo automatiquement
    return mockGet<T>(path);
  }
}

async function patch<T>(path: string, body: object): Promise<T> {
  if (USE_MOCK) return mockPatch<T>(path, body);
  try {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch {
    return mockPatch<T>(path, body);
  }
}

export const api = { get, patch };

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';
import { mockGet, mockPatch } from './mockData';

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
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function patch<T>(path: string, body: object): Promise<T> {
  if (USE_MOCK) return mockPatch<T>(path, body);
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}`);
  return res.json();
}

export const api = { get, patch };

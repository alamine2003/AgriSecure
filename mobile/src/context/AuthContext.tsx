import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  username: string;
  email: string;
  role: 'agent_agricole' | 'maintenancier';
  must_change_password: boolean;
  first_name?: string;
  last_name?: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedAccess, storedRefresh, storedUser] = await Promise.all([
          AsyncStorage.getItem('access_token'),
          AsyncStorage.getItem('refresh_token'),
          AsyncStorage.getItem('user'),
        ]);
        if (storedAccess && storedUser) {
          setAccessToken(storedAccess);
          setRefreshToken(storedRefresh);
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(access: string, refresh: string, userData: User) {
    await Promise.all([
      AsyncStorage.setItem('access_token', access),
      AsyncStorage.setItem('refresh_token', refresh),
      AsyncStorage.setItem('user', JSON.stringify(userData)),
    ]);
    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(userData);
  }

  async function logout() {
    await Promise.all([
      AsyncStorage.removeItem('access_token'),
      AsyncStorage.removeItem('refresh_token'),
      AsyncStorage.removeItem('user'),
    ]);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import { API_BASE_URL } from '../../src/constants/api';
import { USE_MOCK, api } from '../../src/api/client';
import { MOCK_USER, MOCK_CREDENTIALS } from '../../src/api/mockData';
import AgriWatchLogo from '../../src/components/AgriWatchLogo';
import { C } from '../../src/constants/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const pwdRef = useRef<any>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) { setError('Veuillez remplir tous les champs.'); return; }
    setLoading(true); setError('');
    const normalizedEmail = email.trim().toLowerCase();

    // Mode mock forcé (build démo)
    if (USE_MOCK) {
      if (normalizedEmail === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
        await login('mock-access-token', 'mock-refresh-token', MOCK_USER);
        router.replace('/(app)/dashboard');
      } else {
        setError('Identifiants incorrects. Utilisez : agent@agriwatch.sn / agent123');
      }
      setLoading(false);
      return;
    }

    // Connexion réelle avec auto-fallback démo si serveur injoignable
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
        signal: AbortSignal.timeout(6000),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || data.non_field_errors?.[0] || 'Identifiants incorrects.'); return; }
      await login(data.access, data.refresh, data.user);
      router.replace(data.user.must_change_password ? '/(auth)/change-password' : '/(app)/dashboard');
    } catch {
      // Serveur injoignable → basculer sur le compte démo automatiquement
      if (normalizedEmail === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
        await login('mock-access-token', 'mock-refresh-token', MOCK_USER);
        router.replace('/(app)/dashboard');
      } else {
        setError('Serveur injoignable. En démo : agent@agriwatch.sn / agent123');
      }
    } finally { setLoading(false); }
  }

  return (
    <LinearGradient colors={C.grad} style={styles.gradient} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
      <StatusBar style="light" />
      <View style={styles.circle} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={C.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <AgriWatchLogo size={40} />
          </View>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Accédez à votre espace agent</Text>
        </View>

        <View style={styles.form}>
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={C.primaryLt} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email professionnel"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={v => { setEmail(v); setError(''); }}
              autoCapitalize="none" autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => pwdRef.current?.focus()}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={C.primaryLt} style={styles.icon} />
            <TextInput
              ref={pwdRef}
              style={[styles.input, { flex: 1 }]}
              placeholder="Mot de passe"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
              secureTextEntry={!showPwd}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin} disabled={loading} activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.bg} />
              : <><Text style={styles.loginBtnText}>Se connecter</Text><Ionicons name="arrow-forward-circle" size={22} color={C.bg} /></>
            }
          </TouchableOpacity>
        </View>

        {USE_MOCK && (
          <View style={styles.mockBadge}>
            <Ionicons name="flask-outline" size={13} color={C.primary} />
            <Text style={styles.mockText}>Mode démo · agent@agriwatch.sn / agent123</Text>
          </View>
        )}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}> Faire une demande</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  circle: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(245,158,11,0.05)', top: -70, right: -70,
  },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  backBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
  },
  header: { alignItems: 'center', paddingVertical: 20 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.25)',
  },
  title: { fontSize: 32, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.primary, fontWeight: '500' },
  form: { gap: 14 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.dangerBg, borderWidth: 1, borderColor: C.dangerBd,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
  },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 56,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: C.text, fontSize: 15 },
  eyeBtn: { padding: 6 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 17, gap: 10, marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  loginBtnText: { color: C.bg, fontSize: 16, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: C.textMuted, fontSize: 13 },
  footerLink: { color: C.primary, fontSize: 13, fontWeight: '700' },
  mockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    marginBottom: 12,
  },
  mockText: { color: C.primary, fontSize: 11, fontWeight: '500', flex: 1 },
});

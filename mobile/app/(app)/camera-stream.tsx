import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_BASE_URL } from '../../src/constants/api';
import { C } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round(width * (9 / 16));

type WsStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

type Detection = {
  label: string;
  confidence: number;
  danger_level: 'LOW' | 'MEDIUM' | 'HIGH';
};

type CameraAlert = { message: string; level: 'HIGH' | 'MEDIUM' | 'LOW' };

const DANGER_COLOR: Record<string, string> = {
  HIGH:   '#ef4444',
  MEDIUM: '#f59e0b',
  LOW:    '#22c55e',
};

const STATUS_CONFIG: Record<WsStatus, { color: string; text: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  idle:         { color: C.textMuted,  text: 'Prêt',       icon: 'radio-button-off' },
  connecting:   { color: C.primary,   text: 'Connexion…', icon: 'hourglass'        },
  connected:    { color: C.primary,   text: 'Connecté',   icon: 'radio-button-on'  },
  disconnected: { color: C.danger,    text: 'Déconnecté', icon: 'close-circle'     },
  error:        { color: C.danger,    text: 'Erreur',     icon: 'alert-circle'     },
};

export default function CameraStreamScreen() {
  const insets = useSafeAreaInsets();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const wsRef         = useRef<WebSocket | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alertAnim     = useRef(new Animated.Value(-90)).current;

  const [status, setStatus]         = useState<WsStatus>('idle');
  const [frame, setFrame]           = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [streaming, setStreaming]   = useState(false);
  const [alert, setAlert]           = useState<CameraAlert | null>(null);

  const dismissAlert = useCallback(() => {
    Animated.timing(alertAnim, { toValue: -90, duration: 300, useNativeDriver: true }).start(
      () => setAlert(null),
    );
  }, [alertAnim]);

  const showAlert = useCallback((data: CameraAlert) => {
    setAlert(data);
    Animated.spring(alertAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(dismissAlert, 6000);
  }, [alertAnim, dismissAlert]);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const token = await AsyncStorage.getItem('access_token');
    if (!token || !id) return;

    setStatus('connecting');
    const ws = new WebSocket(`${WS_BASE_URL}/ws/surveillance/${id}/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'camera_frame') {
          setFrame(msg.frame_b64);
          setDetections(msg.detections ?? []);
        } else if (msg.type === 'camera_alert') {
          showAlert({ message: msg.message, level: msg.level ?? 'HIGH' });
        }
      } catch { /* ignore malformed */ }
    };

    ws.onerror = () => setStatus('error');
    ws.onclose = () => { setStatus('disconnected'); setStreaming(false); };
  }, [id, showAlert]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, [connect]);

  function startStream() {
    wsRef.current?.send(JSON.stringify({ command: 'start_stream' }));
    setStreaming(true);
  }

  function stopStream() {
    wsRef.current?.send(JSON.stringify({ command: 'stop_stream' }));
    setStreaming(false);
    setFrame(null);
    setDetections([]);
  }

  function handleBack() {
    stopStream();
    router.back();
  }

  const sc = STATUS_CONFIG[status];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {alert && (
        <Animated.View
          style={[
            styles.alertBanner,
            {
              backgroundColor: DANGER_COLOR[alert.level] + '20',
              borderColor: DANGER_COLOR[alert.level] + '50',
              transform: [{ translateY: alertAnim }],
            },
          ]}
        >
          <Ionicons name="warning" size={18} color={DANGER_COLOR[alert.level]} />
          <Text style={[styles.alertBannerText, { color: DANGER_COLOR[alert.level] }]}>
            {alert.message}
          </Text>
          <TouchableOpacity onPress={dismissAlert}>
            <Ionicons name="close" size={16} color={DANGER_COLOR[alert.level]} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={C.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name ?? 'Caméra'}</Text>
        <View style={[styles.statusPill, { borderColor: sc.color + '50' }]}>
          <Ionicons name={sc.icon} size={10} color={sc.color} />
          <Text style={[styles.statusText, { color: sc.color }]}>{sc.text}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.videoBox, { height: VIDEO_HEIGHT }]}>
          {frame ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${frame}` }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-outline" size={52} color="rgba(245,158,11,0.2)" />
              <Text style={styles.placeholderText}>
                {streaming ? 'En attente du premier flux…' : 'Appuyez sur Démarrer'}
              </Text>
            </View>
          )}

          {streaming && frame && (
            <View style={styles.liveBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}

          {detections.length > 0 && (
            <View style={styles.detectOverlay}>
              <Ionicons name="eye" size={12} color="#fff" />
              <Text style={styles.detectOverlayText}>{detections.length} détection{detections.length > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          {!streaming ? (
            <TouchableOpacity
              style={[styles.mainBtn, styles.startBtn, status !== 'connected' && styles.btnDisabled]}
              onPress={startStream}
              disabled={status !== 'connected'}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={20} color={C.bg} />
              <Text style={styles.startBtnText}>Démarrer le flux</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.mainBtn, styles.stopBtn]} onPress={stopStream} activeOpacity={0.85}>
              <Ionicons name="stop" size={20} color={C.danger} />
              <Text style={styles.stopBtnText}>Arrêter</Text>
            </TouchableOpacity>
          )}

          {(status === 'disconnected' || status === 'error') && (
            <TouchableOpacity style={styles.reconnectBtn} onPress={connect}>
              <Ionicons name="refresh" size={15} color={C.primary} />
              <Text style={styles.reconnectText}>Reconnecter</Text>
            </TouchableOpacity>
          )}
        </View>

        {detections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détections en cours</Text>
            <View style={styles.chipsRow}>
              {detections.map((d, i) => (
                <View
                  key={i}
                  style={[styles.chip, { backgroundColor: DANGER_COLOR[d.danger_level] + '18', borderColor: DANGER_COLOR[d.danger_level] + '40' }]}
                >
                  <View style={[styles.chipDot, { backgroundColor: DANGER_COLOR[d.danger_level] }]} />
                  <Text style={[styles.chipLabel, { color: DANGER_COLOR[d.danger_level] }]}>{d.label}</Text>
                  <Text style={styles.chipConf}>{Math.round(d.confidence * 100)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="videocam-outline"  label="Caméra"    value={name ?? 'N/A'} />
            <View style={styles.infoDivider} />
            <InfoRow icon="pulse-outline"     label="Protocole" value="WebSocket · YOLOv8n" />
            <View style={styles.infoDivider} />
            <InfoRow icon="shield-outline"    label="IA"        value="Détection temps réel" />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={C.primaryLt} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  alertBanner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  alertBannerText: { flex: 1, fontSize: 13, fontWeight: '600' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.text },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

  videoBox: {
    width: '100%', backgroundColor: '#000',
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    marginBottom: 16,
  },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  placeholderText: { color: C.textMuted, fontSize: 13 },

  liveBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  livePulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  detectOverlay: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  detectOverlayText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  controls: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  mainBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 15, gap: 8,
  },
  startBtn: {
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  startBtnText: { color: C.bg, fontSize: 15, fontWeight: '700' },
  stopBtn: {
    backgroundColor: C.dangerBg,
    borderWidth: 1, borderColor: C.dangerBd,
  },
  stopBtnText: { color: C.danger, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.45 },
  reconnectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15,
    borderWidth: 1, borderColor: C.border,
  },
  reconnectText: { color: C.primary, fontWeight: '700', fontSize: 13 },

  section: { marginBottom: 20 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipLabel: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  chipConf: { color: C.textMuted, fontSize: 11 },

  infoCard: {
    backgroundColor: C.bgCard, borderRadius: 14, paddingVertical: 4,
    borderWidth: 1, borderColor: C.borderLt,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  infoLabel: { color: C.textMuted, fontSize: 13, flex: 1 },
  infoValue: { color: C.text, fontSize: 13, fontWeight: '500', maxWidth: '55%' },
  infoDivider: { height: 1, backgroundColor: C.borderLt, marginHorizontal: 14 },
});

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { api } from '../../src/api/client';
import { C, DANGER_CFG } from '../../src/constants/theme';

type Detection = {
  label: string;
  camera_name: string;
  danger_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  detected_at: string;
};

type Alert = {
  id: string;
  message: string;
  is_read: boolean;
  resolved_at: string | null;
  created_at: string;
  detection_detail: Detection;
};

type Filter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNREAD';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL',    label: 'Toutes'   },
  { key: 'UNREAD', label: 'Non lues' },
  { key: 'HIGH',   label: 'Élevé'    },
  { key: 'MEDIUM', label: 'Moyen'    },
  { key: 'LOW',    label: 'Faible'   },
];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts]         = useState<Alert[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<Filter>('ALL');
  const [error, setError]           = useState('');
  const [marking, setMarking]       = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setError('');
      const data = await api.get<Alert[] | { results: Alert[] }>(
        '/v1/surveillance/alerts/?ordering=-created_at'
      );
      setAlerts(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch {
      setError('Impossible de charger les alertes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  async function markRead(id: string) {
    setMarking(id);
    try {
      await api.patch(`/v1/surveillance/alerts/${id}/read/`, {});
      setAlerts(prev => prev.map(a => (a.id === id ? { ...a, is_read: true } : a)));
    } finally {
      setMarking(null);
    }
  }

  const filtered = alerts.filter(a => {
    if (filter === 'UNREAD') return !a.is_read;
    if (filter === 'ALL')    return true;
    return a.detection_detail?.danger_level === filter;
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alertes</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadHint}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Text>
          )}
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{alerts.length}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color="rgba(239,68,68,0.5)" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAlerts}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAlerts(); }}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-circle-outline" size={48} color="rgba(245,158,11,0.3)" />
              <Text style={styles.emptyTitle}>Aucune alerte</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'ALL' ? 'Tout est calme sur vos parcelles.' : 'Aucune alerte pour ce filtre.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              onMarkRead={() => markRead(item.id)}
              marking={marking === item.id}
            />
          )}
        />
      )}
    </View>
  );
}

function AlertCard({ alert, onMarkRead, marking }: { alert: Alert; onMarkRead: () => void; marking: boolean }) {
  const det = alert.detection_detail;
  const cfg = DANGER_CFG[det?.danger_level ?? 'LOW'];

  return (
    <View style={[styles.card, !alert.is_read && styles.cardUnread]}>
      {!alert.is_read && <View style={styles.unreadDot} />}

      <View style={[styles.dangerIconBg, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.cardLabel}>{det?.label ?? 'Détection'}</Text>
          <View style={[styles.levelBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.levelText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {det?.camera_name && (
          <View style={styles.cameraRow}>
            <Ionicons name="videocam-outline" size={12} color={C.textMuted} />
            <Text style={styles.cameraName}>{det.camera_name}</Text>
          </View>
        )}

        <Text style={styles.message} numberOfLines={2}>{alert.message}</Text>

        <View style={styles.cardBottom}>
          <Text style={styles.timeText}>{timeAgo(alert.created_at)}</Text>
          {!alert.is_read && (
            <TouchableOpacity style={styles.readBtn} onPress={onMarkRead} disabled={marking} activeOpacity={0.8}>
              {marking ? (
                <ActivityIndicator size="small" color={C.primary} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={12} color={C.primary} />
                  <Text style={styles.readBtnText}>Marquer lue</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {alert.resolved_at && (
            <View style={styles.resolvedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={C.success} />
              <Text style={styles.resolvedText}>Résolue</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  unreadHint: { fontSize: 12, color: C.primary, fontWeight: '600', marginTop: 2 },
  totalBadge: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  totalText: { color: C.textMuted, fontSize: 14, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'rgba(245,158,11,0.04)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: C.primary,
  },
  filterLabel: { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  filterLabelActive: { color: C.primary },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorText: { color: '#fca5a5', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: C.dangerBg, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 8,
    borderWidth: 1, borderColor: C.dangerBd,
  },
  retryText: { color: '#fca5a5', fontWeight: '600', fontSize: 13 },
  emptyTitle: { color: C.primary, fontSize: 16, fontWeight: '700' },
  emptySubtitle: { color: C.textMuted, fontSize: 13, textAlign: 'center' },
  card: {
    backgroundColor: C.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.borderLt,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    position: 'relative', overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: 'rgba(245,158,11,0.04)',
    borderColor: C.border,
  },
  unreadDot: {
    position: 'absolute', top: 14, right: 14,
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary,
  },
  dangerIconBg: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardContent: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardLabel: { color: C.text, fontSize: 15, fontWeight: '700', flex: 1 },
  levelBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  levelText: { fontSize: 11, fontWeight: '700' },
  cameraRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cameraName: { color: C.textMuted, fontSize: 12 },
  message: { color: C.textMuted, fontSize: 12, lineHeight: 18, marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  timeText: { color: 'rgba(154,128,96,0.7)', fontSize: 11 },
  readBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  readBtnText: { color: C.primary, fontSize: 11, fontWeight: '600' },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resolvedText: { color: C.success, fontSize: 11, fontWeight: '600' },
});

import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/api/client';
import AgriWatchLogo from '../../src/components/AgriWatchLogo';
import { C, DANGER_CFG } from '../../src/constants/theme';

type Stats = { cameras_count: number; weekly_detections: number; weekly_alerts: number; last_detection: string | null };
type Alert = { id: string; message: string; is_read: boolean; created_at: string; detection_detail: { label: string; camera_name: string; danger_level: 'LOW'|'MEDIUM'|'HIGH' } };

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "À l'instant";
  if (d < 3600) return `Il y a ${Math.floor(d/60)} min`;
  if (d < 86400) return `Il y a ${Math.floor(d/3600)} h`;
  return `Il y a ${Math.floor(d/86400)} j`;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [s, a] = await Promise.all([
        api.get<Stats>('/v1/surveillance/dashboard/overview/'),
        api.get<{ results: Alert[] } | Alert[]>('/v1/surveillance/alerts/?ordering=-created_at&page_size=4'),
      ]);
      setStats(s);
      setAlerts(Array.isArray(a) ? a : (a as any).results ?? []);
    } catch { setError('Impossible de charger les données.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const greeting = new Date().getHours() < 12 ? 'Bonjour' : new Date().getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AgriWatchLogo size={32} />
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.username}>{user?.first_name || user?.username}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(app)/alerts')}>
          <Ionicons name="notifications-outline" size={22} color={C.primary} />
          {(stats?.weekly_alerts ?? 0) > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats!.weekly_alerts > 9 ? '9+' : stats!.weekly_alerts}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={C.primary} colors={[C.primary]} />}
      >
        {/* Statut */}
        <View style={styles.statusBar}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Système opérationnel</Text>
          {stats?.last_detection && <Text style={styles.statusSub}>· {timeAgo(stats.last_detection)}</Text>}
        </View>

        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator color={C.primary} /></View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={20} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard icon="videocam"     value={stats?.cameras_count    ?? 0} label="Caméras"      color={C.primary} />
              <StatCard icon="eye"          value={stats?.weekly_detections ?? 0} label="Détections"   color="#60a5fa" />
              <StatCard icon="alert-circle" value={stats?.weekly_alerts     ?? 0} label="Alertes"      color={C.danger} />
            </View>

            {/* Alertes récentes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Alertes récentes</Text>
                <TouchableOpacity onPress={() => router.push('/(app)/alerts')}>
                  <Text style={styles.seeAll}>Voir tout</Text>
                </TouchableOpacity>
              </View>
              {alerts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="shield-checkmark" size={32} color={C.primary} />
                  <Text style={styles.emptyText}>Aucune alerte récente</Text>
                </View>
              ) : alerts.slice(0,4).map(a => <AlertRow key={a.id} alert={a} />)}
            </View>

            {/* Actions rapides */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions rapides</Text>
              <View style={styles.actionsRow}>
                <QuickAction icon="videocam"       label="Caméras"    onPress={() => router.push('/(app)/cameras')}  />
                <QuickAction icon="warning"        label="Alertes"    onPress={() => router.push('/(app)/alerts')}   />
                <QuickAction icon="chatbubble"     label="Messages"   onPress={() => router.push('/(app)/inbox')}    />
                <QuickAction icon="document-text"  label="Rapports"   onPress={() => router.push('/(app)/reports')}  />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label, color }: { icon: any; value: number; label: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const cfg = DANGER_CFG[alert.detection_detail?.danger_level ?? 'LOW'];
  return (
    <View style={styles.alertRow}>
      <View style={[styles.alertIcon, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      </View>
      <View style={styles.alertInfo}>
        <Text style={styles.alertLabel}>{alert.detection_detail?.label ?? 'Détection'}</Text>
        <Text style={styles.alertTime}>{timeAgo(alert.created_at)}</Text>
      </View>
      <View style={[styles.levelBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.levelText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.quickIconBg}><Ionicons name={icon} size={22} color={C.primary} /></View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 12, color: C.primary, fontWeight: '500' },
  username: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  notifBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: C.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,158,11,0.06)', borderRadius: 10, padding: 10, marginBottom: 20, borderWidth: 1, borderColor: C.borderLt },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  statusText: { color: C.primary, fontSize: 13, fontWeight: '600' },
  statusSub: { color: C.textMuted, fontSize: 12 },
  loadingBox: { alignItems: 'center', paddingVertical: 40 },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.dangerBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.dangerBd },
  errorText: { color: '#fca5a5', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.bgCard, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(245,158,11,0.07)', borderTopWidth: 3 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { color: C.textMuted, fontSize: 10, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  seeAll: { color: C.primary, fontSize: 13, fontWeight: '600' },
  emptyCard: { alignItems: 'center', gap: 10, padding: 28, backgroundColor: 'rgba(245,158,11,0.05)', borderRadius: 16, borderWidth: 1, borderColor: C.borderLt },
  emptyText: { color: C.primary, fontSize: 14 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bgCard, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.07)' },
  alertIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  alertInfo: { flex: 1 },
  alertLabel: { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  alertTime: { color: C.textMuted, fontSize: 12 },
  levelBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  levelText: { fontSize: 11, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  quickAction: { flex: 1, alignItems: 'center', gap: 8, backgroundColor: C.bgCard, borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.07)' },
  quickIconBg: { width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: C.textMuted, fontSize: 11, fontWeight: '600' },
});

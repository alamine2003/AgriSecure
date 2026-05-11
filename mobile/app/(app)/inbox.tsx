import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { api } from '../../src/api/client';
import { C } from '../../src/constants/theme';

type Notif = {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "À l'instant";
  if (d < 3600) return `${Math.floor(d / 60)} min`;
  if (d < 86400) return `${Math.floor(d / 3600)} h`;
  return `${Math.floor(d / 86400)} j`;
}

const TYPE_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  alert:         'warning',
  detection:     'eye',
  system:        'settings',
  installation:  'build',
};

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const [notifs,  setNotifs]    = useState<Notif[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,   setError]     = useState('');

  const fetchNotifs = useCallback(async () => {
    try {
      setError('');
      const data = await api.get<Notif[] | { results: Notif[] }>('/v1/notifications/notifications/?ordering=-created_at');
      setNotifs(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch {
      setError('Impossible de charger les messages.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  async function markRead(id: string) {
    try {
      await api.patch(`/v1/notifications/notifications/${id}/`, { is_read: true });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  }

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Messagerie</Text>
          {unread > 0 && <Text style={styles.unread}>{unread} non lu{unread > 1 ? 's' : ''}</Text>}
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>{notifs.length}</Text></View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={C.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={C.dangerBg} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNotifs}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNotifs(); }}
              tintColor={C.primary} colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="chatbubble-outline" size={48} color="rgba(245,158,11,0.3)" />
              <Text style={styles.emptyTitle}>Aucun message</Text>
              <Text style={styles.emptySub}>Vos notifications apparaîtront ici.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.is_read && styles.cardUnread]}
              onPress={() => !item.is_read && markRead(item.id)}
              activeOpacity={0.8}
            >
              {!item.is_read && <View style={styles.unreadDot} />}
              <View style={styles.iconBg}>
                <Ionicons name={TYPE_ICON[item.notification_type] ?? 'notifications'} size={20} color={C.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardMsg}  numberOfLines={2}>{item.message}</Text>
                <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
              </View>
              {!item.is_read && (
                <View style={styles.readDot} />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: C.text },
  unread: { fontSize: 12, color: C.primary, fontWeight: '600', marginTop: 2 },
  badge: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  badgeText: { color: C.textMuted, fontSize: 14, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorText: { color: '#fca5a5', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: C.dangerBg, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 8,
    borderWidth: 1, borderColor: C.dangerBd,
  },
  retryText: { color: '#fca5a5', fontWeight: '600', fontSize: 13 },
  emptyTitle: { color: C.primary, fontSize: 16, fontWeight: '700' },
  emptySub: { color: C.textMuted, fontSize: 13, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.07)',
    position: 'relative',
  },
  cardUnread: { borderColor: C.border, backgroundColor: 'rgba(245,158,11,0.04)' },
  unreadDot: {
    position: 'absolute', top: 14, right: 14,
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary,
  },
  iconBg: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardContent: { flex: 1, gap: 3 },
  cardTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
  cardMsg:   { color: C.textMuted, fontSize: 13, lineHeight: 18 },
  cardTime:  { color: 'rgba(154,128,96,0.7)', fontSize: 11, marginTop: 4 },
  readDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 6 },
});

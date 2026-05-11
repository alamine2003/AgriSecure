import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { api } from '../../src/api/client';
import { C } from '../../src/constants/theme';

type Camera = {
  id: string;
  name: string;
  location: string | null;
  camera_index: number;
  is_active: boolean;
  latitude: string | null;
  longitude: string | null;
  installed_at: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CamerasScreen() {
  const insets = useSafeAreaInsets();
  const [cameras, setCameras]       = useState<Camera[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [error, setError]           = useState('');

  const fetchCameras = useCallback(async () => {
    try {
      setError('');
      const data = await api.get<Camera[] | { results: Camera[] }>('/v1/surveillance/cameras/');
      setCameras(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch {
      setError('Impossible de charger les caméras.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCameras(); }, [fetchCameras]);

  const filtered = cameras.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.location ?? '').toLowerCase().includes(q);
  });

  const activeCount   = cameras.filter(c => c.is_active).length;
  const inactiveCount = cameras.length - activeCount;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes Caméras</Text>
          <Text style={styles.subtitle}>
            {activeCount} active{activeCount > 1 ? 's' : ''}
            {inactiveCount > 0 ? ` · ${inactiveCount} inactive${inactiveCount > 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{cameras.length}</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou lieu…"
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color="rgba(239,68,68,0.5)" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCameras}>
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
              onRefresh={() => { setRefreshing(true); fetchCameras(); }}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="videocam-off-outline" size={48} color="rgba(245,158,11,0.2)" />
              <Text style={styles.emptyTitle}>
                {search ? 'Aucun résultat' : 'Aucune caméra installée'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? 'Essayez un autre terme de recherche.'
                  : 'Vos caméras apparaîtront ici après installation.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <CameraCard
              camera={item}
              onPress={() =>
                router.push({ pathname: '/(app)/camera-stream', params: { id: item.id, name: item.name } })
              }
            />
          )}
        />
      )}
    </View>
  );
}

function CameraCard({ camera, onPress }: { camera: Camera; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.card, !camera.is_active && styles.cardInactive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.cameraIconBg, camera.is_active ? styles.iconBgActive : styles.iconBgInactive]}>
        <Ionicons
          name={camera.is_active ? 'videocam' : 'videocam-off'}
          size={24}
          color={camera.is_active ? C.primary : C.textMuted}
        />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.cameraName}>{camera.name}</Text>
          <View style={[styles.statusBadge, camera.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <View style={[styles.statusDot, { backgroundColor: camera.is_active ? C.primary : C.textMuted }]} />
            <Text style={[styles.statusText, { color: camera.is_active ? C.primary : C.textMuted }]}>
              {camera.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {camera.location && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={12} color={C.textMuted} />
            <Text style={styles.infoText}>{camera.location}</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="hardware-chip-outline" size={12} color={C.textMuted} />
            <Text style={styles.metaText}>Caméra #{camera.camera_index}</Text>
          </View>
          {camera.installed_at && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
              <Text style={styles.metaText}>{formatDate(camera.installed_at)}</Text>
            </View>
          )}
          {camera.latitude && camera.longitude && (
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={12} color={C.textMuted} />
              <Text style={styles.metaText}>GPS</Text>
            </View>
          )}
        </View>
      </View>

      {camera.is_active && (
        <Ionicons name="chevron-forward" size={18} color={C.primary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  countBadge: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  countText: { color: C.textMuted, fontSize: 14, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorText: { color: '#fca5a5', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: C.dangerBg, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 8,
    borderWidth: 1, borderColor: C.dangerBd,
  },
  retryText: { color: '#fca5a5', fontWeight: '600', fontSize: 13 },
  emptyTitle: { color: C.primary, fontSize: 16, fontWeight: '600' },
  emptySubtitle: { color: C.textMuted, fontSize: 13, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.borderLt,
  },
  cardInactive: { opacity: 0.65 },
  cameraIconBg: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconBgActive:   { backgroundColor: 'rgba(245,158,11,0.1)' },
  iconBgInactive: { backgroundColor: 'rgba(154,128,96,0.1)' },
  cardContent: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cameraName: { color: C.text, fontSize: 15, fontWeight: '700', flex: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  activeBadge:   { backgroundColor: 'rgba(245,158,11,0.1)' },
  inactiveBadge: { backgroundColor: 'rgba(154,128,96,0.1)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { color: C.textMuted, fontSize: 12 },
  metaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: C.textMuted, fontSize: 11 },
});

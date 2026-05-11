import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { api } from '../../src/api/client';
import { C } from '../../src/constants/theme';

type Report = {
  id: string;
  title: string;
  description?: string;
  report_type: string;
  pdf_file?: string;
  created_at: string;
  period_start?: string;
  period_end?: string;
};

function fmt(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TYPE_LABEL: Record<string, string> = {
  daily:   'Quotidien',
  weekly:  'Hebdomadaire',
  monthly: 'Mensuel',
  custom:  'Personnalisé',
};

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [reports,   setReports]   = useState<Report[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setError('');
      const data = await api.get<Report[] | { results: Report[] }>('/v1/reports/?ordering=-created_at');
      setReports(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch {
      setError('Impossible de charger les rapports.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Rapports</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{reports.length}</Text></View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={C.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color="rgba(239,68,68,0.4)" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchReports}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchReports(); }}
              tintColor={C.primary} colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={48} color="rgba(245,158,11,0.3)" />
              <Text style={styles.emptyTitle}>Aucun rapport</Text>
              <Text style={styles.emptySub}>Les rapports générés apparaîtront ici.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconBg}>
                  <Ionicons name="document-text" size={22} color={C.primary} />
                </View>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{TYPE_LABEL[item.report_type] ?? item.report_type}</Text>
                  </View>
                </View>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.cardMeta}>
                  <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
                  <Text style={styles.cardDate}>
                    {item.period_start ? `${fmt(item.period_start)} → ${fmt(item.period_end)}` : fmt(item.created_at)}
                  </Text>
                </View>
              </View>
              {item.pdf_file ? (
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => Linking.openURL(item.pdf_file!)}
                >
                  <Ionicons name="download-outline" size={20} color={C.primary} />
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: C.text },
  badge: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  badgeText: { color: C.textMuted, fontSize: 14, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorText: { color: '#fca5a5', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: C.dangerBg, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 8, borderWidth: 1, borderColor: C.dangerBd,
  },
  retryText: { color: '#fca5a5', fontWeight: '600', fontSize: 13 },
  emptyTitle: { color: C.primary, fontSize: 16, fontWeight: '700' },
  emptySub:   { color: C.textMuted, fontSize: 13, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.07)',
  },
  cardLeft: {},
  iconBg: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { color: C.text, fontSize: 14, fontWeight: '700', flex: 1 },
  typeBadge: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.border,
  },
  typeText: { color: C.primary, fontSize: 10, fontWeight: '700' },
  cardDesc: { color: C.textMuted, fontSize: 12, lineHeight: 17 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { color: 'rgba(154,128,96,0.7)', fontSize: 11 },
  downloadBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
});

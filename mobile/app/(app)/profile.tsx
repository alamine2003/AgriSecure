import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import AgriWatchLogo from '../../src/components/AgriWatchLogo';
import { C } from '../../src/constants/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const initial = (user?.first_name?.[0] || user?.username?.[0] || 'A').toUpperCase();
  const fullName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}` : user?.username ?? '—';

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <AgriWatchLogo size={28} />
        <Text style={styles.title}>Mon Profil</Text>
      </View>

      {/* Avatar & nom */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={12} color={C.primary} />
          <Text style={styles.roleText}>Agent Agricole</Text>
        </View>
      </View>

      {/* Infos */}
      <View style={styles.infoCard}>
        <InfoRow icon="mail-outline"   label="Email"       value={user?.email    ?? '—'} />
        <View style={styles.sep} />
        <InfoRow icon="person-outline" label="Identifiant" value={user?.username ?? '—'} />
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        <ActionRow icon="key-outline"       label="Changer le mot de passe" onPress={() => router.push('/(auth)/change-password')} />
        <View style={styles.sep} />
        <ActionRow icon="information-circle-outline" label="À propos d'AgriWatch" onPress={() => {}} />
      </View>

      {/* Déconnexion */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color={C.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.version}>AgriWatch v1.0</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={C.primary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={16} color={C.primary} />
      <Text style={[styles.infoValue, { flex: 1, marginLeft: 0 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={15} color={C.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: C.text },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.primaryDk,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: C.border,
  },
  roleText: { color: C.primary, fontSize: 12, fontWeight: '700' },
  infoCard: {
    backgroundColor: C.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.07)',
    marginBottom: 12,
  },
  actionsCard: {
    backgroundColor: C.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.07)',
    marginBottom: 24,
  },
  sep: { height: 1, backgroundColor: C.borderLt, marginHorizontal: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  infoContent: { flex: 1 },
  infoLabel: { color: C.textMuted, fontSize: 11, marginBottom: 2 },
  infoValue: { color: C.text, fontSize: 14, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.dangerBg, borderRadius: 14,
    paddingVertical: 14, borderWidth: 1, borderColor: C.dangerBd,
    marginBottom: 16,
  },
  logoutText: { color: C.danger, fontSize: 15, fontWeight: '700' },
  version: { color: C.textMuted, fontSize: 11, textAlign: 'center' },
});

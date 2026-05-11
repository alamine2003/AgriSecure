import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AgriWatchLogo from '../src/components/AgriWatchLogo';
import { C } from '../src/constants/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={C.grad}
      style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
    >
      <StatusBar style="light" />
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoWrapper}>
          <AgriWatchLogo size={56} />
        </View>
        <Text style={styles.appName}>AgriWatch</Text>
        <Text style={styles.tagline}>SURVEILLANCE AGRICOLE INTELLIGENTE</Text>
        <View style={styles.divider} />
        <Text style={styles.desc}>
          Protégez vos cultures grâce à la détection d'intrusions en temps réel alimentée par l'IA.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresCard}>
        <Feature icon="videocam-outline"   label="Caméras en direct" />
        <View style={styles.sep} />
        <Feature icon="notifications-outline" label="Alertes instantanées" />
        <View style={styles.sep} />
        <Feature icon="analytics-outline"  label="Analyse IA · YOLOv8" />
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.85}>
          <Text style={styles.loginBtnText}>Se connecter</Text>
          <Ionicons name="arrow-forward-circle" size={22} color={C.bg} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')} activeOpacity={0.85}>
          <Ionicons name="person-add-outline" size={18} color={C.primary} />
          <Text style={styles.registerBtnText}>Faire une demande d'inscription</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AgriWatch v1.0 · Tous droits réservés</Text>
      </View>
    </LinearGradient>
  );
}

function Feature({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconBg}>
        <Ionicons name={icon} size={20} color={C.primary} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  circleTopRight: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(245,158,11,0.06)', top: -70, right: -70,
  },
  circleBottomLeft: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(245,158,11,0.04)', bottom: -110, left: -110,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 24 },
  logoWrapper: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.25)',
  },
  appName: { fontSize: 44, fontWeight: '800', color: C.text, letterSpacing: -1, marginBottom: 8 },
  tagline: { fontSize: 11, color: C.primary, fontWeight: '700', letterSpacing: 1.5, marginBottom: 24 },
  divider: { width: 44, height: 2.5, backgroundColor: C.primary, borderRadius: 2, marginBottom: 24 },
  desc: { fontSize: 14, color: 'rgba(245,240,232,0.55)', textAlign: 'center', lineHeight: 22, maxWidth: width * 0.78 },
  featuresCard: {
    backgroundColor: 'rgba(245,158,11,0.06)', borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 20,
    borderWidth: 1, borderColor: C.border, marginBottom: 24,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 14 },
  sep: { height: 1, backgroundColor: C.borderLt },
  featureIconBg: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { color: C.text, fontSize: 14, fontWeight: '500' },
  ctas: { gap: 12, alignItems: 'center' },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.primary, borderRadius: 16,
    paddingVertical: 17, width: '100%', gap: 10,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  loginBtnText: { color: C.bg, fontSize: 16, fontWeight: '800' },
  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 13, width: '100%',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1, borderColor: C.border,
  },
  registerBtnText: { color: C.primary, fontSize: 14, fontWeight: '600' },
  version: { color: 'rgba(245,240,232,0.2)', fontSize: 11 },
});

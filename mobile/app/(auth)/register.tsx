import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AgriWatchLogo from '../../src/components/AgriWatchLogo';
import { C, REGIONS } from '../../src/constants/theme';
import { API_BASE_URL } from '../../src/constants/api';

type Form = {
  first_name: string; last_name: string;
  nin: string; email: string; phone: string;
  region: string; locality: string; address: string; farm_size: string;
};

const INIT: Form = { first_name:'', last_name:'', nin:'', email:'', phone:'', region:'', locality:'', address:'', farm_size:'' };

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [form, setForm]     = useState<Form>(INIT);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [showRegions, setShowRegions] = useState(false);

  function set(key: keyof Form) {
    return (val: string) => { setForm(f => ({ ...f, [key]: val })); setError(''); };
  }

  async function handleSubmit() {
    const required: (keyof Form)[] = ['first_name','last_name','nin','email','phone','region','locality','address'];
    for (const k of required) {
      if (!form[k].trim()) { setError(`Le champ "${k}" est requis.`); return; }
    }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/v1/surveillance/registration-requests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Object.values(data).flat().join(' ') || 'Erreur lors de l\'envoi.';
        setError(msg); return;
      }
      setSuccess(true);
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally { setLoading(false); }
  }

  if (success) {
    return (
      <LinearGradient colors={C.grad} style={styles.gradient}>
        <StatusBar style="light" />
        <View style={[styles.successScreen, { paddingTop: insets.top + 40 }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color={C.primary} />
          </View>
          <Text style={styles.successTitle}>Demande envoyée !</Text>
          <Text style={styles.successText}>
            Votre demande d'inscription a bien été transmise. Un maintenancier la traitera dans les meilleurs délais. Vous recevrez un email de confirmation.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/')}>
            <Text style={styles.doneBtnText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={C.grad} style={styles.gradient}>
      <StatusBar style="light" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <AgriWatchLogo size={24} />
            <Text style={styles.headerText}>Demande d'inscription</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Informations personnelles</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Row>
            <Field label="Prénom *"     value={form.first_name} onchange={set('first_name')} />
            <Field label="Nom *"        value={form.last_name}  onchange={set('last_name')}  />
          </Row>
          <Field label="NIN (Numéro d'identification) *" value={form.nin}   onchange={set('nin')}   />
          <Field label="Email *"         value={form.email}  onchange={set('email')}  kb="email-address" />
          <Field label="Téléphone *"     value={form.phone}  onchange={set('phone')}  kb="phone-pad"     />

          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Exploitation agricole</Text>

          {/* Région picker */}
          <TouchableOpacity style={styles.inputWrap} onPress={() => setShowRegions(v => !v)}>
            <Ionicons name="location-outline" size={18} color={C.primaryLt} style={styles.icon} />
            <Text style={[styles.inputText, !form.region && { color: C.textMuted }]}>
              {form.region || 'Région *'}
            </Text>
            <Ionicons name={showRegions ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
          </TouchableOpacity>
          {showRegions && (
            <View style={styles.regionList}>
              {REGIONS.map(r => (
                <TouchableOpacity key={r} style={styles.regionItem}
                  onPress={() => { set('region')(r); setShowRegions(false); }}>
                  <Text style={[styles.regionText, form.region === r && { color: C.primary, fontWeight: '700' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Field label="Localité *"              value={form.locality}  onchange={set('locality')}  />
          <Field label="Adresse *"               value={form.address}   onchange={set('address')}   />
          <Field label="Superficie de l'exploitation (ha)" value={form.farm_size} onchange={set('farm_size')} />

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit} disabled={loading} activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.bg} />
              : <><Text style={styles.submitBtnText}>Envoyer la demande</Text><Ionicons name="send" size={18} color={C.bg} /></>
            }
          </TouchableOpacity>

          <Text style={styles.note}>
            Après validation par un maintenancier, un compte vous sera créé et vos identifiants vous seront communiqués par email.
          </Text>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
}

function Field({ label, value, onchange, kb = 'default' }: {
  label: string; value: string;
  onchange: (v: string) => void;
  kb?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={[styles.inputWrap, { flex: 1 }]}>
      <TextInput
        style={styles.inputText}
        placeholder={label}
        placeholderTextColor={C.textMuted}
        value={value}
        onChangeText={onchange}
        keyboardType={kb}
        autoCapitalize={kb === 'default' ? 'words' : 'none'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { color: C.text, fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  sectionLabel: { color: C.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: C.dangerBg, borderWidth: 1, borderColor: C.dangerBd,
    borderRadius: 12, padding: 12,
  },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, minHeight: 52,
  },
  icon: { marginRight: 10 },
  inputText: { flex: 1, color: C.text, fontSize: 14, paddingVertical: 14 },
  regionList: {
    backgroundColor: C.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    maxHeight: 220, overflow: 'hidden',
  },
  regionItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.borderLt },
  regionText: { color: C.text, fontSize: 14 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.primary, borderRadius: 16,
    paddingVertical: 17, gap: 10, marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  submitBtnText: { color: C.bg, fontSize: 16, fontWeight: '800' },
  note: { color: C.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.border,
  },
  successTitle: { fontSize: 26, fontWeight: '800', color: C.text, textAlign: 'center' },
  successText: { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  doneBtn: {
    backgroundColor: C.primary, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 32,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  doneBtnText: { color: C.bg, fontSize: 15, fontWeight: '800' },
});

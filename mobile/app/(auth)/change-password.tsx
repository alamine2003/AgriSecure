import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, TextInput as RNTextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { C } from '../../src/constants/theme';

type Field = { value: string; show: boolean };

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [oldPwd,  setOldPwd]  = useState<Field>({ value: '', show: false });
  const [newPwd,  setNewPwd]  = useState<Field>({ value: '', show: false });
  const [confPwd, setConfPwd] = useState<Field>({ value: '', show: false });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const newRef  = useRef<RNTextInput>(null);
  const confRef = useRef<RNTextInput>(null);

  async function handleSubmit() {
    setError('');

    if (!oldPwd.value || !newPwd.value || !confPwd.value) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (newPwd.value !== confPwd.value) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (newPwd.value.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/v1/auth/change-password/', {
        old_password: oldPwd.value,
        new_password: newPwd.value,
      });
      setSuccess(true);
      setTimeout(() => router.replace('/(app)/dashboard'), 1500);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors du changement de mot de passe.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={C.grad} style={styles.gradient} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
      <StatusBar style="light" />
      <View style={styles.circleTop} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Ionicons name="key" size={30} color={C.primary} />
          </View>
          <Text style={styles.title}>Changement de mot de passe</Text>
          <Text style={styles.subtitle}>
            Bonjour {user?.first_name || user?.username}, votre administrateur vous demande de définir un nouveau mot de passe.
          </Text>
        </View>

        <View style={styles.form}>
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#fca5a5" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={16} color={C.success} />
              <Text style={styles.successText}>Mot de passe changé ! Redirection…</Text>
            </View>
          )}

          <PwdInput
            label="Mot de passe actuel"
            icon="lock-open-outline"
            field={oldPwd}
            onChange={v => setOldPwd(f => ({ ...f, value: v }))}
            onToggle={() => setOldPwd(f => ({ ...f, show: !f.show }))}
            returnKeyType="next"
            onSubmit={() => newRef.current?.focus()}
          />

          <PwdInput
            ref={newRef}
            label="Nouveau mot de passe"
            icon="lock-closed-outline"
            field={newPwd}
            onChange={v => setNewPwd(f => ({ ...f, value: v }))}
            onToggle={() => setNewPwd(f => ({ ...f, show: !f.show }))}
            returnKeyType="next"
            onSubmit={() => confRef.current?.focus()}
          />

          <PwdInput
            ref={confRef}
            label="Confirmer le nouveau mot de passe"
            icon="shield-checkmark-outline"
            field={confPwd}
            onChange={v => setConfPwd(f => ({ ...f, value: v }))}
            onToggle={() => setConfPwd(f => ({ ...f, show: !f.show }))}
            returnKeyType="done"
            onSubmit={handleSubmit}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (loading || success) && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading || success}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={C.bg} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Confirmer</Text>
                <Ionicons name="checkmark-circle" size={22} color={C.bg} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutLink}
          onPress={async () => { await logout(); router.replace('/'); }}
        >
          <Ionicons name="log-out-outline" size={15} color={C.textMuted} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function PwdInput({
  ref, label, icon, field, onChange, onToggle, returnKeyType, onSubmit,
}: {
  ref?: React.RefObject<RNTextInput | null>;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  field: Field;
  onChange: (v: string) => void;
  onToggle: () => void;
  returnKeyType: 'next' | 'done';
  onSubmit: () => void;
}) {
  return (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={18} color={C.primaryLt} style={styles.inputIcon} />
      <TextInput
        ref={ref}
        style={[styles.input, { flex: 1 }]}
        placeholder={label}
        placeholderTextColor={C.textMuted}
        value={field.value}
        onChangeText={onChange}
        secureTextEntry={!field.show}
        autoCapitalize="none"
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmit}
      />
      <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
        <Ionicons
          name={field.show ? 'eye-off-outline' : 'eye-outline'}
          size={18}
          color={C.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  circleTop: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(245,158,11,0.05)', top: -80, right: -80,
  },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  iconWrapper: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5, borderColor: C.border,
  },
  title: {
    fontSize: 24, fontWeight: '800', color: C.text,
    letterSpacing: -0.3, marginBottom: 12, textAlign: 'center',
  },
  subtitle: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  form: { gap: 12 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.dangerBg, borderWidth: 1, borderColor: C.dangerBd,
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
  },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.successBg, borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
  },
  successText: { color: C.success, fontSize: 13, flex: 1 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 56,
  },
  inputIcon: { marginRight: 10 },
  input: { color: C.text, fontSize: 15 },
  eyeBtn: { padding: 6 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.primary, borderRadius: 16,
    paddingVertical: 17, gap: 10, marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitBtnText: { color: C.bg, fontSize: 16, fontWeight: '700' },
  logoutLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  logoutText: { color: C.textMuted, fontSize: 13 },
});

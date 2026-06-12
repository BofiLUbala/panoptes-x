import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { api } from '../services/api';
import { ServiceProfile } from '../types';
import CountryCodePicker from '../components/CountryCodePicker';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onWhatsappRegister: (whatsappNumber: string) => void;
}

type AuthMethod = 'email' | 'whatsapp';

interface Constraint {
  key: string;
  label: string;
  test: (v: string) => boolean;
}

const PWD_CONSTRAINTS: Constraint[] = [
  { key: 'length', label: '8-16 caractères', test: (v) => /^.{8,16}$/.test(v) },
  { key: 'upper', label: 'Une majuscule (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Une minuscule (a-z)', test: (v) => /[a-z]/.test(v) },
  { key: 'digit', label: 'Un chiffre (0-9)', test: (v) => /[0-9]/.test(v) },
  { key: 'special', label: 'Un caractère spécial ($@!%*?&)', test: (v) => /[$@!%*?&]/.test(v) },
];

const SERVICE_PROFILES: { key: ServiceProfile; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'business', label: 'Business', icon: 'briefcase-outline' },
  { key: 'family', label: 'Family', icon: 'people-outline' },
  { key: 'partner', label: 'Partner', icon: 'heart-outline' },
];

const TABS: { key: AuthMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'email', label: 'Email', icon: 'mail-outline' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
];

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack, onSuccess, onWhatsappRegister }) => {
  const [serviceProfile, setServiceProfile] = useState<ServiceProfile>('business');
  const [tab, setTab] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [whatsappCode, setWhatsappCode] = useState('+243');
  const [whatsapp, setWhatsapp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const userRef = useRef<TextInput>(null);
  const pwdRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const passwordsMatch = password === confirmPassword;
  const allConstraintsMet = PWD_CONSTRAINTS.every((c) => c.test(password));
  const identifierValid = tab === 'email' ? email.includes('@') : whatsapp.length >= 10;
  const canSubmit = allConstraintsMet && passwordsMatch && password.length > 0 && identifierValid && username.length > 0;
  const showConstraints = password.length > 0;

  const handleRegister = async () => {
    setLoading(true);
    try {
      const payload: any = { auth_method: tab, service_profile: serviceProfile, username, password, confirm_password: confirmPassword };
      if (tab === 'email') {
        payload.email = email;
      } else {
        payload.whatsapp_number = whatsappCode + whatsapp;
      }

      const res = await api.register(payload);
      setErrorMsg('');

      if (tab === 'whatsapp') {
        onWhatsappRegister(whatsappCode + whatsapp);
      } else {
        Alert.alert('Compte créé', res?.message || `Vérifiez votre boîte e-mail à l'adresse ${email} pour activer votre compte.`);
        onSuccess();
      }
    } catch (err: any) {
      console.error('Register error:', err?.message, err?.code, err?.response?.status);
      try {
        const msg = err?.response?.data?.message || err?.message || 'Erreur lors de l\'inscription.';
        setErrorMsg(msg);
        Alert.alert('Erreur', msg);
      } catch (_) {
        setErrorMsg('Erreur inconnue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Choisissez votre méthode d'inscription</Text>

        <View style={styles.profileSelector}>
          <Text style={styles.selectorLabel}>Profil PANOPTES-X</Text>
          <View style={styles.profileRow}>
            {SERVICE_PROFILES.map((profile) => (
              <TouchableOpacity
                key={profile.key}
                style={[styles.profileTab, serviceProfile === profile.key && styles.profileTabActive]}
                onPress={() => setServiceProfile(profile.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={profile.icon} size={16} color={serviceProfile === profile.key ? colors.background : colors.textSecondary} />
                <Text style={[styles.profileText, serviceProfile === profile.key && styles.profileTextActive]}>
                  {profile.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.tabRow}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, tab === t.key && styles.tabActive]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={t.icon} size={15} color={tab === t.key ? colors.primary : colors.textLight} />
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'email' && (
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adresse email"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                onSubmitEditing={() => userRef.current?.focus()}
              />
            </View>
          )}

          {tab === 'whatsapp' && (
            <>
              <View style={styles.inputGroup}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={styles.inputIcon} />
                <CountryCodePicker selectedCode={whatsappCode} onSelectCode={setWhatsappCode} />
                <TextInput
                  style={styles.input}
                  placeholder="XX XXX XXXX"
                  placeholderTextColor={colors.textLight}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={whatsapp}
                  onChangeText={(val) => {
                    const digits = val.replace(/\D/g, '');
                    setWhatsapp(digits);
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => userRef.current?.focus()}
                />
              </View>
              <Text style={styles.hint}>Un code OTP à 6 chiffres vous sera envoyé par WhatsApp.</Text>
            </>
          )}

          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              ref={userRef}
              style={styles.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor={colors.textLight}
              value={username}
              onChangeText={setUsername}
              returnKeyType="next"
              onSubmitEditing={() => pwdRef.current?.focus()}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              ref={pwdRef}
              style={[styles.input, { paddingRight: 40 }]}
              placeholder="Mot de passe"
              placeholderTextColor={colors.textLight}
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPwd(!showPwd)} activeOpacity={0.7}>
              <Ionicons name={showPwd ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {showConstraints && (
            <View style={styles.checklist}>
              {PWD_CONSTRAINTS.map((c) => {
                const ok = c.test(password);
                return (
                  <View key={c.key} style={styles.checkRow}>
                    <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={15} color={ok ? colors.success : colors.warning} />
                    <Text style={[styles.checkLabel, { color: ok ? colors.success : colors.warning }]}>{c.label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={[styles.inputGroup, confirmTouched && { borderColor: passwordsMatch ? colors.success : colors.warning }]}>
            <Ionicons name="lock-open-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              ref={confirmRef}
              style={[styles.input, { paddingRight: 40 }]}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={colors.textLight}
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); if (!confirmTouched) setConfirmTouched(true); }}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirm(!showConfirm)} activeOpacity={0.7}>
              <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>
          {confirmTouched && (
            <Text style={[styles.matchText, { color: passwordsMatch ? colors.success : colors.warning }]}>
              {passwordsMatch ? '✓ Mots de passe identiques' : '✗ Les mots de passe ne correspondent pas'}
            </Text>
          )}

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, (!canSubmit || loading) && styles.submitDisabled]}
            disabled={!canSubmit || loading}
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={styles.loginLink} activeOpacity={0.7}>
            <Text style={styles.loginText}>
              Déjà un compte ? <Text style={styles.loginHighlight}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  backButton: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  profileSelector: { marginBottom: spacing.lg },
  selectorLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.sm },
  profileRow: { flexDirection: 'row', gap: spacing.sm },
  profileTab: {
    flex: 1, minHeight: 46, borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: 6, padding: spacing.sm,
  },
  profileTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  profileText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  profileTextActive: { color: colors.background },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.warning,
    padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm,
  },
  errorText: { fontSize: 13, color: colors.warning, flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg,
  },
  tabRow: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.sm },
  tab: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, paddingVertical: 10, borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.surface, borderColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textLight, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md, paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: spacing.md - 2, fontSize: 15, color: colors.text },
  eyeButton: { padding: 6 },
  hint: { fontSize: 12, color: colors.textLight, marginTop: -10, marginBottom: spacing.md, fontStyle: 'italic' },
  checklist: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  checkLabel: { fontSize: 13, marginLeft: spacing.sm },
  matchText: { fontSize: 13, marginTop: -10, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md - 2,
    alignItems: 'center', marginTop: spacing.sm,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: colors.background, fontWeight: '700', fontSize: fontSize.md },
  loginLink: { alignItems: 'center', marginTop: spacing.lg, padding: spacing.sm },
  loginText: { fontSize: 14, color: colors.textSecondary },
  loginHighlight: { color: colors.primary, fontWeight: '600' },
});

export default RegisterScreen;

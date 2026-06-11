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
        payload.whatsapp_number = whatsapp;
      }

      await api.register(payload);
      setErrorMsg('');

      if (tab === 'whatsapp') {
        onWhatsappRegister(whatsapp);
      } else {
        Alert.alert('Compte créé', 'Vérifiez votre boîte email pour activer votre compte.');
        onSuccess();
      }
    } catch (err: any) {
      console.error('Register error:', err?.message, err?.code, err?.response?.status);
      try {
        const msg = err?.response?.data?.message
          || err?.message
          || 'Erreur lors de l\'inscription.';
        setErrorMsg(msg);
        Alert.alert('Erreur', msg);
      } catch (_) {
        setErrorMsg('Erreur inconnue. Voir console.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1a3a5c" />
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
                <Ionicons
                  name={profile.icon}
                  size={16}
                  color={serviceProfile === profile.key ? colors.white : colors.primary}
                />
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
                <Ionicons
                  name={t.icon}
                  size={15}
                  color={tab === t.key ? '#1a3a5c' : '#999'}
                />
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'email' && (
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={18} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adresse email"
                placeholderTextColor="#aaa"
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
                <TextInput
                  style={styles.input}
                  placeholder="+243 XX XXX XXXX"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  returnKeyType="next"
                  onSubmitEditing={() => userRef.current?.focus()}
                />
              </View>
              <Text style={styles.hint}>Un code OTP à 6 chiffres vous sera envoyé par WhatsApp.</Text>
            </>
          )}

          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              ref={userRef}
              style={styles.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#aaa"
              value={username}
              onChangeText={setUsername}
              returnKeyType="next"
              onSubmitEditing={() => pwdRef.current?.focus()}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              ref={pwdRef}
              style={[styles.input, { paddingRight: 40 }]}
              placeholder="Mot de passe"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPwd(!showPwd)} activeOpacity={0.7}>
              <Ionicons name={showPwd ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          {showConstraints && (
            <View style={styles.checklist}>
              {PWD_CONSTRAINTS.map((c) => {
                const ok = c.test(password);
                return (
                  <View key={c.key} style={styles.checkRow}>
                    <Ionicons
                      name={ok ? 'checkmark-circle' : 'close-circle'}
                      size={15}
                      color={ok ? '#2e7d32' : '#c62828'}
                    />
                    <Text style={[styles.checkLabel, { color: ok ? '#2e7d32' : '#c62828' }]}>
                      {c.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={[styles.inputGroup, confirmTouched && { borderColor: passwordsMatch ? '#2e7d32' : '#c62828' }]}>
            <Ionicons name="lock-open-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              ref={confirmRef}
              style={[styles.input, { paddingRight: 40 }]}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#aaa"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); if (!confirmTouched) setConfirmTouched(true); }}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirm(!showConfirm)} activeOpacity={0.7}>
              <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
            </TouchableOpacity>
          </View>
          {confirmTouched && (
            <Text style={[styles.matchText, { color: passwordsMatch ? '#2e7d32' : '#c62828' }]}>
              {passwordsMatch ? '✓ Mots de passe identiques' : '✗ Les mots de passe ne correspondent pas'}
            </Text>
          )}

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={16} color="#c62828" />
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
              <ActivityIndicator color="#fff" />
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
  container: { flex: 1, backgroundColor: '#f2f4f7' },
  scroll: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8ecf0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 20 },
  profileSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileTab: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e4e8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
  },
  profileTabActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  profileText: {
    fontSize: 12,
    color: '#1a3a5c',
    fontWeight: '600',
  },
  profileTextActive: {
    color: '#2e7d32',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#c62828',
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  tabRow: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8f9fb',
    borderWidth: 1,
    borderColor: '#e0e4e8',
  },
  tabActive: { backgroundColor: '#e8f0fe', borderColor: '#1a3a5c' },
  tabText: { fontSize: 13, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#1a3a5c' },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e4e8',
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#222' },
  eyeButton: { padding: 6 },
  hint: { fontSize: 12, color: '#888', marginTop: -10, marginBottom: 14, fontStyle: 'italic' },
  checklist: { marginBottom: 14, backgroundColor: '#f8f9fb', borderRadius: 10, padding: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  checkLabel: { fontSize: 13, marginLeft: 8 },
  matchText: { fontSize: 13, marginTop: -10, marginBottom: 14 },
  submitButton: {
    backgroundColor: '#1a3a5c',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  loginLink: { alignItems: 'center', marginTop: 20, padding: 8 },
  loginText: { fontSize: 14, color: '#666' },
  loginHighlight: { color: '#1a3a5c', fontWeight: '600' },
});

export default RegisterScreen;


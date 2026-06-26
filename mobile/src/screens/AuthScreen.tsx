import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { api } from '../services/api';
import AppLogo from '../components/AppLogo';

interface AuthScreenProps {
  onLogin: () => void;
  onRegister: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const pwdRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await api.login(identifier, password);
      onLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err?.response?.data?.detail
        || err?.response?.data?.message
        || err?.message
        || 'Impossible de se connecter.';
      Alert.alert('Erreur de connexion', msg);
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
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <AppLogo size={48} />
          </View>
          <Text style={styles.appName}>PANOPTES-X</Text>
          <Text style={styles.tagline}>Console de pilotage financier</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>

          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email, téléphone ou WhatsApp"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPwd(!showPwd)} activeOpacity={0.7}>
              <Ionicons name={showPwd ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, (!identifier || !password || loading) && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={!identifier || !password || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onRegister} style={styles.registerLink} activeOpacity={0.7}>
            <Text style={styles.registerText}>
              Pas encore de compte ?{' '}
              <Text style={styles.registerHighlight}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoBox: {
    width: 72, height: 72, borderRadius: borderRadius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  appName: { fontSize: 28, fontWeight: '800', color: colors.white, letterSpacing: 1.5 },
  tagline: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: 20 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background,
    borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md, paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: spacing.md - 2, fontSize: 15, color: colors.text },
  eyeButton: { padding: 6 },
  loginButton: { backgroundColor: colors.primary, borderRadius: borderRadius.sm, paddingVertical: spacing.md - 2, alignItems: 'center', marginTop: spacing.sm },
  loginButtonDisabled: { opacity: 0.45 },
  loginButtonText: { color: colors.background, fontWeight: '700', fontSize: fontSize.md },
  registerLink: { alignItems: 'center', marginTop: spacing.lg, padding: spacing.sm },
  registerText: { fontSize: 14, color: colors.textSecondary },
  registerHighlight: { color: colors.primary, fontWeight: '600' },
});

export default AuthScreen;

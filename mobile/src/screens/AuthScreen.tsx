import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

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
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Erreur', 'Backend non connecté.');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.appName}>Panoptes-x</Text>
          <Text style={styles.tagline}>Comptabilité automatisée pour agents Mobile Money</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>

          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email, téléphone ou WhatsApp"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPwd(!showPwd)} activeOpacity={0.7}>
              <Ionicons name={showPwd ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, (!identifier || !password || loading) && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={!identifier || !password || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
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
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a3a5c',
  },
  tagline: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
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
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222',
    marginBottom: 20,
  },
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#222',
  },
  eyeButton: {
    padding: 6,
  },
  loginButton: {
    backgroundColor: '#1a3a5c',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  loginButtonDisabled: {
    opacity: 0.45,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 8,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerHighlight: {
    color: '#1a3a5c',
    fontWeight: '600',
  },
});

export default AuthScreen;

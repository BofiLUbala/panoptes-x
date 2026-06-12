import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { api } from '../services/api';

interface OTPVerificationScreenProps {
  whatsappNumber: string;
  onBack: () => void;
  onVerified: () => void;
}

const DIGIT_COUNT = 6;

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ whatsappNumber, onBack, onVerified }) => {
  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const otpCode = digits.join('');

  const handleDigitChange = useCallback((text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < DIGIT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits]);

  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await api.verifyOtp(whatsappNumber, otpCode);
      onVerified();
    } catch (err: any) {
      const data = err?.response?.data;
      const code = data?.error_code;
      const msg = data?.message || 'Code OTP invalide.';
      if (code === 'ERR_OTP_EXPIRED') {
        Alert.alert('Code expiré', 'Le code a expiré. Veuillez vous réinscrire.');
      } else if (code === 'ERR_INVALID_OTP') {
        Alert.alert('Code incorrect', 'Vérifiez le code reçu par WhatsApp.');
      } else {
        Alert.alert('Erreur', msg);
      }
      setDigits(Array(DIGIT_COUNT).fill(''));
      inputRefs.current[0]?.focus();
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

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="logo-whatsapp" size={36} color="#25D366" />
          </View>
          <Text style={styles.title}>Vérification WhatsApp</Text>
          <Text style={styles.subtitle}>
            Un code à 6 chiffres a été envoyé au{'\n'}
            <Text style={styles.number}>{whatsappNumber}</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.digitRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[styles.digitBox, d ? styles.digitFilled : null]}
                keyboardType="number-pad"
                maxLength={1}
                value={d}
                onChangeText={(text) => handleDigitChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                caretHidden
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, (otpCode.length < DIGIT_COUNT || loading) && styles.verifyDisabled]}
            disabled={otpCode.length < DIGIT_COUNT || loading}
            onPress={handleVerify}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.verifyText}>Vérifier mon compte</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            Le code est valable 2 heures.{'\n'}
            Si vous ne recevez rien, vérifiez votre numéro.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  backButton: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  number: { fontWeight: '700', color: '#25D366' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  digitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  digitBox: {
    width: 48, height: 56,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.background,
    textAlign: 'center',
    fontSize: 24, fontWeight: '700', color: colors.text,
  },
  digitFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    alignItems: 'center', width: '100%',
  },
  verifyDisabled: { opacity: 0.5 },
  verifyText: { color: colors.background, fontWeight: '700', fontSize: fontSize.md },
  hint: { marginTop: spacing.md, fontSize: fontSize.xs, color: colors.textLight, textAlign: 'center', lineHeight: 18 },
});

export default OTPVerificationScreen;

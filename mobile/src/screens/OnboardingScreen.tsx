import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Bienvenue sur Panoptes-x',
    subtitle: 'Automatisez votre comptabilité Mobile Money et vente de recharges.',
    icon: 'grid' as const,
  },
  {
    title: 'Lecture des SMS',
    subtitle: 'Autorisez la lecture des SMS pour capturer automatiquement vos transactions.',
    icon: 'chatbubbles' as const,
  },
  {
    title: 'Optimisation batterie',
    subtitle: 'Désactivez l\'optimisation de la batterie pour un fonctionnement en arrière-plan.',
    icon: 'battery-charging' as const,
  },
  {
    title: 'Prêt à démarrer',
    subtitle: 'Créez votre compte avec votre numéro de téléphone et un code PIN à 4 chiffres.',
    icon: 'rocket' as const,
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Ionicons name={STEPS[step].icon} size={56} color={colors.primary} />
        </View>
        <Text style={styles.title}>{STEPS[step].title}</Text>
        <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => (isLast ? onComplete() : setStep(step + 1))}
        >
          <Text style={styles.buttonText}>
            {isLast ? 'Commencer' : 'Suivant'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={onComplete} style={styles.skipButton}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 28,
    borderRadius: 5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 60,
    width: '100%',
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.background,
  },
  skipButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
});

export default OnboardingScreen;

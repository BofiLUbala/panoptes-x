import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ImageStyle,} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppLogo from '../components/AppLogo';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Bienvenue sur Panoptes-x',
    subtitle:
      'Automatisez votre comptabilitÃ© Mobile Money et vente de recharges.',
    showLogo: true,
  },
  {
    title: 'Lecture des SMS',
    subtitle:
      'Autorisez la lecture des SMS pour que nous puissions capturer automatiquement vos transactions.',
    showLogo: true,
  },
  {
    title: 'Optimisation batterie',
    subtitle:
      'DÃ©sactivez l\'optimisation de la batterie pour que l\'application puisse fonctionner en arriÃ¨re-plan.',
    showLogo: true,
  },
  {
    title: 'PrÃªt Ã  dÃ©marrer',
    subtitle:
      'CrÃ©ez votre compte avec votre numÃ©ro de tÃ©lÃ©phone et un code PIN Ã  4 chiffres.',
    showLogo: true,
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const { width } = useWindowDimensions();

  const isLast = step === STEPS.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {STEPS[step].showLogo ? (
          <AppLogo size={132} style={styles.logo as ImageStyle} />
        ) : null}
        <Text style={styles.title}>{STEPS[step].title}</Text>
        <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => (isLast ? onComplete() : setStep(step + 1))}
        >
          <Text style={styles.buttonText}>
            {isLast ? 'Commencer' : 'Suivant'}
          </Text>
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
    backgroundColor: colors.primary,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logo: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
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
    backgroundColor: colors.primaryLight,
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 28,
    borderRadius: 5,
  },
  button: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 60,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.primary,
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



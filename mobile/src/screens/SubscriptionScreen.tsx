import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';

interface NetworkOption {
  key: string;
  label: string;
  merchantNumber: string;
  instructions: { fr: string; ln: string };
}

const NETWORKS: NetworkOption[] = [
  {
    key: 'mpesa',
    label: 'M-Pesa',
    merchantNumber: '',
    instructions: {
      fr: 'Envoyez le montant de votre abonnement au numéro ci-dessus, puis revenez dans l\'application.',
      ln: 'Tinda mbongo ya abonnement na yo na nimero oyo, mpe zonga na application.',
    },
  },
  {
    key: 'orange',
    label: 'Orange Money',
    merchantNumber: '',
    instructions: {
      fr: 'Effectuez un transfert Orange Money vers ce numéro marchand.',
      ln: 'Sala transfert ya Orange Money na nimero ya marchand oyo.',
    },
  },
  {
    key: 'airtel',
    label: 'Airtel Money',
    merchantNumber: '',
    instructions: {
      fr: 'Utilisez Airtel Money pour envoyer le paiement à ce numéro.',
      ln: 'Salela Airtel Money mpo na kotinda lifuti na nimero oyo.',
    },
  },
];

const SubscriptionScreen: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const network = NETWORKS.find((n) => n.key === selectedNetwork);

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Abonnement" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Empty plans — will be configured later */}
        <View style={styles.emptyPlansBox}>
          <Ionicons name="card-outline" size={36} color={colors.textLight} />
          <Text style={styles.emptyPlansTitle}>Plans d'abonnement</Text>
          <Text style={styles.emptyPlansText}>
            Les plans d'abonnement seront disponibles prochainement.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Paiement par Mobile Money</Text>
        <Text style={styles.sectionSubtitle}>Choisissez votre réseau de paiement</Text>

        {NETWORKS.map((net) => (
          <TouchableOpacity
            key={net.key}
            style={[styles.networkCard, selectedNetwork === net.key && styles.networkCardActive]}
            onPress={() => setSelectedNetwork(net.key)}
          >
            <View style={[styles.networkDot, selectedNetwork === net.key && styles.networkDotActive]} />
            <Text style={styles.networkLabel}>{net.label}</Text>
          </TouchableOpacity>
        ))}

        {network && (
          <View style={styles.paymentInfo}>
            <Text style={styles.merchantLabel}>Numéro marchand</Text>
            <TouchableOpacity style={styles.merchantRow} onPress={() => handleCopy(network.merchantNumber)}>
              <Text style={styles.merchantNumber}>{network.merchantNumber || '—'}</Text>
              <Text style={styles.copyText}>{copied ? 'Copié!' : 'Copier'}</Text>
            </TouchableOpacity>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionFr}>{network.instructions.fr}</Text>
              <Text style={styles.instructionLn}>{network.instructions.ln}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 100 },
  emptyPlansBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyPlansTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  emptyPlansText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  networkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  networkCardActive: {
    borderColor: colors.primary,
  },
  networkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  networkDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  networkLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  paymentInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  merchantLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  merchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  merchantNumber: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
  },
  copyText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  instructionFr: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  instructionLn: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default SubscriptionScreen;

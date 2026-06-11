import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

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
    merchantNumber: '+243 99 999 9999',
    instructions: {
      fr: 'Envoyez le montant de votre abonnement au numéro ci-dessus, puis revenez dans l\'application.',
      ln: 'Tinda mbongo ya abonnement na yo na nimero oyo, mpe zonga na application.',
    },
  },
  {
    key: 'orange',
    label: 'Orange Money',
    merchantNumber: '+243 89 888 8888',
    instructions: {
      fr: 'Effectuez un transfert Orange Money vers ce numéro marchand.',
      ln: 'Sala transfert ya Orange Money na nimero ya marchand oyo.',
    },
  },
  {
    key: 'airtel',
    label: 'Airtel Money',
    merchantNumber: '+243 97 777 7777',
    instructions: {
      fr: 'Utilisez Airtel Money pour envoyer le paiement à ce numéro.',
      ln: 'Salela Airtel Money mpo na kotinda lifuti na nimero oyo.',
    },
  },
];

const PLANS = [
  { name: 'Free', price: '0 USD', desc: 'Saisie manuelle, 50 tx/mois' },
  { name: 'Basic', price: '5 USD/mois', desc: 'Automatisation SMS, multi-SIM' },
  { name: 'Pro', price: '10 USD/mois', desc: 'Graphiques, export Excel, alertes stock' },
  { name: 'Business', price: '15 USD/mois', desc: 'Suivi multi-terminaux, dashboard Admin' },
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Abonnement</Text>
        <Text style={styles.headerSubtitle}>Choisissez votre formule</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {PLANS.map((plan) => (
          <TouchableOpacity key={plan.name} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
            <Text style={styles.planDesc}>{plan.desc}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Paiement par Mobile Money</Text>
        <Text style={styles.sectionSubtitle}>
          Choisissez votre réseau de paiement
        </Text>

        {NETWORKS.map((net) => (
          <TouchableOpacity
            key={net.key}
            style={[
              styles.networkCard,
              selectedNetwork === net.key && styles.networkCardActive,
            ]}
            onPress={() => setSelectedNetwork(net.key)}
          >
            <View style={styles.networkDot} />
            <Text style={styles.networkLabel}>{net.label}</Text>
          </TouchableOpacity>
        ))}

        {network && (
          <View style={styles.paymentInfo}>
            <Text style={styles.merchantLabel}>Numéro marchand</Text>
            <TouchableOpacity
              style={styles.merchantRow}
              onPress={() => handleCopy(network.merchantNumber)}
            >
              <Text style={styles.merchantNumber}>{network.merchantNumber}</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  planCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  planPrice: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
  },
  planDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textLight,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    opacity: 0.7,
    marginBottom: spacing.md,
  },
  networkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  networkCardActive: {
    borderColor: colors.accent,
  },
  networkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
  },
  networkLabel: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: '500',
  },
  paymentInfo: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
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
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  merchantNumber: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  copyText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.sm,
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

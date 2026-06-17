import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { SimCard, SimService, SimTransaction } from '../types';
import SIMActionButtons from './SIMActionButtons';
import SIMTransactionHistory from './SIMTransactionHistory';

const SERVICE_META: Record<SimService, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  [SimService.MOBILE_MONEY]: { label: 'Mobile Money', icon: 'swap-horizontal', color: '#22c55e' },
  [SimService.DATA_BUNDLES]: { label: 'Data Bundles', icon: 'globe', color: '#3b82f6' },
  [SimService.AIRTIME]: { label: 'Airtime', icon: 'call', color: '#f59e0b' },
  [SimService.BILL_PAYMENT]: { label: 'Factures', icon: 'receipt', color: '#a78bfa' },
  [SimService.TV]: { label: 'TV', icon: 'tv', color: '#06b6d4' },
  [SimService.GENERAL_MESSAGES]: { label: 'Messages généraux', icon: 'chatbox-ellipses', color: '#64748b' },
};

interface SIMDetailPanelProps {
  sim: SimCard;
  transactions: SimTransaction[];
  onToggleService: (service: SimService) => void;
}

function getOperatorColor(operator: string): string {
  switch (operator) {
    case 'AIRTEL': return '#E11B22';
    case 'ORANGE': return '#FF7900';
    case 'VODACOM': return '#00A94F';
    case 'AFRICELL': return '#ED1C24';
    default: return colors.textSecondary;
  }
}

const SIMDetailPanel: React.FC<SIMDetailPanelProps> = ({ sim, transactions, onToggleService }) => {
  const opColor = getOperatorColor(sim.operator);
  const opLabel = `${sim.operator.charAt(0)}${sim.operator.slice(1).toLowerCase()}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.operatorBadge, { backgroundColor: opColor + '20', borderColor: opColor }]}>
          <Ionicons name="phone-portrait" size={24} color={opColor} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.operatorName, { color: opColor }]}>{opLabel}</Text>
          <Text style={styles.phoneNumber}>{sim.phoneNumber}</Text>
        </View>
      </View>

      <View style={styles.balancesCard}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Solde cash</Text>
          <Text style={styles.balanceValue}>{sim.cashBalance.toLocaleString()} CDF</Text>
        </View>
        {sim.airtimeBalance != null && (
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Crédit unités</Text>
            <Text style={styles.balanceValue}>{sim.airtimeBalance} USD</Text>
          </View>
        )}
        {sim.dataBalance != null && (
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Forfait data</Text>
            <Text style={styles.balanceValue}>{sim.dataBalance} {sim.dataUnit || 'GB'}</Text>
          </View>
        )}
      </View>

      {sim.enabledServices.length > 0 && (
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services souscrits</Text>
          <View style={styles.servicesGrid}>
            {sim.enabledServices.map((svc) => {
              const meta = SERVICE_META[svc];
              return (
                <View key={svc} style={[styles.serviceCard, { borderColor: meta.color }]}>
                  <View style={[styles.serviceIconWrap, { backgroundColor: meta.color + '20' }]}>
                    <Ionicons name={meta.icon} size={20} color={meta.color} />
                  </View>
                  <Text style={styles.serviceLabel}>{meta.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <SIMActionButtons enabledServices={sim.enabledServices} />

      <SIMTransactionHistory transactions={transactions} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  operatorBadge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneNumber: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  balancesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
  },
  servicesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  serviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
});

export default SIMDetailPanel;

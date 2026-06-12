import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { SimCard } from '../types';

interface SIMCardItemProps {
  sim: SimCard;
  selected: boolean;
  onPress: () => void;
}

function getBalanceStatus(balance: number): { color: string; label: string } {
  if (balance > 200000) return { color: colors.success, label: 'Bon' };
  if (balance > 50000) return { color: colors.warning, label: 'Moyen' };
  return { color: colors.danger, label: 'Faible' };
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

function getOperatorIcon(operator: string): keyof typeof Ionicons.glyphMap {
  switch (operator) {
    case 'ORANGE': return 'phone-portrait';
    default: return 'phone-portrait';
  }
}

const SIMCardItem: React.FC<SIMCardItemProps> = ({ sim, selected, onPress }) => {
  const status = getBalanceStatus(sim.cashBalance);
  const opColor = getOperatorColor(sim.operator);
  const opLabel = `${sim.operator.charAt(0)}${sim.operator.slice(1).toLowerCase()}`;

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.operatorBar, { backgroundColor: opColor }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.operatorRow}>
            <Ionicons name={getOperatorIcon(sim.operator)} size={14} color={opColor} />
            <Text style={[styles.operatorName, { color: opColor }]}>{opLabel}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
        </View>

        <Text style={styles.phoneNumber}>{sim.phoneNumber}</Text>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceValue}>
            {sim.cashBalance.toLocaleString()} <Text style={styles.balanceUnit}>CDF</Text>
          </Text>
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>

        <View style={styles.servicesRow}>
          {sim.enabledServices.map((svc) => (
            <View key={svc} style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>{serviceLabel(svc)}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

function serviceLabel(svc: string): string {
  switch (svc) {
    case 'MOBILE_MONEY': return 'M.Money';
    case 'DATA_BUNDLES': return 'Data';
    case 'AIRTIME': return 'Airtime';
    case 'BILL_PAYMENT': return 'Factures';
    case 'TV': return 'TV';
    default: return svc;
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    minHeight: 100,
  },
  containerSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  operatorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  operatorName: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phoneNumber: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  balanceValue: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
  },
  balanceUnit: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  serviceChip: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceChipText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default SIMCardItem;

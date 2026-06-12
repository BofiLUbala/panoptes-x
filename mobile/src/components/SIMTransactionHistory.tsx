import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { SimTransaction, SimService } from '../types';

interface SIMTransactionHistoryProps {
  transactions: SimTransaction[];
}

function getServiceIcon(service: SimService): keyof typeof Ionicons.glyphMap {
  switch (service) {
    case SimService.MOBILE_MONEY: return 'swap-horizontal';
    case SimService.DATA_BUNDLES: return 'globe';
    case SimService.AIRTIME: return 'call';
    case SimService.BILL_PAYMENT: return 'receipt';
    case SimService.TV: return 'tv';
    default: return 'ellipse';
  }
}

function getServiceColor(service: SimService): string {
  switch (service) {
    case SimService.MOBILE_MONEY: return colors.primary;
    case SimService.DATA_BUNDLES: return colors.success;
    case SimService.AIRTIME: return colors.warning;
    case SimService.BILL_PAYMENT: return '#a78bfa';
    case SimService.TV: return '#f472b6';
    default: return colors.textSecondary;
  }
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const mon = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${dd}/${mon} ${hh}:${mm}`;
  } catch {
    return ts;
  }
}

const SIMTransactionHistory: React.FC<SIMTransactionHistoryProps> = ({ transactions }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historique des transactions</Text>
      {transactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="time-outline" size={20} color={colors.textLight} />
          <Text style={styles.emptyText}>Aucune transaction récente pour cette SIM.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {transactions.map((tx) => {
            const svcColor = getServiceColor(tx.service);
            return (
              <View key={tx.id} style={styles.txItem}>
                <View style={[styles.txIconBox, { backgroundColor: svcColor + '20', borderColor: svcColor }]}>
                  <Ionicons name={getServiceIcon(tx.service)} size={16} color={svcColor} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txLabel}>{tx.label}</Text>
                  <Text style={styles.txTime}>{formatTime(tx.timestamp)}</Text>
                </View>
                <View style={styles.txAmountBox}>
                  <Text style={styles.txAmount}>
                    {tx.amount.toLocaleString()} CDF
                  </Text>
                  {tx.commission != null && tx.commission > 0 && (
                    <Text style={styles.txCommission}>+{tx.commission} CDF</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  txTime: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 1,
  },
  txAmountBox: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  txCommission: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: '600',
    marginTop: 1,
  },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    flex: 1,
  },
});

export default SIMTransactionHistory;

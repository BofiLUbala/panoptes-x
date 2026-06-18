import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { getTransactions } from '../services/storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import { TransactionType, Operator } from '../types';

type Filter = 'ALL' | TransactionType | Operator;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: TransactionType.MOBILE_MONEY, label: 'Mobile Money' },
  { key: TransactionType.AIRTIME, label: 'Unités' },
  { key: TransactionType.BUNDLE, label: 'Mégas' },
  { key: Operator.ORANGE, label: 'Orange' },
  { key: Operator.AIRTEL, label: 'Airtel' },
  { key: Operator.VODACOM, label: 'Vodacom' },
  { key: Operator.AFRICELL, label: 'Africell' },
];

function getTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.MOBILE_MONEY: return 'Mobile Money';
    case TransactionType.AIRTIME: return 'Unités';
    case TransactionType.BUNDLE: return 'Mégas/Internet';
    case TransactionType.BILL_PAYMENT: return 'Facture';
  }
}

function getTypeColor(type: TransactionType): string {
  switch (type) {
    case TransactionType.MOBILE_MONEY: return colors.primary;
    case TransactionType.AIRTIME: return colors.warning;
    case TransactionType.BUNDLE: return colors.success;
    case TransactionType.BILL_PAYMENT: return colors.danger;
  }
}

function getOperatorColor(operator: Operator): string {
  switch (operator) {
    case Operator.ORANGE: return '#FF7900';
    case Operator.AIRTEL: return '#E11B22';
    case Operator.VODACOM: return '#00A94F';
    case Operator.AFRICELL: return '#ED1C24';
  }
}

interface HistoryTransaction {
  id: string;
  type: TransactionType;
  operator: Operator;
  amount?: number;
  commission?: number;
  volume?: number;
  volumeUnit?: string;
  timestamp: string;
  rawSms: string;
}

const TransactionItem: React.FC<{
  tx: HistoryTransaction;
  onPress: () => void;
}> = ({ tx, onPress }) => (
  <TouchableOpacity style={styles.txItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.txLeft}>
      <View style={[styles.txDot, { backgroundColor: getTypeColor(tx.type) }]} />
      <View>
        <Text style={styles.txType}>{getTypeLabel(tx.type)}</Text>
        <Text style={styles.txOperator}>{tx.operator}</Text>
      </View>
    </View>
    <View style={styles.txRight}>
      <Text style={[styles.txAmount, { color: getOperatorColor(tx.operator as Operator) }]}>
        {tx.amount?.toLocaleString()} CDF
      </Text>
      {tx.commission ? (
        <Text style={styles.txCommission}>+{tx.commission} CDF</Text>
      ) : null}
    </View>
  </TouchableOpacity>
);

const HistoryScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<Filter>('ALL');
  const [transactions, setTransactions] = useState<HistoryTransaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<HistoryTransaction | null>(null);

  useEffect(() => {
    loadTx();
    const interval = setInterval(loadTx, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadTx() {
    try {
      const stored = await getTransactions();
      setTransactions(stored.map((t) => ({
        id: t.id,
        type: t.type,
        operator: t.operator,
        amount: t.amount,
        commission: t.commission,
        volume: t.volume,
        volumeUnit: t.volumeUnit,
        timestamp: t.timestamp,
        rawSms: t.rawSms,
      })));
    } catch {}
  }

  const filteredTransactions =
    activeFilter === 'ALL'
      ? transactions
      : transactions.filter((tx) => tx.type === activeFilter || tx.operator === activeFilter);

  return (
    <View style={styles.container}>
      <AppHeader title="Historique" subtitle={`${filteredTransactions.length} transactions`} />

      <ScrollView horizontal style={styles.filterRow} showsHorizontalScrollIndicator={false}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, activeFilter === f.key && styles.chipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.chipText, activeFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune transaction</Text>
            <Text style={styles.emptySubtitle}>
              Les transactions apparaîtront ici automatiquement après réception des SMS.
            </Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => (
            <TransactionItem key={tx.id} tx={tx} onPress={() => setSelectedTx(tx)} />
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!selectedTx}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Détail de la transaction</Text>
            {selectedTx && (
              <>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Type</Text>
                  <View style={[styles.sheetBadge, { backgroundColor: getTypeColor(selectedTx.type) }]}>
                    <Text style={styles.sheetBadgeText}>{getTypeLabel(selectedTx.type)}</Text>
                  </View>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Opérateur</Text>
                  <Text style={styles.sheetValue}>{selectedTx.operator}</Text>
                </View>
                {selectedTx.amount && (
                  <View style={styles.sheetRow}>
                    <Text style={styles.sheetLabel}>Montant</Text>
                    <Text style={styles.sheetValue}>{selectedTx.amount.toLocaleString()} CDF</Text>
                  </View>
                )}
                {selectedTx.commission && (
                  <View style={styles.sheetRow}>
                    <Text style={styles.sheetLabel}>Commission</Text>
                    <Text style={[styles.sheetValue, { color: colors.success }]}>
                      +{selectedTx.commission} CDF
                    </Text>
                  </View>
                )}
                <View style={styles.sheetDivider} />
                <Text style={styles.sheetSmsLabel}>SMS brut</Text>
                <View style={styles.sheetSmsBox}>
                  <Text style={styles.sheetSmsText}>{selectedTx.rawSms}</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedTx(null)}>
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.background,
    fontWeight: '700',
  },
  list: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.md,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  txDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  txType: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  txOperator: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
  },
  txCommission: {
    fontSize: fontSize.xs,
    color: colors.success,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sheetLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sheetValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  sheetBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  sheetBadgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  sheetSmsLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sheetSmsBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sheetSmsText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});

export default HistoryScreen;

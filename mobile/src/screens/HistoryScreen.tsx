import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
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

const mockTransactions = [
  {
    id: '1',
    type: TransactionType.MOBILE_MONEY,
    operator: Operator.ORANGE,
    amount: 5000,
    commission: 50,
    timestamp: '2026-06-11T10:30:00',
    rawSms:
      'Depot de 5000 CDF sur votre compte Orange Money. Nouveau solde: 45000 CDF. Merci.',
  },
  {
    id: '2',
    type: TransactionType.BUNDLE,
    operator: Operator.AIRTEL,
    volume: 2,
    volumeUnit: 'GB',
    amount: 3000,
    commission: 150,
    timestamp: '2026-06-11T09:15:00',
    rawSms:
      'Vous avez active le forfait Maxi 2 GB. Valable 30 jours. Montant: 3000 CDF.',
  },
  {
    id: '3',
    type: TransactionType.AIRTIME,
    operator: Operator.VODACOM,
    amount: 1000,
    commission: 30,
    timestamp: '2026-06-10T18:45:00',
    rawSms:
      'Recharge effectuee de 1000 CDF sur le numero +243812345678. Nouveau solde: 50 USD.',
  },
  {
    id: '4',
    type: TransactionType.MOBILE_MONEY,
    operator: Operator.AIRTEL,
    amount: 25000,
    commission: 250,
    timestamp: '2026-06-10T14:20:00',
    rawSms:
      'Retrait de 25000 CDF. Frais: 250 CDF. Solde: 12500 CDF. Airtel Money.',
  },
  {
    id: '5',
    type: TransactionType.BUNDLE,
    operator: Operator.ORANGE,
    volume: 500,
    volumeUnit: 'MB',
    amount: 1500,
    commission: 75,
    timestamp: '2026-06-09T08:00:00',
    rawSms:
      'Vous avez recu 500 MB. Forfait Internet Orange. Valable 7 jours.',
  },
];

function getTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.MOBILE_MONEY:
      return 'Mobile Money';
    case TransactionType.AIRTIME:
      return 'Unités';
    case TransactionType.BUNDLE:
      return 'Mégas/Internet';
    case TransactionType.BILL_PAYMENT:
      return 'Facture';
  }
}

function getTypeColor(type: TransactionType): string {
  switch (type) {
    case TransactionType.MOBILE_MONEY:
      return colors.accent;
    case TransactionType.AIRTIME:
      return colors.warning;
    case TransactionType.BUNDLE:
      return colors.success;
    case TransactionType.BILL_PAYMENT:
      return colors.danger;
  }
}

function getOperatorColor(operator: Operator): string {
  switch (operator) {
    case Operator.ORANGE:
      return '#FF7900';
    case Operator.AIRTEL:
      return '#E11B22';
    case Operator.VODACOM:
      return '#00A94F';
    case Operator.AFRICELL:
      return '#ED1C24';
  }
}

const TransactionItem: React.FC<{
  tx: (typeof mockTransactions)[0];
  onPress: () => void;
}> = ({ tx, onPress }) => (
  <TouchableOpacity style={styles.txItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.txLeft}>
      <View
        style={[
          styles.txDot,
          { backgroundColor: getTypeColor(tx.type) },
        ]}
      />
      <View>
        <Text style={styles.txType}>{getTypeLabel(tx.type)}</Text>
        <Text style={styles.txOperator}>
          {tx.operator}
        </Text>
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
  const [selectedTx, setSelectedTx] = useState<(typeof mockTransactions)[0] | null>(null);

  const filteredTransactions =
    activeFilter === 'ALL'
      ? mockTransactions
      : mockTransactions.filter(
          (tx) =>
            tx.type === activeFilter || tx.operator === activeFilter
        );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTransactions.length} transactions
        </Text>
      </View>

      <ScrollView horizontal style={styles.filterRow} showsHorizontalScrollIndicator={false}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.chip,
              activeFilter === f.key && styles.chipActive,
            ]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text
              style={[
                styles.chipText,
                activeFilter === f.key && styles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list}>
        {filteredTransactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            tx={tx}
            onPress={() => setSelectedTx(tx)}
          />
        ))}
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
                  <View
                    style={[
                      styles.sheetBadge,
                      { backgroundColor: getTypeColor(selectedTx.type) },
                    ]}
                  >
                    <Text style={styles.sheetBadgeText}>
                      {getTypeLabel(selectedTx.type)}
                    </Text>
                  </View>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Opérateur</Text>
                  <Text style={styles.sheetValue}>{selectedTx.operator}</Text>
                </View>
                {selectedTx.amount && (
                  <View style={styles.sheetRow}>
                    <Text style={styles.sheetLabel}>Montant</Text>
                    <Text style={styles.sheetValue}>
                      {selectedTx.amount.toLocaleString()} CDF
                    </Text>
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
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedTx(null)}
                >
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
  filterRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.white,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.primary,
  },
  list: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.md,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
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
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
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
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
});

export default HistoryScreen;

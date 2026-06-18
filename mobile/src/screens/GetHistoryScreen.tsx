import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { simStore } from '../services/simStore';
import { getTransactions } from '../services/storage';
import { SimCard, SimService, Transaction, Operator, TransactionType } from '../types';

type ViewMode = 'list' | 'detail';

const SERVICE_ICONS: Record<SimService, keyof typeof Ionicons.glyphMap> = {
  [SimService.MOBILE_MONEY]: 'swap-horizontal',
  [SimService.DATA_BUNDLES]: 'globe',
  [SimService.AIRTIME]: 'call',
  [SimService.BILL_PAYMENT]: 'receipt',
  [SimService.TV]: 'tv',
  [SimService.GENERAL_MESSAGES]: 'chatbox-ellipses',
};

const SERVICE_COLORS: Record<SimService, string> = {
  [SimService.MOBILE_MONEY]: '#22c55e',
  [SimService.DATA_BUNDLES]: '#3b82f6',
  [SimService.AIRTIME]: '#f59e0b',
  [SimService.BILL_PAYMENT]: '#a78bfa',
  [SimService.TV]: '#06b6d4',
  [SimService.GENERAL_MESSAGES]: '#64748b',
};

function getTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.MOBILE_MONEY: return 'Mobile Money';
    case TransactionType.AIRTIME: return 'Unités';
    case TransactionType.BUNDLE: return 'Mégas/Internet';
    case TransactionType.BILL_PAYMENT: return 'Facture';
  }
}

const GetHistoryScreen: React.FC = () => {
  const [sims, setSims] = useState<SimCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedSim, setSelectedSim] = useState<SimCard | null>(null);

  useEffect(() => {
    load();
    const unsub = simStore.subscribe(load);
    const interval = setInterval(load, 5000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  async function load() {
    setSims(simStore.getSims());
    try {
      setTransactions(await getTransactions());
    } catch {}
  }

  function getTxForSim(sim: SimCard): Transaction[] {
    return transactions.filter((tx) => tx.operator === sim.operator);
  }

  function getTxForService(sim: SimCard, service: SimService): Transaction[] {
    const simTxs = getTxForSim(sim);
    if (service === SimService.GENERAL_MESSAGES) {
      return simTxs.filter((tx) => {
        const txSvc = transactionToService(tx);
        return !sim.enabledServices.some(
          (s) => s !== SimService.GENERAL_MESSAGES && s === txSvc
        );
      });
    }
    return simTxs.filter((tx) => transactionToService(tx) === service);
  }

  function transactionToService(tx: Transaction): SimService {
    switch (tx.type) {
      case TransactionType.MOBILE_MONEY: return SimService.MOBILE_MONEY;
      case TransactionType.AIRTIME: return SimService.AIRTIME;
      case TransactionType.BUNDLE: return SimService.DATA_BUNDLES;
      case TransactionType.BILL_PAYMENT: return SimService.BILL_PAYMENT;
      default: return SimService.GENERAL_MESSAGES;
    }
  }

  if (!selectedSim) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historique par SIM</Text>
        </View>

        <ScrollView style={styles.list}>
          {sims.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="phone-portrait-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucune SIM</Text>
              <Text style={styles.emptySubtitle}>
                Ajoutez une SIM dans l'onglet "Mes SIM" depuis le menu Service.
              </Text>
            </View>
          ) : (
            sims.map((sim) => (
              <TouchableOpacity
                key={sim.id}
                style={styles.simCard}
                onPress={() => setSelectedSim(sim)}
                activeOpacity={0.7}
              >
                <View style={styles.simCardLeft}>
                  <View style={[styles.operatorDot, { backgroundColor: getOperatorColor(sim.operator) }]} />
                  <View>
                    <Text style={styles.simPhone}>{sim.phoneNumber}</Text>
                    <Text style={styles.simOperator}>{sim.operator}</Text>
                  </View>
                </View>
                <View style={styles.simCardRight}>
                  <Text style={styles.simServiceCount}>
                    {sim.enabledServices.length} service{sim.enabledServices.length > 1 ? 's' : ''}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  const sim = selectedSim;
  const services = sim.enabledServices;

  return (
    <View style={styles.container}>
      <View style={styles.detailHeaderBar} />
      <View style={styles.detailInfo}>
        <TouchableOpacity onPress={() => setSelectedSim(null)} style={styles.detailBackBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.detailPhone}>{sim.phoneNumber}</Text>
        <View style={[styles.operatorBadge, { backgroundColor: getOperatorColor(sim.operator) + '20' }]}>
          <Text style={[styles.operatorBadgeText, { color: getOperatorColor(sim.operator) }]}>{sim.operator}</Text>
        </View>
      </View>

      <ScrollView style={styles.list}>
        <View style={styles.servicesGrid}>
          {services.map((service) => {
            const txs = getTxForService(sim, service);
            const icon = SERVICE_ICONS[service];
            const color = SERVICE_COLORS[service];

            return (
              <View key={service} style={styles.gridCard}>
                <View style={[styles.gridIconBox, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon} size={24} color={color} />
                </View>
                <Text style={styles.gridServiceName} numberOfLines={1}>{serviceLabel(service)}</Text>
                <Text style={styles.gridTxCount}>
                  {txs.length} transaction{txs.length > 1 ? 's' : ''}
                </Text>
                {txs.length > 0 && (
                  <View style={[styles.gridBadge, { backgroundColor: color }]}>
                    <Text style={styles.gridBadgeText}>{txs.length}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

function getOperatorColor(op: Operator): string {
  switch (op) {
    case Operator.ORANGE: return '#FF7900';
    case Operator.AIRTEL: return '#E11B22';
    case Operator.VODACOM: return '#00A94F';
    case Operator.AFRICELL: return '#ED1C24';
  }
}

function serviceLabel(service: SimService): string {
  switch (service) {
    case SimService.MOBILE_MONEY: return 'Mobile Money';
    case SimService.DATA_BUNDLES: return 'Data Bundles';
    case SimService.AIRTIME: return 'Airtime (Crédit)';
    case SimService.BILL_PAYMENT: return 'Paiement Factures';
    case SimService.TV: return 'Abonnements TV';
    case SimService.GENERAL_MESSAGES: return 'Messages généraux';
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  list: {
    flex: 1,
    padding: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
  simCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  simCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  operatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  simPhone: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  simOperator: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  simCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  simServiceCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  detailHeaderBar: {
    height: 44,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailPhone: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  operatorBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  operatorBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  gridIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gridServiceName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  gridTxCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  gridBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  gridBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.background,
  },
});

export default GetHistoryScreen;

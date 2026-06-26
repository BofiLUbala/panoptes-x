import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import { api } from '../services/api';

interface Balance {
  phone_number: string;
  operator: string;
  balance: number;
  last_updated: string;
}

interface LedgerEntry {
  id: number;
  phone_number: string;
  entry_type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
}

const OPERATOR_COLORS: Record<string, string> = {
  AIRTEL: '#E11B22', ORANGE: '#FF7900', VODACOM: '#00A94F', AFRICELL: '#ED1C24',
};

const LedgerScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [bals, ents] = await Promise.all([
        api.getSimBalances().catch(() => []),
        api.getLedgerEntries().catch(() => []),
      ]);
      setBalances(bals);
      setEntries(ents);
    } catch { }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await loadAll();
    setLoading(false);
  }, [loadAll]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const totalBalance = balances.reduce((sum, b) => sum + Number(b.balance || 0), 0);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Grand Livre" subtitle={`${balances.length} SIM · ${totalBalance.toFixed(2)}$`} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Solde global */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Solde global</Text>
          <Text style={styles.totalValue}>{totalBalance.toFixed(2)} USD</Text>
        </View>

        {/* Soldes par SIM */}
        <Text style={styles.sectionTitle}>Soldes par appareil</Text>
        {balances.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="wallet-outline" size={36} color={colors.textLight} />
            <Text style={styles.emptyText}>Aucun solde disponible</Text>
          </View>
        ) : (
          balances.map((bal, i) => (
            <View key={i} style={styles.balanceCard}>
              <View style={[styles.operatorDot, { backgroundColor: OPERATOR_COLORS[bal.operator] || colors.textSecondary }]} />
              <View style={styles.balanceInfo}>
                <Text style={styles.balancePhone}>{bal.phone_number}</Text>
                <Text style={styles.balanceOperator}>{bal.operator}</Text>
              </View>
              <View style={styles.balanceRight}>
                <Text style={styles.balanceAmount}>{Number(bal.balance || 0).toFixed(2)}$</Text>
                <Text style={styles.balanceDate}>{bal.last_updated ? new Date(bal.last_updated).toLocaleDateString('fr-FR') : ''}</Text>
              </View>
            </View>
          ))
        )}

        {/* Entrées récentes */}
        <Text style={styles.sectionTitle}>Mouvements récents</Text>
        {entries.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="swap-vertical-outline" size={36} color={colors.textLight} />
            <Text style={styles.emptyText}>Aucun mouvement</Text>
          </View>
        ) : (
          entries.slice(0, 50).map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onPress={() => setSelectedEntry(entry)}
              activeOpacity={0.7}
            >
              <View style={[styles.entryIcon, { backgroundColor: entry.entry_type === 'credit' ? colors.success + '20' : colors.danger + '20' }]}>
                <Ionicons name={entry.entry_type === 'credit' ? 'arrow-up' : 'arrow-down'} size={16} color={entry.entry_type === 'credit' ? colors.success : colors.danger} />
              </View>
              <View style={styles.entryInfo}>
                <Text style={styles.entryPhone}>{entry.phone_number}</Text>
                <Text style={styles.entryDesc} numberOfLines={1}>{entry.description}</Text>
              </View>
              <Text style={[styles.entryAmount, { color: entry.entry_type === 'credit' ? colors.success : colors.danger }]}>
                {entry.entry_type === 'credit' ? '+' : '-'}{Number(entry.amount).toFixed(2)}$
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={!!selectedEntry} transparent animationType="slide" onRequestClose={() => setSelectedEntry(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            {selectedEntry && (
              <>
                <Text style={styles.sheetTitle}>Détail du mouvement</Text>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Appareil</Text>
                  <Text style={styles.sheetValue}>{selectedEntry.phone_number}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Type</Text>
                  <Text style={[styles.sheetValue, { color: selectedEntry.entry_type === 'credit' ? colors.success : colors.danger }]}>
                    {selectedEntry.entry_type === 'credit' ? 'Crédit' : 'Débit'}
                  </Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Montant</Text>
                  <Text style={[styles.sheetValue, { color: selectedEntry.entry_type === 'credit' ? colors.success : colors.danger }]}>
                    {Number(selectedEntry.amount).toFixed(2)} USD
                  </Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Description</Text>
                  <Text style={styles.sheetValue}>{selectedEntry.description}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Date</Text>
                  <Text style={styles.sheetValue}>{new Date(selectedEntry.created_at).toLocaleString('fr-FR')}</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedEntry(null)}>
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
  scroll: { padding: spacing.md, paddingBottom: 120 },
  totalCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.primary + '40',
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg,
  },
  totalLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  totalValue: { fontSize: 32, fontWeight: '800', color: colors.primary, marginTop: spacing.xs },

  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.xs,
  },
  emptyBox: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: fontSize.sm, color: colors.textSecondary },

  balanceCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  operatorDot: { width: 12, height: 12, borderRadius: 6 },
  balanceInfo: { flex: 1 },
  balancePhone: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  balanceOperator: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  balanceRight: { alignItems: 'flex-end' },
  balanceAmount: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  balanceDate: { fontSize: 10, color: colors.textLight, marginTop: 2 },

  entryCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  entryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  entryInfo: { flex: 1 },
  entryPhone: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  entryDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  entryAmount: { fontSize: fontSize.md, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.border, borderBottomWidth: 0, padding: spacing.lg, paddingBottom: 40,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  sheetLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  sheetValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right' },
  closeButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  closeButtonText: { color: colors.background, fontWeight: '700', fontSize: fontSize.md },
});

export default LedgerScreen;

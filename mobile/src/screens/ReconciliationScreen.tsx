import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import { api } from '../services/api';

interface ReconciliationRun {
  id: number;
  period_start: string;
  period_end: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_transactions: number;
  matched: number;
  unmatched: number;
  discrepancies: number;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: 'En attente', color: colors.textLight, icon: 'time' },
  running: { label: 'En cours', color: colors.warning, icon: 'sync' },
  completed: { label: 'Terminé', color: colors.success, icon: 'checkmark-circle' },
  failed: { label: 'Échoué', color: colors.danger, icon: 'close-circle' },
};

const ReconciliationScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<ReconciliationRun | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getReconciliations();
      setRuns(data);
    } catch { }
  }, []);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleStartReconciliation = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    const periodStart = start.toISOString().split('T')[0];
    const periodEnd = end.toISOString().split('T')[0];

    Alert.alert(
      'Nouvelle réconciliation',
      `Période: ${periodStart} → ${periodEnd}\n\nCela peut prendre quelques minutes.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer', onPress: async () => {
            setStarting(true);
            try {
              await api.startReconciliation(periodStart, periodEnd);
              Alert.alert('Succès', 'Réconciliation démarrée.');
              load();
            } catch (err: any) {
              Alert.alert('Erreur', err?.response?.data?.message || err?.message || 'Erreur');
            } finally { setStarting(false); }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Réconciliation" subtitle={`${runs.length} exécution(s)`} />

      <TouchableOpacity
        style={[styles.startBtn, starting && { opacity: 0.5 }]}
        onPress={handleStartReconciliation}
        disabled={starting}
        activeOpacity={0.8}
      >
        {starting ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <>
            <Ionicons name="sync" size={18} color={colors.background} />
            <Text style={styles.startBtnText}>Nouvelle réconciliation</Text>
          </>
        )}
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {runs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="git-compare-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune réconciliation</Text>
            <Text style={styles.emptySubtitle}>Lancez une réconciliation pour comparer vos transactions.</Text>
          </View>
        ) : (
          runs.map((run) => {
            const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.pending;
            return (
              <TouchableOpacity
                key={run.id}
                style={styles.runCard}
                onPress={() => setSelectedRun(run)}
                activeOpacity={0.7}
              >
                <View style={styles.runHeader}>
                  <View style={[styles.runIcon, { backgroundColor: cfg.color + '20' }]}>
                    <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                  </View>
                  <View style={styles.runInfo}>
                    <View style={[styles.runStatusBadge, { backgroundColor: cfg.color + '20' }]}>
                      <Text style={[styles.runStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.runPeriod}>
                      {new Date(run.period_start).toLocaleDateString('fr-FR')} → {new Date(run.period_end).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Text style={styles.runDate}>{new Date(run.created_at).toLocaleDateString('fr-FR')}</Text>
                </View>

                <View style={styles.runStats}>
                  <View style={styles.runStat}>
                    <Text style={styles.runStatValue}>{run.total_transactions}</Text>
                    <Text style={styles.runStatLabel}>Total</Text>
                  </View>
                  <View style={styles.runStat}>
                    <Text style={[styles.runStatValue, { color: colors.success }]}>{run.matched}</Text>
                    <Text style={styles.runStatLabel}>Correspondent</Text>
                  </View>
                  <View style={styles.runStat}>
                    <Text style={[styles.runStatValue, { color: colors.warning }]}>{run.unmatched}</Text>
                    <Text style={styles.runStatLabel}>Non trouvés</Text>
                  </View>
                  <View style={styles.runStat}>
                    <Text style={[styles.runStatValue, { color: colors.danger }]}>{run.discrepancies}</Text>
                    <Text style={styles.runStatLabel}>Écarts</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!selectedRun} transparent animationType="slide" onRequestClose={() => setSelectedRun(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            {selectedRun && (
              <>
                <Text style={styles.sheetTitle}>Détails de la réconciliation</Text>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Période</Text>
                  <Text style={styles.sheetValue}>
                    {new Date(selectedRun.period_start).toLocaleDateString('fr-FR')} → {new Date(selectedRun.period_end).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Statut</Text>
                  <Text style={styles.sheetValue}>{(STATUS_CONFIG[selectedRun.status] || STATUS_CONFIG.pending).label}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Transactions totales</Text>
                  <Text style={styles.sheetValue}>{selectedRun.total_transactions}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Correspondantes</Text>
                  <Text style={[styles.sheetValue, { color: colors.success }]}>{selectedRun.matched}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Non trouvées</Text>
                  <Text style={[styles.sheetValue, { color: colors.warning }]}>{selectedRun.unmatched}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Écarts</Text>
                  <Text style={[styles.sheetValue, { color: colors.danger }]}>{selectedRun.discrepancies}</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedRun(null)}>
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

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, marginHorizontal: spacing.md, paddingVertical: spacing.md,
    borderRadius: borderRadius.md, marginBottom: spacing.md,
  },
  startBtnText: { fontSize: fontSize.md, fontWeight: '700', color: colors.background },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: 40 },

  runCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  runHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  runIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  runInfo: { flex: 1 },
  runStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginBottom: 4 },
  runStatusText: { fontSize: fontSize.xs, fontWeight: '700' },
  runPeriod: { fontSize: fontSize.sm, color: colors.text },
  runDate: { fontSize: fontSize.xs, color: colors.textLight },

  runStats: { flexDirection: 'row', gap: spacing.sm },
  runStat: { flex: 1, alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.sm, padding: spacing.sm },
  runStatValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  runStatLabel: { fontSize: 9, color: colors.textLight, marginTop: 1 },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.border, borderBottomWidth: 0, padding: spacing.lg, paddingBottom: 40,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  sheetLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  sheetValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  closeButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  closeButtonText: { color: colors.background, fontWeight: '700', fontSize: fontSize.md },
});

export default ReconciliationScreen;

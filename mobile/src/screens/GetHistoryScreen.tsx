import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import { simStore } from '../services/simStore';
import { SimCard, SimService } from '../types';

const SERVICE_META: Record<SimService, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  [SimService.MOBILE_MONEY]: { label: 'Mobile Money', icon: 'swap-horizontal', color: '#22c55e' },
  [SimService.DATA_BUNDLES]: { label: 'Data Bundles', icon: 'globe', color: '#3b82f6' },
  [SimService.AIRTIME]: { label: 'Airtime', icon: 'call', color: '#f59e0b' },
  [SimService.BILL_PAYMENT]: { label: 'Factures', icon: 'receipt', color: '#a78bfa' },
  [SimService.TV]: { label: 'TV', icon: 'tv', color: '#06b6d4' },
};

const OPERATOR_COLORS: Record<string, string> = {
  ORANGE: '#FF7900',
  AIRTEL: '#E11B22',
  VODACOM: '#00A94F',
  AFRICELL: '#ED1C24',
};

const GetHistoryScreen: React.FC = () => {
  const [sims, setSims] = useState<SimCard[]>([]);
  const [selectedSim, setSelectedSim] = useState<SimCard | null>(null);

  useEffect(() => {
    setSims(simStore.getSims());
    const unsub = simStore.subscribe(() => setSims(simStore.getSims()));
    return unsub;
  }, []);

  useEffect(() => {
    if (selectedSim) {
      const updated = sims.find((s) => s.id === selectedSim.id);
      if (updated) setSelectedSim(updated);
      else setSelectedSim(null);
    }
  }, [sims]);

  if (selectedSim) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="get history"
          subtitle={selectedSim.phoneNumber}
        />
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedSim(null)}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backBtnText}>Retour aux numéros</Text>
        </TouchableOpacity>
        <View style={styles.grid}>
          {selectedSim.enabledServices.map((svc) => {
            const meta = SERVICE_META[svc];
            return (
              <TouchableOpacity key={svc} style={[styles.serviceCard, { borderColor: meta.color }]} activeOpacity={0.7}>
                <View style={[styles.serviceIconWrap, { backgroundColor: meta.color + '20' }]}>
                  <Ionicons name={meta.icon} size={24} color={meta.color} />
                </View>
                <Text style={styles.serviceLabel}>{meta.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="get history" />
      {sims.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="phone-portrait-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>Aucun numéro enregistré</Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {sims.map((sim) => (
            <TouchableOpacity
              key={sim.id}
              style={styles.simItem}
              onPress={() => setSelectedSim(sim)}
              activeOpacity={0.7}
            >
              <View style={[styles.simDot, { backgroundColor: OPERATOR_COLORS[sim.operator] || colors.primary }]} />
              <View style={styles.simInfo}>
                <Text style={styles.simNumber}>{sim.phoneNumber}</Text>
                <Text style={styles.simOperator}>{sim.operator}</Text>
              </View>
              <View style={styles.simBadge}>
                <Text style={styles.simBadgeText}>{sim.enabledServices.length}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1, paddingHorizontal: spacing.md },
  simItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  simDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  simInfo: { flex: 1 },
  simNumber: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  simOperator: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  simBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: spacing.sm,
  },
  simBadgeText: { fontSize: fontSize.sm, fontWeight: 'bold', color: colors.background },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textLight },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  backBtnText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
});

export default GetHistoryScreen;

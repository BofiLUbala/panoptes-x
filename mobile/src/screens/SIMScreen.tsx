import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { SimCard, SimService, SimTransaction } from '../types';
import AppHeader from '../components/AppHeader';
import SIMCardItem from '../components/SIMCardItem';
import SIMDetailPanel from '../components/SIMDetailPanel';
import { simStore } from '../services/simStore';

const SIMScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [sims, setSims] = useState<SimCard[]>(simStore.getSims());
  const [selectedSimId, setSelectedSimId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const unsubscribe = simStore.subscribe(() => {
      const updated = simStore.getSims();
      setSims(updated);
      // Auto-select first if nothing selected
      setSelectedSimId((prev) => {
        if (prev && updated.find((s) => s.id === prev)) return prev;
        return updated.length > 0 ? updated[0].id : null;
      });
    });
    // Sync initial state
    const initial = simStore.getSims();
    setSims(initial);
    if (initial.length > 0 && !selectedSimId) {
      setSelectedSimId(initial[0].id);
    }
    return unsubscribe;
  }, []);

  const selectedSim = sims.find((s) => s.id === selectedSimId) || null;
  const transactions: SimTransaction[] = [];

  const handleSelectSim = useCallback((simId: string) => {
    setSelectedSimId(simId);
    if (!isTablet) {
      setShowDetail(true);
    }
  }, [isTablet]);

  const handleBack = useCallback(() => {
    setShowDetail(false);
  }, []);

  const handleToggleService = useCallback((service: SimService) => {
    if (!selectedSimId) return;
    simStore.toggleService(selectedSimId, service);
  }, [selectedSimId]);

  // Mobile: show detail fullscreen
  if (!isTablet && showDetail && selectedSim) {
    return (
      <View style={styles.container}>
        <View style={styles.mobileDetailHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.mobileDetailTitle}>
            {selectedSim.operator} — {selectedSim.phoneNumber}
          </Text>
        </View>
        <SIMDetailPanel
          sim={selectedSim}
          transactions={transactions}
          onToggleService={handleToggleService}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Mes cartes SIM" subtitle={`${sims.length} SIM`} />

      <View style={[styles.main, isTablet && styles.mainTablet]}>
        {/* SIM List */}
        <View style={[styles.listPanel, isTablet && styles.listPanelTablet]}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Cartes SIM</Text>
            <Text style={styles.listCount}>{sims.length} enregistrée(s)</Text>
          </View>

          {sims.length === 0 ? (
            <View style={styles.emptyListBox}>
              <Ionicons name="phone-portrait-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyListTitle}>Aucune SIM</Text>
              <Text style={styles.emptyListText}>
                Allez dans le menu → Service → Ajouter opérateur pour ajouter vos premières cartes SIM.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listScroll}>
              {sims.map((sim) => (
                <SIMCardItem
                  key={sim.id}
                  sim={sim}
                  selected={selectedSimId === sim.id}
                  onPress={() => handleSelectSim(sim.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Detail Panel (tablet only) */}
        {isTablet && (
          <View style={styles.detailPanel}>
            {selectedSim ? (
              <SIMDetailPanel
                sim={selectedSim}
                transactions={transactions}
                onToggleService={handleToggleService}
              />
            ) : (
              <View style={styles.emptyDetail}>
                <Ionicons name="phone-portrait-outline" size={48} color={colors.border} />
                <Text style={styles.emptyDetailText}>
                  Sélectionnez une carte SIM pour voir ses détails
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
  },
  mainTablet: {
    flexDirection: 'row',
  },
  listPanel: {
    flex: 1,
  },
  listPanelTablet: {
    flex: 0.4,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  listCount: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  listScroll: {
    padding: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 40,
  },
  emptyListBox: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  emptyListTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  emptyListText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  detailPanel: {
    flex: 0.6,
    backgroundColor: colors.background,
  },
  emptyDetail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyDetailText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  mobileDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: 54,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileDetailTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
});

export default SIMScreen;

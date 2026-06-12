import React, { useState, useEffect } from 'react';
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
import AppHeader from '../components/AppHeader';
import AppLogo from '../components/AppLogo';
import { simStore } from '../services/simStore';
import { SimCard, SimService, Operator } from '../types';
import { api } from '../services/api';

function getOperatorColor(op: string): string {
  switch (op) {
    case Operator.AIRTEL: return '#ff4d4d';
    case Operator.ORANGE: return '#ff9f1c';
    case Operator.VODACOM: return '#e63946';
    case Operator.AFRICELL: return '#9b5de5';
    default: return colors.textSecondary;
  }
}

function getOperatorLabel(op: string): string {
  switch (op) {
    case Operator.AIRTEL: return 'Airtel';
    case Operator.ORANGE: return 'Orange';
    case Operator.VODACOM: return 'Vodacom';
    case Operator.AFRICELL: return 'Africell';
    default: return op;
  }
}

function getServiceLabel(svc: SimService): string {
  switch (svc) {
    case SimService.MOBILE_MONEY: return 'M.Money';
    case SimService.DATA_BUNDLES: return 'Data';
    case SimService.AIRTIME: return 'Airtime';
    case SimService.BILL_PAYMENT: return 'Factures';
    case SimService.TV: return 'TV';
    default: return svc;
  }
}

function getServiceIcon(svc: SimService): keyof typeof Ionicons.glyphMap {
  switch (svc) {
    case SimService.MOBILE_MONEY: return 'swap-horizontal';
    case SimService.DATA_BUNDLES: return 'globe';
    case SimService.AIRTIME: return 'call';
    case SimService.BILL_PAYMENT: return 'receipt';
    case SimService.TV: return 'tv';
    default: return 'ellipse';
  }
}

function getServiceColor(svc: SimService): string {
  switch (svc) {
    case SimService.MOBILE_MONEY: return '#22c55e';
    case SimService.DATA_BUNDLES: return '#3b82f6';
    case SimService.AIRTIME: return '#f59e0b';
    case SimService.BILL_PAYMENT: return '#a78bfa';
    case SimService.TV: return '#06b6d4';
    default: return colors.textSecondary;
  }
}

function getProfileLabel(profileType?: string): string {
  switch (profileType) {
    case 'business': return 'busneeess';
    case 'family': return 'famille';
    case 'partner': return 'partener';
    default: return 'busneeess';
  }
}

const DashboardScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [sims, setSims] = useState<SimCard[]>(simStore.getSims());
  const [selectedSimId, setSelectedSimId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    api.getProfile()
      .then((res) => setProfile(res))
      .catch((err) => console.log('Error getting profile in Dashboard:', err));
  }, []);

  useEffect(() => {
    const unsubscribe = simStore.subscribe(() => {
      const updated = simStore.getSims();
      setSims(updated);
      setSelectedSimId((prev) => {
        if (prev && updated.find((s) => s.id === prev)) return prev;
        return updated.length > 0 ? updated[0].id : null;
      });
    });
    // Initial sync
    const initial = simStore.getSims();
    setSims(initial);
    if (initial.length > 0) setSelectedSimId(initial[0].id);
    return unsubscribe;
  }, []);

  const currentSim = sims.find((s) => s.id === selectedSimId) || null;

  function groupSimsByOperator(): Record<string, SimCard[]> {
    const groups: Record<string, SimCard[]> = {};
    for (const sim of sims) {
      if (!groups[sim.operator]) groups[sim.operator] = [];
      groups[sim.operator].push(sim);
    }
    return groups;
  }

  // ===== LEFT PANEL =====
  const renderLeftPanel = () => {
    const grouped = groupSimsByOperator();
    const totalSims = sims.length;
    const operators = Object.keys(grouped);

    return (
      <View style={styles.leftPanel}>
        <View style={styles.serviceHeader}>
          <AppLogo size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceTitle}>SERVICE</Text>
            <Text style={styles.serviceSub}>
              {totalSims > 0 ? `${totalSims} SIM(s) · ${operators.length} opérateur(s)` : 'Aucune SIM configurée'}
            </Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
          {totalSims === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="phone-portrait-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>
                Aucune carte SIM.{'\n'}Ouvrez le menu → Service → Ajouter opérateur pour commencer.
              </Text>
            </View>
          ) : (
            operators.map((op) => {
              const opSims = grouped[op];
              const opColor = getOperatorColor(op);

              return (
                <View key={op} style={{ marginBottom: spacing.xs }}>
                  <View style={styles.opGroupHeader}>
                    <View style={[styles.opGroupDot, { backgroundColor: opColor }]} />
                    <Text style={[styles.opGroupName, { color: opColor }]}>{getOperatorLabel(op)}</Text>
                    <Text style={styles.opGroupTotal}>{opSims.length} SIM(s)</Text>
                  </View>
                  {opSims.map((sim) => {
                    const isSelected = sim.id === selectedSimId;
                    return (
                      <TouchableOpacity
                        key={sim.id}
                        style={[styles.simItem, isSelected && styles.simItemSelected]}
                        onPress={() => setSelectedSimId(sim.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.simStatusBar, { backgroundColor: opColor }]} />
                        <View style={styles.simItemContent}>
                          <Text style={styles.simNumber}>{sim.phoneNumber}</Text>
                          <View style={styles.simServices}>
                            {sim.enabledServices.map((svc) => (
                              <Text key={svc} style={styles.simSvcTag}>{getServiceLabel(svc)}</Text>
                            ))}
                            {sim.enabledServices.length === 0 && (
                              <Text style={[styles.simSvcTag, { color: colors.textLight }]}>Aucun service</Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.leftPanelFooter}>
          <View style={styles.profileBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={styles.profileBadgeText}>
              Profil: {getProfileLabel(profile?.service_profile)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={() => api.logout()}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.warning} />
            <Text style={styles.disconnectText}>Déconnecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ===== RIGHT PANEL (SIM Detail) =====
  const renderRightPanel = () => {
    if (!currentSim) {
      return (
        <View style={styles.rightPanelEmpty}>
          <AppLogo size={80} />
          <Text style={styles.emptyDetailText}>Sélectionnez une carte SIM pour voir ses détails</Text>
        </View>
      );
    }

    const opColor = getOperatorColor(currentSim.operator);

    return (
      <ScrollView style={styles.rightPanel} contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}>
        {/* Back button for mobile */}
        {!isTablet && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedSimId(null)} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        )}

        {/* SIM header */}
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.detailOpIcon, { backgroundColor: opColor }]}>
              <Ionicons name="phone-portrait" size={24} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailOpName, { color: opColor }]}>{getOperatorLabel(currentSim.operator)}</Text>
              <Text style={styles.detailPhone}>{currentSim.phoneNumber}</Text>
            </View>
          </View>

          <View style={styles.balancesRow}>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Solde cash</Text>
              <Text style={styles.balanceValue}>{currentSim.cashBalance.toLocaleString()} CDF</Text>
            </View>
          </View>
        </View>

        {/* Active services */}
        <View style={styles.detailCard}>
          <Text style={styles.configTitle}>Services activés</Text>
          {currentSim.enabledServices.length === 0 ? (
            <View style={styles.noServicesBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textLight} />
              <Text style={styles.noServicesText}>
                Aucun service activé sur cette SIM.
              </Text>
            </View>
          ) : (
            currentSim.enabledServices.map((svc) => (
              <View key={svc} style={styles.activeServiceRow}>
                <Ionicons name={getServiceIcon(svc)} size={18} color={getServiceColor(svc)} />
                <Text style={styles.activeServiceLabel}>{getServiceLabel(svc)}</Text>
                <View style={[styles.activeServiceDot, { backgroundColor: getServiceColor(svc) }]} />
              </View>
            ))
          )}
        </View>

        {/* Quick actions based on enabled services */}
        {currentSim.enabledServices.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.actionsGrid}>
              {currentSim.enabledServices.includes(SimService.MOBILE_MONEY) && (
                <>
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-down-circle" size={22} color="#22c55e" />
                    <Text style={styles.actionBtnText}>Cash-In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-up-circle" size={22} color="#ff4d4d" />
                    <Text style={styles.actionBtnText}>Cash-Out</Text>
                  </TouchableOpacity>
                </>
              )}
              {currentSim.enabledServices.includes(SimService.AIRTIME) && (
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="call" size={22} color="#f59e0b" />
                  <Text style={styles.actionBtnText}>Vendre crédit</Text>
                </TouchableOpacity>
              )}
              {currentSim.enabledServices.includes(SimService.DATA_BUNDLES) && (
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="globe" size={22} color="#3b82f6" />
                  <Text style={styles.actionBtnText}>Vendre Data</Text>
                </TouchableOpacity>
              )}
              {currentSim.enabledServices.includes(SimService.BILL_PAYMENT) && (
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="receipt" size={22} color="#a78bfa" />
                  <Text style={styles.actionBtnText}>Facture</Text>
                </TouchableOpacity>
              )}
              {currentSim.enabledServices.includes(SimService.TV) && (
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="tv" size={22} color="#06b6d4" />
                  <Text style={styles.actionBtnText}>TV</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Transaction history placeholder */}
        <Text style={styles.sectionTitle}>Historique ({getOperatorLabel(currentSim.operator)})</Text>
        <View style={styles.emptyTxBox}>
          <Ionicons name="time-outline" size={28} color={colors.textLight} />
          <Text style={styles.emptyTxText}>Aucune transaction pour cette SIM.</Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="PANOPTES-X" />

      <View style={styles.splitScreen}>
        {isTablet ? (
          <>
            <View style={{ flex: 1.2, borderRightWidth: 1, borderRightColor: colors.border }}>{renderLeftPanel()}</View>
            <View style={{ flex: 2 }}>{renderRightPanel()}</View>
          </>
        ) : (
          selectedSimId ? renderRightPanel() : renderLeftPanel()
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  splitScreen: { flex: 1, flexDirection: 'row' },

  // Left panel
  leftPanel: {
    flex: 1.2,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.md,
  },
  serviceTitle: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  serviceSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  opGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  opGroupDot: { width: 10, height: 10, borderRadius: 5 },
  opGroupName: { fontSize: fontSize.sm, fontWeight: '800', flex: 1 },
  opGroupTotal: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary },

  // SIM item
  simItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  simItemSelected: { borderColor: colors.primary, borderWidth: 1.5 },
  simStatusBar: { width: 3 },
  simItemContent: { flex: 1, padding: spacing.sm + 2 },
  simNumber: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  simServices: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' },
  simSvcTag: {
    fontSize: 9,
    color: colors.textLight,
    backgroundColor: colors.background,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: '600',
  },

  // Empty state
  emptyBox: { alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  emptyText: { fontSize: fontSize.sm, color: colors.textLight, textAlign: 'center', lineHeight: 22 },

  // Right panel
  rightPanel: { flex: 2, backgroundColor: colors.background },
  rightPanelEmpty: { flex: 2, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  emptyDetailText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backBtnText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '700' },

  // Detail card
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  detailOpIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  detailOpName: { fontSize: fontSize.md, fontWeight: '900' },
  detailPhone: { fontSize: fontSize.xs, color: colors.textSecondary },
  balancesRow: { flexDirection: 'row', gap: spacing.sm },
  balanceBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  balanceValue: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text, textAlign: 'center' },

  // Services config
  configTitle: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  activeServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}30`,
  },
  activeServiceLabel: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600', flex: 1 },
  activeServiceDot: { width: 8, height: 8, borderRadius: 4 },
  noServicesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  noServicesText: { fontSize: fontSize.sm, color: colors.textLight },

  // Actions
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtnText: { fontSize: fontSize.xs, color: colors.text, fontWeight: '700' },

  // History
  emptyTxBox: { alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  emptyTxText: { fontSize: fontSize.xs, color: colors.textLight },

  leftPanelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disconnectText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: '700',
  },
});

export default DashboardScreen;

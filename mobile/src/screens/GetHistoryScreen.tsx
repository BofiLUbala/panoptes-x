import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import { simStore } from '../services/simStore';
import { api } from '../services/api';
import { SimCard, SimService, ForwardedSms, WatchRelation } from '../types';

// ─── Service metadata ────────────────────────────────────────────────────────

const SERVICE_META: Record<
  SimService,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  [SimService.MOBILE_MONEY]: { label: 'Mobile Money', icon: 'swap-horizontal', color: '#22c55e' },
  [SimService.DATA_BUNDLES]: { label: 'Data Bundles', icon: 'globe', color: '#3b82f6' },
  [SimService.AIRTIME]: { label: 'Airtime', icon: 'call', color: '#f59e0b' },
  [SimService.BILL_PAYMENT]: { label: 'Factures', icon: 'receipt', color: '#a78bfa' },
  [SimService.TV]: { label: 'TV', icon: 'tv', color: '#06b6d4' },
  [SimService.GENERAL_MESSAGES]: {
    label: 'Messages généraux',
    icon: 'chatbox-ellipses',
    color: '#64748b',
  },
};

const OPERATOR_COLORS: Record<string, string> = {
  ORANGE: '#FF7900',
  AIRTEL: '#E11B22',
  VODACOM: '#00A94F',
  AFRICELL: '#ED1C24',
};

// ─── General Messages view ───────────────────────────────────────────────────

const GeneralMessagesView: React.FC<{
  sim: SimCard;
  onBack: () => void;
}> = ({ sim, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watchRelations, setWatchRelations] = useState<WatchRelation[]>([]);
  const [smsByTarget, setSmsByTarget] = useState<Record<string, ForwardedSms[]>>({});
  const [selectedSms, setSelectedSms] = useState<ForwardedSms | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Get all active watch relations where this device is the watcher
      const relations = await api.getWatchRelations('watcher');
      const active = relations.filter((r) => r.status === 'active');
      setWatchRelations(active);

      // Fetch forwarded SMS for each active target
      const results: Record<string, ForwardedSms[]> = {};
      await Promise.all(
        active.map(async (rel) => {
          try {
            const data = await api.getForwardedSms(rel.target_phone);
            results[rel.target_phone] = data.results;
          } catch {
            results[rel.target_phone] = [];
          }
        }),
      );
      setSmsByTarget(results);
    } catch (err: any) {
      console.warn('[GeneralMessages] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 15 s while this view is open
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const allSms: (ForwardedSms & { targetPhone: string })[] = watchRelations
    .flatMap((rel) =>
      (smsByTarget[rel.target_phone] ?? []).map((sms) => ({
        ...sms,
        targetPhone: rel.target_phone,
      })),
    )
    .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());

  return (
    <View style={styles.container}>
      <AppHeader title="Messages généraux" subtitle={`Surveillance — ${sim.phoneNumber}`} />

      {/* Back button */}
      <View style={styles.backRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backBtnText}>Retour aux services</Text>
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="chatbox-ellipses" size={13} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {allSms.length} SMS
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des messages…</Text>
        </View>
      ) : watchRelations.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="eye-off-outline" size={52} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Aucune surveillance active</Text>
          <Text style={styles.emptySubtitle}>
            Configurez une surveillance dans l'onglet Surveillance pour voir les messages ici.
          </Text>
        </View>
      ) : allSms.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbox-outline" size={52} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Aucun message reçu</Text>
          <Text style={styles.emptySubtitle}>
            Les SMS interceptés des appareils surveillés apparaîtront ici.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              tintColor={colors.primary}
            />
          }
        >
          {allSms.map((sms) => (
            <TouchableOpacity
              key={sms.id}
              style={styles.smsCard}
              onPress={() => setSelectedSms(sms)}
              activeOpacity={0.7}
            >
              {/* Target tag */}
              <View style={styles.smsTarget}>
                <Ionicons name="eye" size={11} color={colors.primary} />
                <Text style={styles.smsTargetText}>{sms.targetPhone}</Text>
              </View>

              <View style={styles.smsRow}>
                <View style={styles.smsIconWrap}>
                  <Ionicons name="person" size={16} color="#64748b" />
                </View>
                <View style={styles.smsContent}>
                  <Text style={styles.smsSender}>{sms.sender}</Text>
                  <Text style={styles.smsPreview} numberOfLines={2}>
                    {sms.message}
                  </Text>
                </View>
                <Text style={styles.smsTime}>
                  {new Date(sms.received_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <Text style={styles.smsDate}>
                {new Date(sms.received_at).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* SMS Detail Modal */}
      <Modal
        visible={!!selectedSms}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSms(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetIconWrap}>
                <Ionicons name="chatbox-ellipses" size={20} color="#64748b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetSender}>{selectedSms?.sender}</Text>
                <Text style={styles.sheetTarget}>Via {selectedSms?.targetPhone}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedSms(null)}>
                <Ionicons name="close-circle" size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetDivider} />

            <View style={styles.sheetMeta}>
              <Ionicons name="time-outline" size={13} color={colors.textLight} />
              <Text style={styles.sheetMetaText}>
                {selectedSms &&
                  new Date(selectedSms.received_at).toLocaleString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
              </Text>
            </View>

            <View style={styles.sheetMsgBox}>
              <Text style={styles.sheetMsgText}>{selectedSms?.message}</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSms(null)}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Service grid for a selected SIM ─────────────────────────────────────────

type InnerView = { kind: 'services' } | { kind: 'generalMessages' };

const SimServiceGrid: React.FC<{
  sim: SimCard;
  onBack: () => void;
}> = ({ sim, onBack }) => {
  const [innerView, setInnerView] = useState<InnerView>({ kind: 'services' });

  if (innerView.kind === 'generalMessages') {
    return (
      <GeneralMessagesView
        sim={sim}
        onBack={() => setInnerView({ kind: 'services' })}
      />
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Get History" subtitle={sim.phoneNumber} />

      <View style={styles.backRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backBtnText}>Retour aux numéros</Text>
        </TouchableOpacity>
        <Text style={styles.selectedPhone}>{sim.phoneNumber}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {sim.enabledServices.map((svc) => {
          const meta = SERVICE_META[svc];
          const isGeneralMessages = svc === SimService.GENERAL_MESSAGES;
          return (
            <TouchableOpacity
              key={svc}
              style={[
                styles.serviceCard,
                { borderColor: meta.color },
                isGeneralMessages && styles.serviceCardHighlight,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (isGeneralMessages) {
                  setInnerView({ kind: 'generalMessages' });
                }
              }}
            >
              <View style={[styles.serviceIconWrap, { backgroundColor: meta.color + '20' }]}>
                <Ionicons name={meta.icon} size={24} color={meta.color} />
              </View>
              <Text style={styles.serviceLabel}>{meta.label}</Text>
              {isGeneralMessages && (
                <View style={styles.serviceArrow}>
                  <Ionicons name="chevron-forward" size={14} color={meta.color} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Root screen — SIM list ───────────────────────────────────────────────────

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
    return <SimServiceGrid sim={selectedSim} onBack={() => setSelectedSim(null)} />;
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Get History" />
      {sims.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="phone-portrait-outline" size={52} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Aucun numéro enregistré</Text>
          <Text style={styles.emptySubtitle}>
            Ajoutez des SIM via le menu Service pour voir leur historique.
          </Text>
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
              <View
                style={[
                  styles.simDot,
                  { backgroundColor: OPERATOR_COLORS[sim.operator] || colors.primary },
                ]}
              />
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // SIM list
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
  simDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
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

  // Shared back row
  backRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  selectedPhone: { fontSize: fontSize.sm, color: colors.text, fontWeight: '700' },

  // Service grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    position: 'relative',
  },
  serviceCardHighlight: {
    borderStyle: 'dashed',
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
  serviceArrow: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },

  // Empty / loading
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm },

  // Badge (SMS count)
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },

  // SMS cards (GeneralMessages list)
  smsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  smsTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  smsTargetText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
  smsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  smsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#64748b20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsContent: { flex: 1 },
  smsSender: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  smsPreview: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  smsTime: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 2 },
  smsDate: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: spacing.xs,
    marginLeft: 40,
  },

  // Detail modal
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sheetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#64748b20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetSender: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  sheetTarget: { fontSize: fontSize.xs, color: colors.primary, marginTop: 2, fontWeight: '600' },
  sheetDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  sheetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sheetMetaText: { fontSize: fontSize.xs, color: colors.textLight },
  sheetMsgBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sheetMsgText: { fontSize: fontSize.md, color: colors.text, lineHeight: 24 },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  closeButtonText: { color: colors.background, fontWeight: '700', fontSize: fontSize.md },
});

export default GetHistoryScreen;

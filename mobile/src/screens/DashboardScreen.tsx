import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import MetricCard from '../components/MetricCard';
import DataCard from '../components/DataCard';
import ActionDeck from '../components/ActionDeck';
import { api } from '../services/api';
import { simStore } from '../services/simStore';
import { dataCache } from '../services/dataCache';
import { Subscription } from '../types';

type SystemStatus = 'active' | 'warning' | 'inactive';

interface SystemItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  status: SystemStatus;
}

interface ActivityItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

const STATUS_CONFIG: Record<SystemStatus, { color: string; label: string }> = {
  active: { color: colors.success, label: 'Actif' },
  warning: { color: colors.warning, label: 'Attention' },
  inactive: { color: colors.textLight, label: 'Inactif' },
};

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [simCount, setSimCount] = useState(simStore.getSims().length);
  const [deviceCount, setDeviceCount] = useState(dataCache.devices.length);
  const [txCount, setTxCount] = useState(dataCache.transactions.length);
  const [msgCount, setMsgCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(dataCache.subscriptions);
  const [mmTxCount, setMmTxCount] = useState(dataCache.transactions.filter(t => t.type === 'MOBILE_MONEY').length);

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const expiringSubs = activeSubs.filter(s => s.days_remaining < 7);
  const uniqueActiveDevices = new Set(activeSubs.map(s => s.device_phone)).size;

  const getSystemStatuses = useCallback((): SystemItem[] => {
    const smsStatus: SystemStatus = deviceCount > 0 ? 'active' : 'inactive';
    const mmStatus: SystemStatus = mmTxCount > 0 ? 'active' : 'inactive';
    const syncStatus: SystemStatus = pendingCount === 0 ? 'active' : 'warning';
    const subStatus: SystemStatus =
      activeSubs.length > 0 ? (expiringSubs.length > 0 ? 'warning' : 'active') : 'inactive';

    return [
      { icon: 'chatbox-ellipses', label: 'SMS Monitoring', status: smsStatus },
      { icon: 'swap-horizontal', label: 'Mobile Money Detection', status: mmStatus },
      { icon: 'cloud-done', label: 'Backend Synchronization', status: syncStatus },
      { icon: 'shield-checkmark', label: 'Subscription Service', status: subStatus },
    ];
  }, [deviceCount, mmTxCount, pendingCount, activeSubs, expiringSubs]);

  const getRecentActivity = useCallback((): ActivityItem[] => {
    const items: ActivityItem[] = [];
    if (msgCount > 0) {
      items.push({ icon: 'chatbox-ellipses', label: 'Nouveau message traité', value: `${msgCount} total`, color: colors.primary });
    }
    if (txCount > 0) {
      items.push({ icon: 'swap-horizontal', label: 'Nouvelle transaction détectée', value: `${txCount} total`, color: colors.success });
    }
    if (simCount > 0) {
      items.push({ icon: 'phone-portrait', label: 'Appareil ajouté', value: `${simCount} SIM`, color: colors.warning });
    }
    if (activeSubs.length > 0) {
      items.push({ icon: 'card', label: 'Abonnement renouvelé', value: `${activeSubs.length} actif${activeSubs.length > 1 ? 's' : ''}`, color: colors.accent });
    }
    return items.length > 0 ? items : [{ icon: 'time', label: 'Aucune activité récente', value: '', color: colors.textLight }];
  }, [msgCount, txCount, simCount, activeSubs]);

  useEffect(() => {
    countSms();
    const unsub = simStore.subscribe(() => setSimCount(simStore.getSims().length));
    return unsub;
  }, []);

  async function countSms() {
    try {
      const rels = dataCache.watchRelations;
      const activeTargets = rels.filter(r => r.status === 'active');
      let total = 0;
      for (const rel of activeTargets) {
        try {
          const data = await api.getForwardedSms(rel.target_phone);
          total += data.results.length;
        } catch {}
      }
      setMsgCount(total);
    } catch {}
  }

  const onRefresh = useCallback(async () => {
    dataCache.refreshAll();
    setSimCount(simStore.getSims().length);
    setSubscriptions([...dataCache.subscriptions]);
    setDeviceCount(dataCache.devices.length);
    setTxCount(dataCache.transactions.length);
    setMmTxCount(dataCache.transactions.filter(t => t.type === 'MOBILE_MONEY').length);
    countSms();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const systemItems = getSystemStatuses();
  const recentActivity = getRecentActivity();
  const bestSub = activeSubs.length > 0
    ? activeSubs.reduce((a, b) =>
        new Date(a.expiry_date) > new Date(b.expiry_date) ? a : b
      )
    : null;

  return (
    <View style={styles.container}>
      <AppHeader title="PANOPTES-X" />

      <ActionDeck
        actions={[
          { icon: 'phone-portrait', label: 'Appareils', onPress: () => navigation.navigate('SIM') },
          { icon: 'chatbox-ellipses', label: 'Messages', onPress: () => navigation.navigate('Monitoring') },
          { icon: 'swap-horizontal', label: 'Transactions', onPress: () => navigation.navigate('Historique') },
          { icon: 'card', label: 'Abonnement', onPress: () => navigation.navigate('Subscription'), color: colors.accent },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIconRow}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="shield" size={28} color={colors.primary} />
            </View>
            <View style={styles.welcomeBadge}>
              <Text style={styles.welcomeBadgeText}>v1.0</Text>
            </View>
          </View>
          <Text style={styles.welcomeTitle}>Bienvenue sur Panoptes-X</Text>
          <Text style={styles.welcomeSub}>
            Plateforme centralisée de monitoring et de gestion des appareils.
          </Text>
        </View>

        {/* Global Summary */}
        <Text style={styles.sectionTitle}>Résumé global</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <MetricCard
              label="Appareils enregistrés"
              value={String(deviceCount)}
              unit={deviceCount > 1 ? 'appareils' : 'appareil'}
              color={colors.primary}
            />
            <MetricCard
              label="Services actifs"
              value={String(activeSubs.length)}
              unit={activeSubs.length > 1 ? 'services' : 'service'}
              color={colors.success}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              label="Messages traités"
              value={String(msgCount)}
              unit={msgCount > 1 ? 'messages' : 'message'}
              color={colors.warning}
            />
            <MetricCard
              label="Transactions détectées"
              value={String(txCount)}
              unit={txCount > 1 ? 'transactions' : 'transaction'}
              color={colors.accent}
            />
          </View>
        </View>

        {/* System Status */}
        <Text style={styles.sectionTitle}>État du système</Text>
        <View style={styles.systemCard}>
          {systemItems.map((item) => {
            const cfg = STATUS_CONFIG[item.status];
            return (
              <View key={item.label} style={styles.systemRow}>
                <View style={[styles.systemIcon, { backgroundColor: cfg.color + '20' }]}>
                  <Ionicons name={item.icon} size={18} color={cfg.color} />
                </View>
                <Text style={styles.systemLabel}>{item.label}</Text>
                <View style={[styles.systemStatusBadge, { backgroundColor: cfg.color + '20' }]}>
                  <View style={[styles.systemStatusDot, { backgroundColor: cfg.color }]} />
                  <Text style={[styles.systemStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Activité récente</Text>
        <View style={styles.activityCard}>
          {recentActivity.map((item) => (
            <View key={item.label} style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <Text style={styles.activityLabel}>{item.label}</Text>
              {item.value ? (
                <Text style={[styles.activityValue, { color: item.color }]}>{item.value}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Subscription Card */}
        <Text style={styles.sectionTitle}>Abonnement</Text>
        <View style={styles.subCard}>
          {bestSub ? (
            <>
              <View style={styles.subCardHeader}>
                <View style={styles.subCardIcon}>
                  <Ionicons name="card" size={22} color={colors.accent} />
                </View>
                <View style={styles.subCardPlan}>
                  <Text style={styles.subPlanLabel}>Plan actuel</Text>
                  <Text style={styles.subPlanValue}>{bestSub.service_name}</Text>
                </View>
                <View style={styles.subCardStatus}>
                  <Text style={styles.subStatusText}>{bestSub.days_remaining}j</Text>
                  <Text style={styles.subStatusLabel}>restants</Text>
                </View>
              </View>
              <View style={styles.subDivider} />
              <View style={styles.subDetails}>
                <View style={styles.subDetailRow}>
                  <Text style={styles.subDetailLabel}>Date d'expiration</Text>
                  <Text style={styles.subDetailValue}>
                    {new Date(bestSub.expiry_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.subDetailRow}>
                  <Text style={styles.subDetailLabel}>Appareils couverts</Text>
                  <Text style={styles.subDetailValue}>{uniqueActiveDevices}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.subEmpty}>
              <Ionicons name="card-outline" size={32} color={colors.textLight} />
              <Text style={styles.subEmptyText}>Aucun abonnement actif</Text>
              <Text style={styles.subEmptySub}>
                Souscrivez un abonnement pour activer le monitoring de vos appareils.
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.subButton}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={16} color={colors.background} />
            <Text style={styles.subButtonText}>Gérer l'abonnement</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: 120,
  },

  // Welcome
  welcomeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  welcomeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  welcomeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  welcomeTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  welcomeSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Section Title
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },

  // Metrics
  metricsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // System Status
  systemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  systemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  systemStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  systemStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  systemStatusText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },

  // Activity
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  activityValue: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },

  // Subscription Card
  subCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCardPlan: {
    flex: 1,
  },
  subPlanLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  subPlanValue: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
    marginTop: 1,
  },
  subCardStatus: {
    alignItems: 'center',
  },
  subStatusText: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.success,
  },
  subStatusLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  subDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  subDetails: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  subDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subDetailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  subDetailValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  subEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  subEmptyText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textLight,
  },
  subEmptySub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
  },
  subButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  subButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.background,
  },
});

export default DashboardScreen;

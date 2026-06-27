import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

const BAR_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a78bfa', '#06b6d4'];

const AnalyticsScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const [dashboard, setDashboard] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [simStats, setSimStats] = useState<any>(null);
  const [parseRate, setParseRate] = useState(0);

  const dayMap = { '7d': 7, '30d': 30, '90d': 90 };

  const loadAll = useCallback(async () => {
    try {
      const [dash, rev, sims] = await Promise.all([
        api.getAnalyticsDashboard(dayMap[period]),
        api.getRevenueAnalytics(6),
        api.getSimAnalytics(),
      ]);
      setDashboard(dash);
      setRevenue(rev);
      setSimStats(sims);
      const total = (dash?.total_transactions || 0) + (dash?.failed_parses || 0);
      setParseRate(total > 0 ? ((dash?.total_transactions || 0) / total) * 100 : 0);
    } catch { }
  }, [period]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const revenueData = revenue?.monthly_revenue || [];
  const maxRev = Math.max(...revenueData.map((r: any) => r.total || 0), 1);
  const operatorBreakdown = dashboard?.operator_breakdown || [];
  const typeBreakdown = dashboard?.transaction_type_breakdown || [];
  const topSims = dashboard?.top_sims || [];

  return (
    <View style={styles.container}>
      <AppHeader title="Tableau de Bord" subtitle="Analyses et statistiques" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Picker */}
        <View style={styles.periodRow}>
          {(['7d', '30d', '90d'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodChip, period === p && styles.periodChipActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '90 jours'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPI Cards */}
        <Text style={styles.sectionTitle}>Indicateurs clés</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <MetricCard label="Transactions" value={String(dashboard?.total_transactions || 0)} color={colors.primary} />
            <MetricCard label="Taux de parsing" value={`${parseRate.toFixed(1)}%`} color={parseRate > 80 ? colors.success : colors.warning} />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard label="Échecs" value={String(dashboard?.failed_parses || 0)} color={colors.danger} />
            <MetricCard label="Revenu total" value={`${(dashboard?.total_revenue || 0).toFixed(2)}$`} color={colors.accent} />
          </View>
        </View>

        {/* Revenue Chart */}
        {revenueData.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Revenu mensuel</Text>
            <View style={styles.chartCard}>
              {revenueData.map((item: any, i: number) => {
                const barH = maxRev > 0 ? (item.total / maxRev) * 120 : 0;
                return (
                  <View key={i} style={styles.barContainer}>
                    <Text style={styles.barValue}>{item.total?.toFixed(0) || '0'}$</Text>
                    <View style={[styles.bar, { height: Math.max(barH, 4), backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
                    <Text style={styles.barLabel}>{item.month || ''}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Operator Breakdown */}
        {operatorBreakdown.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Répartition par opérateur</Text>
            <View style={styles.breakdownCard}>
              {operatorBreakdown.map((op: any, i: number) => {
                const pct = dashboard?.total_transactions > 0 ? (op.count / dashboard.total_transactions) * 100 : 0;
                return (
                  <View key={i} style={styles.breakdownRow}>
                    <View style={[styles.breakdownDot, { backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
                    <Text style={styles.breakdownLabel}>{op.operator}</Text>
                    <Text style={styles.breakdownValue}>{op.count}</Text>
                    <View style={styles.breakdownBarBg}>
                      <View style={[styles.breakdownBar, { width: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Top SIMs */}
        {topSims.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top appareils</Text>
            {topSims.map((sim: any, i: number) => (
              <View key={i} style={styles.topSimCard}>
                <Text style={styles.topSimRank}>#{i + 1}</Text>
                <View style={styles.topSimInfo}>
                  <Text style={styles.topSimPhone}>{sim.phone_number || sim.phone || `SIM ${i + 1}`}</Text>
                  <Text style={styles.topSimMeta}>{sim.transaction_count || 0} transactions</Text>
                </View>
                <Text style={styles.topSimRevenue}>{(sim.revenue || 0).toFixed(2)}$</Text>
              </View>
            ))}
          </>
        )}

        {/* Parsing Rate */}
        <View style={styles.parseCard}>
          <Ionicons name={parseRate > 80 ? 'checkmark-circle' : 'warning'} size={24} color={parseRate > 80 ? colors.success : colors.warning} />
          <View style={styles.parseInfo}>
            <Text style={styles.parseTitle}>Taux de parsing des SMS</Text>
            <Text style={styles.parseValue}>{parseRate.toFixed(1)}%</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 120 },

  periodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  periodChip: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  periodChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  periodTextActive: { color: colors.background, fontWeight: '700' },

  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.xs,
  },

  metricsGrid: { gap: spacing.sm, marginBottom: spacing.lg },
  metricsRow: { flexDirection: 'row', gap: spacing.sm },

  chartCard: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, height: 200, marginBottom: spacing.lg,
  },
  barContainer: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 9, color: colors.textSecondary, marginBottom: 2 },
  bar: { width: 20, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 9, color: colors.textLight, marginTop: 4, textAlign: 'center' },

  breakdownCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  breakdownValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginRight: spacing.sm },
  breakdownBarBg: { width: 60, height: 6, backgroundColor: colors.background, borderRadius: 3, overflow: 'hidden' },
  breakdownBar: { height: 6, borderRadius: 3 },

  topSimCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  topSimRank: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary, width: 30 },
  topSimInfo: { flex: 1 },
  topSimPhone: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  topSimMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  topSimRevenue: { fontSize: fontSize.md, fontWeight: '700', color: colors.success },

  parseCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  parseInfo: { flex: 1 },
  parseTitle: { fontSize: fontSize.sm, color: colors.textSecondary },
  parseValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
});

export default AnalyticsScreen;

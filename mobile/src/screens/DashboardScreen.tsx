import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ImageStyle,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppLogo from '../components/AppLogo';

const mockStock = {
  cashBalance: 45000,
  airtimeBalance: 120,
  dataBalance: 8.5,
  dataUnit: 'GB',
};

const mockTodayStats = {
  cashCommission: 3250,
  cashVolume: 125000,
  bundlesSold: 14.5,
  bundlesUnit: 'GB',
  transactions: 23,
};

function getStockColor(value: number, type: 'cash' | 'data' | 'airtime'): string {
  if (type === 'cash') {
    if (value > 50000) return colors.success;
    if (value > 20000) return colors.warning;
    return colors.danger;
  }
  if (type === 'data') {
    if (value > 10) return colors.success;
    if (value > 1) return colors.warning;
    return colors.danger;
  }
  if (value > 200) return colors.success;
  if (value > 50) return colors.warning;
  return colors.danger;
}

const DashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleSos = () => {
    Alert.alert(
      'SOS PANOPTES-X',
      'Simulation: position GPS fixee, SMS prioritaire prepare et alerte API en attente de connexion.',
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <AppLogo size={52} style={styles.headerLogo as ImageStyle} />
          <Text style={styles.headerTitle}>Panoptes-x</Text>
        </View>
        <Text style={styles.headerSubtitle}>Tableau de bord</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.supervisionPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Supervision active</Text>
            <Text style={styles.scoreBadge}>92/100</Text>
          </View>
          <View style={styles.statusGrid}>
            <View style={styles.statusCell}>
              <Text style={styles.statusLabel}>GPS</Text>
              <Text style={styles.statusValue}>Zone cabine</Text>
            </View>
            <View style={styles.statusCell}>
              <Text style={styles.statusLabel}>Offline</Text>
              <Text style={styles.statusValue}>Tampon OK</Text>
            </View>
            <View style={styles.statusCell}>
              <Text style={styles.statusLabel}>Alertes IA</Text>
              <Text style={styles.statusValue}>0 critique</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.sosButton} onPress={handleSos} activeOpacity={0.82}>
            <Text style={styles.sosButtonText}>SOS PANOPTES-X</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.statLabel}>Aujourd'hui</Text>
            <Text style={styles.statValue}>{mockTodayStats.transactions}</Text>
            <Text style={styles.statUnit}>transactions</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success }]}>
            <Text style={styles.statLabel}>Commission</Text>
            <Text style={styles.statValue}>
              {mockTodayStats.cashCommission.toLocaleString()}
            </Text>
            <Text style={styles.statUnit}>CDF</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Cash</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Volume du jour</Text>
            <Text style={styles.cardValue}>
              {mockTodayStats.cashVolume.toLocaleString()} CDF
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Solde disponible</Text>
            <Text
              style={[
                styles.cardValue,
                {
                  color: getStockColor(mockStock.cashBalance, 'cash'),
                },
              ]}
            >
              {mockStock.cashBalance.toLocaleString()} CDF
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Bundles</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Vendus aujourd'hui</Text>
            <Text style={styles.cardValue}>
              {mockTodayStats.bundlesSold} {mockTodayStats.bundlesUnit}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Stock data</Text>
            <Text
              style={[
                styles.cardValue,
                {
                  color: getStockColor(mockStock.dataBalance, 'data'),
                },
              ]}
            >
              {mockStock.dataBalance} {mockStock.dataUnit}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>CrÃ©dit unitÃ©s</Text>
            <Text
              style={[
                styles.cardValue,
                {
                  color: getStockColor(mockStock.airtimeBalance, 'airtime'),
                },
              ]}
            >
              {mockStock.airtimeBalance} USD
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ã‰tat des stocks</Text>
        <View style={styles.card}>
          <View
            style={[
              styles.stockBar,
              {
                backgroundColor: getStockColor(mockStock.cashBalance, 'cash'),
              },
            ]}
          >
            <Text style={styles.stockBarText}>
              Cash {mockStock.cashBalance.toLocaleString()} CDF
            </Text>
          </View>
          <View
            style={[
              styles.stockBar,
              {
                backgroundColor: getStockColor(mockStock.dataBalance, 'data'),
              },
            ]}
          >
            <Text style={styles.stockBarText}>
              Data {mockStock.dataBalance} {mockStock.dataUnit}
            </Text>
          </View>
          <View
            style={[
              styles.stockBar,
              {
                backgroundColor: getStockColor(
                  mockStock.airtimeBalance,
                  'airtime'
                ),
              },
            ]}
          >
            <Text style={styles.stockBarText}>
              CrÃ©dit {mockStock.airtimeBalance} USD
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerLogo: {
    marginLeft: -4,
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
  scroll: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  supervisionPanel: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  panelTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
  },
  scoreBadge: {
    backgroundColor: colors.successLight,
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusCell: {
    flex: 1,
    minHeight: 58,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: '800',
  },
  sosButton: {
    minHeight: 50,
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '900',
    letterSpacing: 0.5,
  },  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.white,
    opacity: 0.8,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.xs,
  },
  statUnit: {
    fontSize: fontSize.xs,
    color: colors.white,
    opacity: 0.7,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  cardLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardValue: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  stockBar: {
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginVertical: 4,
  },
  stockBarText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
});

export default DashboardScreen;





import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { SimService } from '../types';

interface SIMServiceConfigProps {
  enabledServices: SimService[];
  onToggle: (service: SimService) => void;
}

const ALL_SERVICES: { key: SimService; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: SimService.MOBILE_MONEY, label: 'Mobile Money', icon: 'swap-horizontal' },
  { key: SimService.DATA_BUNDLES, label: 'Data Bundles', icon: 'globe' },
  { key: SimService.AIRTIME, label: 'Airtime (Crédit)', icon: 'call' },
  { key: SimService.BILL_PAYMENT, label: 'Paiement Factures', icon: 'receipt' },
  { key: SimService.TV, label: 'TV', icon: 'tv' },
];

const SIMServiceConfig: React.FC<SIMServiceConfigProps> = ({ enabledServices, onToggle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Services activés</Text>
      <Text style={styles.subtitle}>Configurer les services proposés sur cette SIM</Text>
      <View style={styles.grid}>
        {ALL_SERVICES.map((svc) => {
          const enabled = enabledServices.includes(svc.key);
          return (
            <TouchableOpacity
              key={svc.key}
              style={[styles.serviceItem, enabled && styles.serviceItemActive]}
              onPress={() => onToggle(svc.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={svc.icon}
                size={16}
                color={enabled ? colors.primary : colors.textLight}
              />
              <Text style={[styles.serviceLabel, enabled && styles.serviceLabelActive]}>
                {svc.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  grid: {
    gap: spacing.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md - 2,
  },
  serviceItemActive: {
    borderColor: colors.primary,
    backgroundColor: '#0f1f3d',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  serviceLabelActive: {
    color: colors.text,
  },
});

export default SIMServiceConfig;

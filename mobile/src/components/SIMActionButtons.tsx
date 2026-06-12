import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { SimService } from '../types';

interface ActionDef {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  service: SimService;
  onPress: () => void;
}

interface SIMActionButtonsProps {
  enabledServices: SimService[];
}

const SIMActionButtons: React.FC<SIMActionButtonsProps> = ({ enabledServices }) => {
  const actions = buildActions(enabledServices);

  if (actions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Actions rapides</Text>
        <View style={styles.emptyBox}>
          <Ionicons name="ban-outline" size={20} color={colors.textLight} />
          <Text style={styles.emptyText}>
            Aucun service activé. Cochez des services ci-dessus pour voir les actions.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actions rapides</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionButton}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <Ionicons name={action.icon} size={20} color={colors.primary} />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

function buildActions(services: SimService[]): ActionDef[] {
  const result: ActionDef[] = [];

  if (services.includes(SimService.MOBILE_MONEY)) {
    result.push(
      { icon: 'arrow-down-circle', label: 'Cash-In (Dépôt)', service: SimService.MOBILE_MONEY, onPress: () => {} },
      { icon: 'arrow-up-circle', label: 'Cash-Out (Retrait)', service: SimService.MOBILE_MONEY, onPress: () => {} },
      { icon: 'swap-horizontal', label: 'Transfert', service: SimService.MOBILE_MONEY, onPress: () => {} },
    );
  }
  if (services.includes(SimService.AIRTIME)) {
    result.push({
      icon: 'call', label: 'Vendre crédit (Airtime)', service: SimService.AIRTIME, onPress: () => {},
    });
  }
  if (services.includes(SimService.DATA_BUNDLES)) {
    result.push({
      icon: 'globe', label: 'Vendre Data', service: SimService.DATA_BUNDLES, onPress: () => {},
    });
  }
  if (services.includes(SimService.BILL_PAYMENT)) {
    result.push({
      icon: 'receipt', label: 'Payer Facture', service: SimService.BILL_PAYMENT, onPress: () => {},
    });
  }
  if (services.includes(SimService.TV)) {
    result.push({
      icon: 'tv', label: 'Abonnement TV', service: SimService.TV, onPress: () => {},
    });
  }

  result.push({
    icon: 'create-outline', label: 'Saisie manuelle', service: 'MANUAL' as SimService, onPress: () => {},
  });

  return result;
}

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
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    minWidth: '45%',
  },
  actionLabel: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    flex: 1,
    lineHeight: 18,
  },
});

export default SIMActionButtons;

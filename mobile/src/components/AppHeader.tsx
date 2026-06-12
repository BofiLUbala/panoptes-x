import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../constants/theme';
import { useDrawer } from '../contexts/DrawerContext';
import AppLogo from './AppLogo';

interface StatusIndicator {
  label: string;
  active: boolean;
  color: string;
}

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  statusIndicators?: StatusIndicator[];
}

const defaultStatus: StatusIndicator[] = [
  { label: 'GPS', active: true, color: colors.success },
  { label: 'Sync', active: true, color: colors.success },
  { label: 'IA', active: true, color: colors.primary },
];

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  statusIndicators = defaultStatus,
}) => {
  const { open } = useDrawer();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <TouchableOpacity onPress={open} style={styles.menuButton} activeOpacity={0.7}>
          <Ionicons name="menu" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppLogo size={36} style={styles.logo} />
        <View style={styles.brandGroup}>
          <Text style={styles.brandName}>Panoptes-x</Text>
          {title && <Text style={styles.brandTitle}>{title}</Text>}
        </View>
      </View>

      <View style={styles.right}>
        {statusIndicators.map((indicator) => (
          <View key={indicator.label} style={styles.statusItem}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: indicator.active ? indicator.color : colors.textLight },
              ]}
            />
            {subtitle && <Text style={styles.statusLabel}>{indicator.label}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginLeft: spacing.xs,
  },
  brandGroup: {
    flexDirection: 'column',
  },
  brandName: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: -1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 9,
    color: colors.textLight,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default AppHeader;

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
      <TouchableOpacity onPress={open} style={styles.menuButton} activeOpacity={0.7}>
        <Ionicons name="menu" size={24} color={colors.primary} />
      </TouchableOpacity>

      <View style={styles.center}>
        <View style={styles.logoCircle}>
          <AppLogo size={20} />
        </View>
        <Text style={styles.brandName}>PANOPTES-X</Text>
      </View>

      <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.primary} />
      </TouchableOpacity>
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
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandName: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  brandTitle: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default AppHeader;

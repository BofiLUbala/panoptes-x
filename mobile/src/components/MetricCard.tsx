import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, color }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, color ? { color } : null]}>
        {value}
      </Text>
      {unit && <Text style={styles.unit}>{unit}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 100,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  unit: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
});

export default MetricCard;

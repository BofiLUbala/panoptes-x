import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

interface DataRow {
  label: string;
  value: string;
  color?: string;
}

interface DataCardProps {
  title?: string;
  rows: DataRow[];
}

const DataCard: React.FC<DataCardProps> = ({ title, rows }) => {
  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[
            styles.row,
            index < rows.length - 1 && styles.rowBorder,
          ]}
        >
          <Text style={styles.label}>{row.label}</Text>
          <Text style={[styles.value, row.color ? { color: row.color } : null]}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
});

export default DataCard;

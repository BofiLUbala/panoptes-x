import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

interface ActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  critical?: boolean;
}

interface ActionDeckProps {
  actions: ActionItem[];
}

const ActionDeck: React.FC<ActionDeckProps> = ({ actions }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[
              styles.actionButton,
              action.critical && styles.actionCritical,
            ]}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={action.icon}
              size={18}
              color={action.critical ? colors.white : (action.color || colors.primary)}
            />
            <Text
              style={[
                styles.actionLabel,
                action.critical && { color: colors.white },
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
  },
  actionCritical: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  actionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.text,
  },
});

export default ActionDeck;

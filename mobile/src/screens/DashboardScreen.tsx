import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';

const DashboardScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <AppHeader title="PANOPTES-X" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Bienvenue</Text>
          <Text style={styles.emptySub}>
            Utilisez le menu Service pour gérer vos opérateurs et cartes SIM.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyState: { alignItems: 'center', gap: spacing.md },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  emptySub: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default DashboardScreen;

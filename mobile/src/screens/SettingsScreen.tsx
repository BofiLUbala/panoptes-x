import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';

const SettingsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <AppHeader title="Compte" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.profileName}>Mon profil</Text>
            <Text style={styles.profilePhone}>Non configuré</Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Statistiques</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Exporter les données</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Gérer les SIM</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Langue (Français / Lingala)</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>À propos</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={[styles.menuText, { color: colors.warning }]}>Déconnexion</Text>
            <Text style={[styles.menuArrow, { color: colors.warning }]}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 100 },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  profilePhone: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  menuArrow: {
    fontSize: fontSize.lg,
    color: colors.textLight,
  },
});

export default SettingsScreen;

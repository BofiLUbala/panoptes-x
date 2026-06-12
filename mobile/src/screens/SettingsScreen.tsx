import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as themeColors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import AppHeader from '../components/AppHeader';
import { api } from '../services/api';
import { simStore } from '../services/simStore';
import { SimCard } from '../types';

const SettingsScreen: React.FC = () => {
  const { mode, colors, toggle } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [sims, setSims] = useState<SimCard[]>([]);

  useEffect(() => {
    api.getProfile()
      .then((res) => setProfile(res))
      .catch(() => {});
    setSims(simStore.getSims());
    const unsubscribe = simStore.subscribe(() => setSims(simStore.getSims()));
    return unsubscribe;
  }, []);

  const profileName = profile?.username || profile?.email || 'Agent';
  const profilePhone = profile?.phone || profile?.whatsapp_number || '+243 XX XXX XXXX';
  const profileEmail = profile?.email || '';
  const profileService = profile?.service_profile || 'business';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Paramètres" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.background, borderColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {profileName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.text }]}>{profileName}</Text>
              <Text style={[styles.profileSub, { color: colors.textSecondary }]}>{profilePhone}</Text>
              {profileEmail ? (
                <Text style={[styles.profileSub, { color: colors.textSecondary }]}>{profileEmail}</Text>
              ) : null}
            </View>
          </View>
          <View style={[styles.profileBadge, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            <Text style={[styles.profileBadgeText, { color: colors.primary }]}>
              Profil: {profileService}
            </Text>
          </View>
        </View>

        {/* SIMs card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes cartes SIM</Text>
            <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>{sims.length}</Text>
          </View>
          {sims.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>Aucune carte SIM enregistrée.</Text>
            </View>
          ) : (
            sims.map((sim) => (
              <View key={sim.id} style={[styles.simRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.simDot, { backgroundColor: getOperatorColor(sim.operator) }]} />
                <Text style={[styles.simPhone, { color: colors.text }]}>{sim.phoneNumber}</Text>
                <Text style={[styles.simServices, { color: colors.textSecondary }]}>
                  {sim.enabledServices.length} service(s)
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Theme toggle */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="moon-outline" size={18} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Affichage</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={18} color={colors.warning} />
              <Text style={[styles.settingText, { color: colors.text }]}>Mode sombre</Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={mode === 'dark' ? colors.primary : colors.textLight}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.menuRow} onPress={() => {}} activeOpacity={0.7}>
            <Ionicons name="stats-chart" size={18} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Statistiques</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => {}} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Exporter les données</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => {}} activeOpacity={0.7}>
            <Ionicons name="language" size={18} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Langue (Français / Lingala)</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => {}} activeOpacity={0.7}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>À propos</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={() => api.logout()} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={[styles.menuText, { color: colors.danger }]}>Déconnexion</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

function getOperatorColor(op: string): string {
  switch (op) {
    case 'AIRTEL': return '#E11B22';
    case 'ORANGE': return '#FF7900';
    case 'VODACOM': return '#00A94F';
    case 'AFRICELL': return '#ED1C24';
    default: return themeColors.textSecondary;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: 100 },

  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.xl, fontWeight: 'bold' },
  profileName: { fontSize: fontSize.md, fontWeight: 'bold' },
  profileSub: { fontSize: fontSize.sm, marginTop: 2 },
  profileBadge: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  profileBadgeText: { fontSize: fontSize.xs, fontWeight: '600' },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
  sectionCount: { fontSize: fontSize.sm, fontWeight: '700' },

  // SIM list
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  simDot: { width: 8, height: 8, borderRadius: 4 },
  simPhone: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  simServices: { fontSize: fontSize.xs },

  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  emptyText: { fontSize: fontSize.sm, flex: 1 },

  // Theme toggle
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingText: { fontSize: fontSize.sm, fontWeight: '600' },

  // Menu items
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  menuText: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
});

export default SettingsScreen;

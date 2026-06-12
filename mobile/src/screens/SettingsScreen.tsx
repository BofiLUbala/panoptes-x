import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import { api } from '../services/api';

const SettingsScreen: React.FC = () => {
  const [profile, setProfile] = React.useState<any>(null);
  const [phone, setPhone] = React.useState('Non configuré');
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempPhone, setTempPhone] = React.useState('');

  React.useEffect(() => {
    api.getProfile()
      .then((res) => {
        setProfile(res);
        const p = res?.whatsapp_number || res?.phone || '';
        if (p) {
          setPhone(p);
          setTempPhone(p);
        }
      })
      .catch((err) => console.log('Error getting profile in Settings:', err));
  }, []);

  const handleSavePhone = () => {
    if (!tempPhone.startsWith('+243') || tempPhone.length < 13) {
      alert('Veuillez entrer un numéro valide au format +243 suivi de 9 chiffres.');
      return;
    }
    setPhone(tempPhone);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Compte" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile?.username || 'Mon profil'}</Text>
            {isEditing ? (
              <View style={styles.inlineEditRow}>
                <TextInput
                  style={styles.inlineInput}
                  value={tempPhone}
                  onChangeText={(val) => {
                    let digits = val.slice(4).replace(/\D/g, '');
                    setTempPhone('+243' + digits);
                  }}
                  maxLength={13}
                  keyboardType="phone-pad"
                  autoFocus
                />
                <TouchableOpacity onPress={handleSavePhone} style={styles.saveBtn}>
                  <Ionicons name="checkmark" size={18} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                  <Ionicons name="close" size={18} color={colors.warning} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.profilePhone}>{phone}</Text>
                <TouchableOpacity onPress={() => { setTempPhone(phone === 'Non configuré' ? '+243' : phone); setIsEditing(true); }}>
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
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
          <TouchableOpacity style={styles.menuItem} onPress={() => api.logout()}>
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
  inlineEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  inlineInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    color: colors.white,
    fontSize: fontSize.xs,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  saveBtn: {
    padding: 4,
  },
  cancelBtn: {
    padding: 4,
  },
});

export default SettingsScreen;

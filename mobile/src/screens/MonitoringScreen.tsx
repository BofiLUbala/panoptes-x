import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, borderRadius } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import AppHeader from '../components/AppHeader';
import CountryCodePicker from '../components/CountryCodePicker';
import { api } from '../services/api';
import { deviceStore } from '../services/deviceStore';
import { smsForwarder } from '../services/smsForwarder';
import { ForwardedSms, WatchRelation } from '../types';

const MonitoringScreen: React.FC = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devicePhone, setDevicePhone] = useState<string | null>(null);
  const [registerPhone, setRegisterPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+243');
  const [watching, setWatching] = useState<WatchRelation[]>([]);
  const [watchedBy, setWatchedBy] = useState<WatchRelation[]>([]);
  const [targetInput, setTargetInput] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [forwardedSms, setForwardedSms] = useState<ForwardedSms[]>([]);
  const [smsModalVisible, setSmsModalVisible] = useState(false);
  const [selectedSms, setSelectedSms] = useState<ForwardedSms | null>(null);

  const loadData = useCallback(async () => {
    try {
      const phone = await deviceStore.getDevicePhone();
      setDevicePhone(phone);
      const [asWatcher, asTarget] = await Promise.all([
        api.getWatchRelations('watcher'),
        api.getWatchRelations('target'),
      ]);
      setWatching(asWatcher);
      setWatchedBy(asTarget);
    } catch (err: any) {
      console.warn('Monitoring load error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRegisterDevice = async () => {
    const digits = registerPhone.replace(/\D/g, '');
    if (digits.length < 9) {
      Alert.alert('Erreur', 'Numéro invalide (minimum 9 chiffres).');
      return;
    }
    try {
      setLoading(true);
      const fullPhone = countryCode + digits;
      await api.registerDevice(fullPhone);
      await smsForwarder.start();
      Alert.alert('Succès', 'Appareil enregistré pour la surveillance.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || err?.message || 'Échec enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWatch = async () => {
    const digits = targetInput.replace(/\D/g, '');
    if (digits.length < 9) {
      Alert.alert('Erreur', 'Numéro cible invalide.');
      return;
    }
    try {
      setLoading(true);
      await api.authorizeWatcher(countryCode + digits);
      Alert.alert('Demande envoyée', 'En attente d\'acceptation sur l\'appareil cible.');
      setTargetInput('');
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Échec de la demande';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (relation: WatchRelation, action: 'accept' | 'reject') => {
    try {
      setLoading(true);
      await api.confirmWatcher(relation.id, action);
      if (action === 'accept') {
        await smsForwarder.start();
      }
      await loadData();
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (relation: WatchRelation) => {
    Alert.alert(
      'Révoquer la surveillance',
      'Cette action est irréversible. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.revokeWatcher(relation.id);
              await loadData();
            } catch (err: any) {
              Alert.alert('Erreur', err?.response?.data?.message || err?.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const loadSmsForTarget = async (targetPhone: string) => {
    try {
      setLoading(true);
      const data = await api.getForwardedSms(targetPhone);
      setForwardedSms(data.results);
      setSelectedTarget(targetPhone);
      setSmsModalVisible(true);
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'pending': return colors.warning;
      case 'rejected': return colors.danger;
      default: return colors.textLight;
    }
  };

  if (loading && !devicePhone && watching.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Surveillance SMS" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Enregistrement appareil (Device B) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mon appareil</Text>
          </View>
          {devicePhone ? (
            <Text style={[styles.devicePhone, { color: colors.textSecondary }]}>
              Enregistré : {devicePhone}
            </Text>
          ) : (
            <>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Enregistrez ce téléphone pour recevoir des demandes de surveillance et relayer vos SMS.
              </Text>
              <CountryCodePicker selectedCode={countryCode} onSelectCode={setCountryCode} />
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Numéro de ce téléphone"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
                value={registerPhone}
                onChangeText={(v) => setRegisterPhone(v.replace(/\D/g, ''))}
              />
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleRegisterDevice}>
                <Text style={[styles.btnText, { color: colors.background }]}>Enregistrer cet appareil</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Device A — demander surveillance */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Surveiller un appareil</Text>
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Saisissez le numéro du téléphone à surveiller (Device B).
          </Text>
          <CountryCodePicker selectedCode={countryCode} onSelectCode={setCountryCode} />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="Numéro cible"
            placeholderTextColor={colors.textLight}
            keyboardType="phone-pad"
            value={targetInput}
            onChangeText={(v) => setTargetInput(v.replace(/\D/g, ''))}
          />
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleRequestWatch}>
            <Ionicons name="send" size={16} color={colors.background} />
            <Text style={[styles.btnText, { color: colors.background }]}>Envoyer la demande</Text>
          </TouchableOpacity>
        </View>

        {/* Demandes entrantes (Device B) */}
        {watchedBy.filter((r) => r.status === 'pending').length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications" size={18} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Demandes reçues</Text>
            </View>
            {watchedBy.filter((r) => r.status === 'pending').map((rel) => (
              <View key={rel.id} style={[styles.relationRow, { borderColor: colors.border }]}>
                <Text style={[styles.relationPhone, { color: colors.text }]}>
                  {rel.watcher_phone} souhaite surveiller vos SMS
                </Text>
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleConfirm(rel, 'accept')}
                  >
                    <Text style={styles.smallBtnText}>Accepter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: colors.danger }]}
                    onPress={() => handleConfirm(rel, 'reject')}
                  >
                    <Text style={styles.smallBtnText}>Refuser</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Mes surveillances actives (Device A) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appareils surveillés</Text>
          </View>
          {watching.length === 0 ? (
            <Text style={[styles.hint, { color: colors.textLight }]}>Aucune surveillance configurée.</Text>
          ) : (
            watching.map((rel) => (
              <View key={rel.id} style={[styles.relationRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.relationPhone, { color: colors.text }]}>{rel.target_phone}</Text>
                  <Text style={[styles.statusBadge, { color: statusColor(rel.status) }]}>
                    {rel.status.toUpperCase()}
                  </Text>
                </View>
                {rel.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.iconBtn, { borderColor: colors.primary }]}
                    onPress={() => loadSmsForTarget(rel.target_phone)}
                  >
                    <Ionicons name="chatbubbles" size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
                {rel.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.iconBtn, { borderColor: colors.danger }]}
                    onPress={() => handleRevoke(rel)}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Surveillances actives où je suis la cible */}
        {watchedBy.filter((r) => r.status === 'active').length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes SMS sont surveillés par</Text>
            </View>
            {watchedBy.filter((r) => r.status === 'active').map((rel) => (
              <View key={rel.id} style={[styles.relationRow, { borderColor: colors.border }]}>
                <Text style={[styles.relationPhone, { color: colors.text }]}>{rel.watcher_phone}</Text>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: colors.danger }]}
                  onPress={() => handleRevoke(rel)}
                >
                  <Text style={styles.smallBtnText}>Révoquer</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal SMS relayés */}
      <Modal visible={smsModalVisible} animationType="slide" transparent onRequestClose={() => setSmsModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                SMS — {selectedTarget}
              </Text>
              <TouchableOpacity onPress={() => setSmsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {forwardedSms.length === 0 ? (
                <Text style={[styles.hint, { color: colors.textLight, textAlign: 'center', padding: spacing.lg }]}>
                  Aucun SMS relayé pour le moment.
                </Text>
              ) : (
                forwardedSms.map((sms) => (
                  <TouchableOpacity
                    key={sms.id}
                    style={[styles.smsItem, { borderColor: colors.border }]}
                    onPress={() => setSelectedSms(sms)}
                  >
                    <Text style={[styles.smsSender, { color: colors.primary }]}>{sms.sender}</Text>
                    <Text style={[styles.smsPreview, { color: colors.text }]} numberOfLines={2}>
                      {sms.message}
                    </Text>
                    <Text style={[styles.smsDate, { color: colors.textLight }]}>
                      {new Date(sms.received_at).toLocaleString('fr-FR')}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            {selectedTarget && (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary, marginTop: spacing.sm }]}
                onPress={() => selectedTarget && loadSmsForTarget(selectedTarget)}
              >
                <Ionicons name="refresh" size={16} color={colors.background} />
                <Text style={[styles.btnText, { color: colors.background }]}>Actualiser</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Détail SMS */}
      <Modal visible={!!selectedSms} animationType="fade" transparent onRequestClose={() => setSelectedSms(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {selectedSms && (
              <>
                <Text style={[styles.smsSender, { color: colors.primary }]}>{selectedSms.sender}</Text>
                <Text style={[styles.smsDate, { color: colors.textLight, marginBottom: spacing.md }]}>
                  {new Date(selectedSms.received_at).toLocaleString('fr-FR')}
                </Text>
                <Text style={[styles.smsBody, { color: colors.text }]}>{selectedSms.message}</Text>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary, marginTop: spacing.md }]} onPress={() => setSelectedSms(null)}>
                  <Text style={[styles.btnText, { color: colors.background }]}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '800' },
  hint: { fontSize: fontSize.sm, marginBottom: spacing.sm, lineHeight: 20 },
  devicePhone: { fontSize: fontSize.sm, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  btnText: { fontWeight: '800', fontSize: fontSize.sm },
  relationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  relationPhone: { fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
  statusBadge: { fontSize: fontSize.xs, fontWeight: '700', marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  smallBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  smallBtnText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '700' },
  iconBtn: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '800' },
  smsItem: {
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
  },
  smsSender: { fontSize: fontSize.sm, fontWeight: '800' },
  smsPreview: { fontSize: fontSize.sm, marginTop: 2 },
  smsDate: { fontSize: fontSize.xs, marginTop: 4 },
  smsBody: { fontSize: fontSize.md, lineHeight: 22 },
});

export default MonitoringScreen;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import { api } from '../services/api';
import { simStore } from '../services/simStore';
import { dataCache } from '../services/dataCache';
import { Service, Subscription, PaymentItemRequest } from '../types';

const NETWORKS = [
  { key: 'mpesa', label: 'M-Pesa', color: '#00A94F' },
  { key: 'orange', label: 'Orange Money', color: '#FF7900' },
  { key: 'airtel', label: 'Airtel Money', color: '#E11B22' },
];

const DURATION_OPTIONS = [
  { label: '30 jours', days: 30 },
  { label: '90 jours', days: 90 },
  { label: '1 an', days: 365 },
];

interface BackendDevice {
  id: number;
  phone_number: string;
  device_secret: string;
  created_at: string;
}

const SubscriptionScreen: React.FC = () => {
  const [services, setServices] = useState<Service[]>(dataCache.services);
  const [devices, setDevices] = useState<BackendDevice[]>(dataCache.devices as BackendDevice[]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(dataCache.subscriptions);
  const [loading, setLoading] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [paymentResult, setPaymentResult] = useState<{ reference: string; amount: number; payment_id: number } | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [confirming, setConfirming] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const devs = dataCache.devices as BackendDevice[];
    const localSims = simStore.getSims();
    const devPhoneNumbers = new Set(devs.map(d => d.phone_number));
    const unregisteredSims = localSims.filter(s => !devPhoneNumbers.has(s.phoneNumber));
    if (unregisteredSims.length > 0) {
      Promise.all(unregisteredSims.map(sim =>
        api.registerDevice(sim.phoneNumber).catch(() => null)
      )).then(results => {
        const newDevices = results.filter(Boolean) as BackendDevice[];
        if (newDevices.length > 0) {
          setDevices([...devs, ...newDevices]);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (paymentResult) {
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
    }
  }, [paymentResult]);

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const expiredSubs = subscriptions.filter(s => s.status !== 'active');
  const unsubscribedDevices = devices.filter(d =>
    !subscriptions.some(s => s.device_phone === d.phone_number && s.status === 'active')
  );

  const selectedService = services.find(s => s.id === selectedServiceId);
  const totalPrice = selectedService ? selectedService.price * (selectedDuration / 30) : 0;

  const handleCreatePayment = async () => {
    if (!selectedNetwork || !selectedServiceId || !selectedDeviceId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un service, un appareil et un réseau.');
      return;
    }
    setProcessing(true);
    try {
      const result = await api.createPayment(selectedNetwork, [{
        device_id: selectedDeviceId,
        service_id: selectedServiceId,
        duration_days: selectedDuration,
      }]);
      setPaymentResult(result);
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || err?.message || 'Erreur lors de la création du paiement.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionRef.trim() || !paymentResult) return;
    setConfirming(true);
    try {
      await api.confirmPayment(paymentResult.payment_id, transactionRef.trim());
      Alert.alert('Succès', 'Paiement confirmé !');
      setPaymentResult(null);
      setTransactionRef('');
      setShowPayment(false);
      setSelectedServiceId(null);
      setSelectedDeviceId(null);
      dataCache.refreshAll();
      setServices([...dataCache.services]);
      setSubscriptions([...dataCache.subscriptions]);
      setDevices(dataCache.devices as BackendDevice[]);
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || err?.message || 'Erreur lors de la confirmation.');
    } finally {
      setConfirming(false);
    }
  };

  const resetPayment = () => {
    setPaymentResult(null);
    setTransactionRef('');
    setSelectedServiceId(null);
    setSelectedDeviceId(null);
    setSelectedDuration(30);
    setSelectedNetwork(null);
  };

  function getServicePrice(code: string): number {
    return services.find(s => s.code === code)?.price || 1;
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Abonnement"
        subtitle={`${activeSubs.length} actif(s)`}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ===== ABONNEMENTS ACTIFS ===== */}
        <Text style={styles.sectionTitle}>Abonnements actifs</Text>
        {activeSubs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="timer-outline" size={36} color={colors.textLight} />
            <Text style={styles.emptyText}>Aucun abonnement actif</Text>
          </View>
        ) : (
          activeSubs.map(sub => {
            const device = devices.find(d => d.phone_number === sub.device_phone);
            return (
              <View key={sub.id} style={styles.subCard}>
                <View style={styles.subRow}>
                  <View style={styles.subIconWrap}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                  </View>
                  <View style={styles.subInfo}>
                    <Text style={styles.subService}>{sub.service_name}</Text>
                    <Text style={styles.subPhone}>{sub.device_phone}</Text>
                  </View>
                  <View style={styles.subStatus}>
                    <Text style={styles.subDays}>{sub.days_remaining}</Text>
                    <Text style={styles.subDaysLabel}>jours</Text>
                  </View>
                </View>
                <View style={styles.subMeta}>
                  <Text style={styles.subMetaText}>
                    Expire le {new Date(sub.expiry_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                  {sub.days_remaining < 7 && (
                    <View style={styles.expiryWarning}>
                      <Ionicons name="warning" size={12} color={colors.warning} />
                      <Text style={styles.expiryWarningText}>Bientôt expiré</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* ===== ABONNEMENTS EXPIRÉS ===== */}
        {expiredSubs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Expirés</Text>
            {expiredSubs.map(sub => (
              <View key={sub.id} style={[styles.subCard, { opacity: 0.55 }]}>
                <View style={styles.subRow}>
                  <View style={[styles.subIconWrap, { backgroundColor: colors.danger + '20' }]}>
                    <Ionicons name="timer-outline" size={20} color={colors.danger} />
                  </View>
                  <View style={styles.subInfo}>
                    <Text style={styles.subService}>{sub.service_name}</Text>
                    <Text style={styles.subPhone}>{sub.device_phone}</Text>
                  </View>
                  <View style={styles.subStatus}>
                    <Text style={[styles.subDays, { color: colors.danger }]}>0</Text>
                    <Text style={styles.subDaysLabel}>jour</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ===== APPAREILS SANS ABONNEMENT ===== */}
        {unsubscribedDevices.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
              Appareils sans abonnement
            </Text>
            {unsubscribedDevices.map(dev => (
              <View key={dev.id} style={[styles.subCard, { borderStyle: 'dashed' }]}>
                <View style={styles.subRow}>
                  <View style={[styles.subIconWrap, { backgroundColor: colors.textLight + '20' }]}>
                    <Ionicons name="phone-portrait" size={20} color={colors.textLight} />
                  </View>
                  <View style={styles.subInfo}>
                    <Text style={styles.subPhone}>{dev.phone_number}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ===== SECTION PAIEMENT ===== */}
        <View style={styles.paymentSection}>
          <TouchableOpacity
            style={styles.togglePaymentBtn}
            onPress={() => { setShowPayment(!showPayment); resetPayment(); }}
            activeOpacity={0.7}
          >
            <Ionicons name={showPayment ? 'chevron-up' : 'card'} size={20} color={colors.primary} />
            <Text style={styles.togglePaymentText}>
              {showPayment ? 'Fermer' : 'Souscrire un abonnement'}
            </Text>
          </TouchableOpacity>

          {showPayment && !paymentResult && (
            <View style={styles.paymentForm}>
              {/* Service */}
              <Text style={styles.formLabel}>1. Service</Text>
              <View style={styles.optionsRow}>
                {services.map(svc => (
                  <TouchableOpacity
                    key={svc.id}
                    style={[styles.optionChip, selectedServiceId === svc.id && styles.optionChipActive]}
                    onPress={() => setSelectedServiceId(svc.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionChipText, selectedServiceId === svc.id && styles.optionChipTextActive]}>
                      {svc.name}
                    </Text>
                    <Text style={[styles.optionChipPrice, selectedServiceId === svc.id && styles.optionChipPriceActive]}>
                      {svc.price} USD/mois
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Appareil */}
              <Text style={styles.formLabel}>2. Appareil</Text>
              <View style={styles.optionsRow}>
                {devices.map(dev => (
                  <TouchableOpacity
                    key={dev.id}
                    style={[styles.deviceChip, selectedDeviceId === dev.id && styles.deviceChipActive]}
                    onPress={() => setSelectedDeviceId(dev.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="phone-portrait"
                      size={14}
                      color={selectedDeviceId === dev.id ? colors.primary : colors.textLight}
                    />
                    <Text style={[styles.deviceChipText, selectedDeviceId === dev.id && styles.deviceChipTextActive]}>
                      {dev.phone_number}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Durée */}
              <Text style={styles.formLabel}>3. Durée</Text>
              <View style={styles.optionsRow}>
                {DURATION_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.days}
                    style={[styles.durationChip, selectedDuration === opt.days && styles.durationChipActive]}
                    onPress={() => setSelectedDuration(opt.days)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.durationChipText, selectedDuration === opt.days && styles.durationChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Réseau */}
              <Text style={styles.formLabel}>4. Réseau de paiement</Text>
              <View style={styles.optionsRow}>
                {NETWORKS.map(net => (
                  <TouchableOpacity
                    key={net.key}
                    style={[styles.networkChip, selectedNetwork === net.key && { borderColor: net.color, backgroundColor: net.color + '15' }]}
                    onPress={() => setSelectedNetwork(net.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.networkDot, { backgroundColor: net.color }]} />
                    <Text style={[styles.networkChipText, selectedNetwork === net.key && { color: net.color }]}>
                      {net.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Total */}
              {selectedService && (
                <View style={styles.totalBar}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>{totalPrice.toFixed(2)} USD</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.payBtn, (!selectedNetwork || !selectedServiceId || !selectedDeviceId || processing) && styles.payBtnDisabled]}
                onPress={handleCreatePayment}
                disabled={!selectedNetwork || !selectedServiceId || !selectedDeviceId || processing}
                activeOpacity={0.8}
              >
                {processing ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <>
                    <Ionicons name="card" size={18} color={colors.background} />
                    <Text style={styles.payBtnText}>Créer le paiement</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ===== CONFIRMATION PAIEMENT ===== */}
          {showPayment && paymentResult && (
            <View style={styles.confirmSection}>
              <View style={styles.confirmCard}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                <Text style={styles.confirmRef}>{paymentResult.reference}</Text>
                <Text style={styles.confirmAmount}>{paymentResult.amount.toFixed(2)} USD</Text>
              </View>

              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>Instructions</Text>
                <Text style={styles.instructionsText}>
                  Envoyez {paymentResult.amount.toFixed(2)} USD via{' '}
                  {NETWORKS.find(n => n.key === selectedNetwork)?.label || selectedNetwork}{' '}
                  au numéro marchand, puis entrez la référence ci-dessous.
                </Text>
              </View>

              <Text style={styles.formLabel}>Référence de transaction</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: MP123456"
                placeholderTextColor={colors.textLight}
                value={transactionRef}
                onChangeText={setTransactionRef}
                autoCapitalize="characters"
              />

              <View style={styles.confirmRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setPaymentResult(null); setTransactionRef(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, (!transactionRef.trim() || confirming) && styles.confirmBtnDisabled]}
                  onPress={handleConfirmPayment}
                  disabled={!transactionRef.trim() || confirming}
                  activeOpacity={0.8}
                >
                  {confirming ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirmer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 100 },

  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
  },

  emptyBox: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: fontSize.sm, color: colors.textSecondary },

  subCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm,
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  subIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.success + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  subInfo: { flex: 1 },
  subService: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  subPhone: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1 },
  subStatus: { alignItems: 'center' },
  subDays: { fontSize: fontSize.xl, fontWeight: '800', color: colors.success },
  subDaysLabel: { fontSize: fontSize.xs, color: colors.textLight },
  subMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  subMetaText: { fontSize: fontSize.xs, color: colors.textLight },
  expiryWarning: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiryWarningText: { fontSize: fontSize.xs, color: colors.warning, fontWeight: '600' },

  // Payment section
  paymentSection: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  togglePaymentBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md,
    backgroundColor: colors.primary + '10', borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  togglePaymentText: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },

  paymentForm: { marginTop: spacing.md },
  formLabel: {
    fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary,
    marginBottom: spacing.sm, marginTop: spacing.md,
  },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  optionChip: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 2,
  },
  optionChipActive: { borderColor: colors.primary, backgroundColor: '#0f1f3d' },
  optionChipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  optionChipTextActive: { color: colors.primary },
  optionChipPrice: { fontSize: fontSize.xs, color: colors.textLight },
  optionChipPriceActive: { color: colors.primary },

  deviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  deviceChipActive: { borderColor: colors.primary },
  deviceChipText: { fontSize: fontSize.sm, color: colors.text },
  deviceChipTextActive: { color: colors.primary },

  durationChip: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  durationChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durationChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  durationChipTextActive: { color: colors.background, fontWeight: '700' },

  networkChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  networkDot: { width: 10, height: 10, borderRadius: 5 },
  networkChipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },

  totalBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary + '10', borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.primary + '30',
    padding: spacing.md, marginTop: spacing.md,
  },
  totalLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  totalAmount: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary },

  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.md, marginTop: spacing.md,
  },
  payBtnDisabled: { opacity: 0.4 },
  payBtnText: { fontSize: fontSize.md, fontWeight: '700', color: colors.background },

  confirmSection: { marginTop: spacing.md },
  confirmCard: {
    alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.success + '40',
    padding: spacing.lg, marginBottom: spacing.md,
  },
  confirmRef: { fontSize: fontSize.md, color: colors.text, fontWeight: '600', letterSpacing: 1 },
  confirmAmount: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },

  instructionsBox: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.md,
  },
  instructionsTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  instructionsText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },

  input: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: borderRadius.sm, color: colors.white,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: fontSize.md, marginBottom: spacing.md,
  },

  confirmRow: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1, alignItems: 'center', padding: spacing.md,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtnText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary },
  confirmBtn: {
    flex: 2, alignItems: 'center', justifyContent: 'center', padding: spacing.md,
    borderRadius: borderRadius.md, backgroundColor: colors.success,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: fontSize.md, fontWeight: '700', color: colors.background },
});

export default SubscriptionScreen;

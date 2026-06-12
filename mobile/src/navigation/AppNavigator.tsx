import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SIMScreen from '../screens/SIMScreen';
import NavigationDrawer from '../components/NavigationDrawer';
import { simStore } from '../services/simStore';
import { Operator, SimService } from '../types';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; default: keyof typeof Ionicons.glyphMap }> = {
  Dashboard: { focused: 'home', default: 'home-outline' },
  SIM: { focused: 'phone-portrait', default: 'phone-portrait-outline' },
  History: { focused: 'list', default: 'list-outline' },
  Subscription: { focused: 'card', default: 'card-outline' },
  Settings: { focused: 'person', default: 'person-outline' },
};

const OPERATORS: { key: Operator; label: string; color: string }[] = [
  { key: Operator.AIRTEL, label: 'Airtel', color: '#ff4d4d' },
  { key: Operator.ORANGE, label: 'Orange', color: '#ff9f1c' },
  { key: Operator.VODACOM, label: 'Vodacom', color: '#e63946' },
  { key: Operator.AFRICELL, label: 'Africell', color: '#9b5de5' },
];

const SERVICE_OPTIONS: { key: SimService; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: SimService.MOBILE_MONEY, label: 'Mobile Money', icon: 'swap-horizontal', color: '#22c55e' },
  { key: SimService.DATA_BUNDLES, label: 'Data Bundles', icon: 'globe', color: '#3b82f6' },
  { key: SimService.AIRTIME, label: 'Airtime (Crédit)', icon: 'call', color: '#f59e0b' },
  { key: SimService.BILL_PAYMENT, label: 'Paiement Factures', icon: 'receipt', color: '#a78bfa' },
  { key: SimService.TV, label: 'Abonnements TV', icon: 'tv', color: '#06b6d4' },
];

type Step = 'menu' | 'pickOperator' | 'enterCount' | 'enterNumbers' | 'pickServices' | 'confirm';

const AppNavigator: React.FC = () => {
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [step, setStep] = useState<Step>('menu');
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
  const [simCount, setSimCount] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<SimService[]>([]);

  const selectedOpInfo = OPERATORS.find((o) => o.key === selectedOp);

  const resetModal = () => {
    setStep('menu');
    setSelectedOp(null);
    setSimCount('');
    setPhoneNumbers([]);
    setSelectedServices([]);
  };

  const closeModal = () => {
    setServiceModalVisible(false);
    resetModal();
  };

  const toggleServiceSelection = (svc: SimService) => {
    setSelectedServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  };

  const updatePhoneNumber = (index: number, value: string) => {
    setPhoneNumbers((prev) => {
      const updated = [...prev];
      // Force the prefix to be +243 and only allow numeric characters after it
      let digits = value.slice(4).replace(/\D/g, '');
      updated[index] = '+243' + digits;
      return updated;
    });
  };

  const handleConfirm = () => {
    if (!selectedOp) return;
    const invalid = phoneNumbers.some((n) => n.trim().length < 13);
    if (invalid) {
      Alert.alert(
        'Erreur',
        'Veuillez saisir un numéro valide composé de 9 chiffres après l\'indicatif +243.'
      );
      return;
    }

    simStore.addSims(selectedOp, phoneNumbers, selectedServices);
    Alert.alert(
      'Succès',
      `${phoneNumbers.length} SIM(s) ${selectedOpInfo?.label} ajoutée(s) avec ${selectedServices.length} service(s) !`
    );
    closeModal();
  };

  const drawerItems = [
    {
      icon: 'construct-outline' as const,
      label: 'Service',
      onPress: () => {
        resetModal();
        setServiceModalVisible(true);
      },
    },
    {
      icon: 'settings-outline' as const,
      label: 'Paramètres',
      onPress: () => {},
    },
  ];

  const renderStepContent = () => {
    switch (step) {
      case 'menu':
        return (
          <>
            <TouchableOpacity
              style={styles.featureBtn}
              onPress={() => setStep('pickOperator')}
              activeOpacity={0.7}
            >
              <View style={styles.featureBtnLeft}>
                <Ionicons name="add-circle" size={24} color={colors.success} />
                <Text style={styles.featureBtnText}>Ajouter opérateur</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        );

      case 'pickOperator':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choisir un opérateur</Text>
            <View style={styles.operatorGrid}>
              {OPERATORS.map((op) => (
                <TouchableOpacity
                  key={op.key}
                  style={[styles.operatorCard, { borderColor: op.color }]}
                  onPress={() => {
                    setSelectedOp(op.key);
                    setStep('enterCount');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.operatorDot, { backgroundColor: op.color }]} />
                  <Text style={[styles.operatorLabel, { color: op.color }]}>{op.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep('menu')}>
              <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
              <Text style={styles.backLinkText}>Retour</Text>
            </TouchableOpacity>
          </View>
        );

      case 'enterCount':
        return (
          <View style={styles.stepContainer}>
            <View style={[styles.stepIcon, { backgroundColor: (selectedOpInfo?.color || colors.primary) + '20' }]}>
              <Ionicons name="phone-portrait" size={32} color={selectedOpInfo?.color || colors.primary} />
            </View>
            <Text style={styles.stepTitle}>
              Combien de SIMs {selectedOpInfo?.label} ?
            </Text>
            <TextInput
              style={styles.countInput}
              placeholder="Ex: 2"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              value={simCount}
              onChangeText={setSimCount}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.nextBtn, (!simCount || parseInt(simCount) < 1) && styles.nextBtnDisabled]}
              onPress={() => {
                const c = parseInt(simCount, 10);
                if (!c || c < 1) {
                  Alert.alert('Erreur', 'Veuillez saisir un nombre valide.');
                  return;
                }
                // Initialize empty phone number fields with prefix +243
                setPhoneNumbers(Array(c).fill('+243'));
                setStep('enterNumbers');
              }}
              disabled={!simCount || parseInt(simCount) < 1}
            >
              <Text style={styles.nextBtnText}>Suivant — Entrer les numéros</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.background} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep('pickOperator')}>
              <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
              <Text style={styles.backLinkText}>Retour</Text>
            </TouchableOpacity>
          </View>
        );

      case 'enterNumbers':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Entrez vos numéros</Text>
            <Text style={styles.stepSubtitle}>
              Saisissez le numéro de chaque SIM {selectedOpInfo?.label}
            </Text>
            <View style={styles.phoneNumbersList}>
              {phoneNumbers.map((num, idx) => (
                <View key={idx} style={styles.phoneInputRow}>
                  <View style={[styles.phoneInputIndex, { backgroundColor: (selectedOpInfo?.color || colors.primary) + '20' }]}>
                    <Text style={[styles.phoneInputIndexText, { color: selectedOpInfo?.color || colors.primary }]}>{idx + 1}</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="+243 XX XXX XXXX"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    value={num}
                    onChangeText={(val) => updatePhoneNumber(idx, val)}
                    autoFocus={idx === 0}
                    maxLength={13}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.nextBtn, phoneNumbers.some((n) => n.trim().length < 13) && styles.nextBtnDisabled]}
              onPress={() => {
                const invalid = phoneNumbers.some((n) => n.trim().length < 13);
                if (invalid) {
                  Alert.alert('Erreur', 'Veuillez saisir un numéro valide composé de 9 chiffres après l\'indicatif +243.');
                  return;
                }
                setStep('pickServices');
              }}
              disabled={phoneNumbers.some((n) => n.trim().length < 13)}
            >
              <Text style={styles.nextBtnText}>Suivant — Choisir les services</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.background} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep('enterCount')}>
              <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
              <Text style={styles.backLinkText}>Retour</Text>
            </TouchableOpacity>
          </View>
        );

      case 'pickServices':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Sélectionnez les services</Text>
            <Text style={styles.stepSubtitle}>
              Ces services seront activés sur vos {phoneNumbers.filter((n) => n.trim()).length} SIM(s) {selectedOpInfo?.label}
            </Text>
            <View style={styles.servicesList}>
              {SERVICE_OPTIONS.map((svc) => {
                const isSelected = selectedServices.includes(svc.key);
                return (
                  <TouchableOpacity
                    key={svc.key}
                    style={[styles.serviceRow, isSelected && styles.serviceRowActive]}
                    onPress={() => toggleServiceSelection(svc.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.serviceCheckbox, isSelected && styles.serviceCheckboxActive]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color={colors.background} />}
                    </View>
                    <Ionicons name={svc.icon} size={18} color={isSelected ? svc.color : colors.textLight} />
                    <Text style={[styles.serviceLabel, isSelected && styles.serviceLabelActive]}>
                      {svc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.nextBtn, selectedServices.length === 0 && styles.nextBtnDisabled]}
              onPress={handleConfirm}
              disabled={selectedServices.length === 0}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.background} />
              <Text style={styles.nextBtnText}>
                Ajouter {phoneNumbers.filter((n) => n.trim()).length} SIM(s) avec {selectedServices.length} service(s)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep('enterNumbers')}>
              <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
              <Text style={styles.backLinkText}>Retour</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            return (
              <Ionicons
                name={focused ? icons.focused : icons.default}
                size={size}
                color={color}
              />
            );
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 8,
            height: 72,
            paddingBottom: 14,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Accueil' }} />
        <Tab.Screen name="SIM" component={SIMScreen} options={{ tabBarLabel: 'Mes SIM' }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'Historique' }} />
        <Tab.Screen name="Subscription" component={SubscriptionScreen} options={{ tabBarLabel: 'Abonnement' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Compte' }} />
      </Tab.Navigator>

      <NavigationDrawer items={drawerItems} />

      {/* MODAL: Service — Step-by-step wizard */}
      <Modal
        visible={serviceModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="construct-outline" size={22} color={colors.primary} />
                <Text style={styles.modalTitle}>Service</Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Step progress indicator */}
            {step !== 'menu' && (
              <View style={styles.progressRow}>
                {['pickOperator', 'enterCount', 'enterNumbers', 'pickServices'].map((s, idx) => (
                  <View
                    key={s}
                    style={[
                      styles.progressDot,
                      (step === s || ['pickOperator', 'enterCount', 'enterNumbers', 'pickServices'].indexOf(step) > idx) && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {renderStepContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    paddingBottom: 48,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  featureBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  featureBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureBtnText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '700',
  },
  stepContainer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  stepIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  operatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    width: '48%',
  },
  operatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  operatorLabel: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  countInput: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: 140,
  },
  servicesList: {
    width: '100%',
    gap: spacing.sm,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  serviceRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#0f1f3d',
  },
  serviceCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  serviceCheckboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  serviceLabelActive: {
    color: colors.text,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.background,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  backLinkText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  phoneNumbersList: {
    width: '100%',
    gap: spacing.sm,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  phoneInputIndex: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneInputIndexText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    color: colors.white,
    fontSize: fontSize.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});

export default AppNavigator;

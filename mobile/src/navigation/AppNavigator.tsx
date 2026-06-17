import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useDrawer } from '../contexts/DrawerContext';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GetHistoryScreen from '../screens/GetHistoryScreen';
import MonitoringScreen from '../screens/MonitoringScreen';
import SIMScreen from '../screens/SIMScreen';
import NavigationDrawer from '../components/NavigationDrawer';
import CountryCodePicker from '../components/CountryCodePicker';
import { simStore } from '../services/simStore';
import { api } from '../services/api';
import { Operator, SimService } from '../types';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; default: keyof typeof Ionicons.glyphMap }> = {
  Dashboard:  { focused: 'home',            default: 'home-outline' },
  SIM:        { focused: 'phone-portrait',  default: 'phone-portrait-outline' },
  Monitoring: { focused: 'eye',             default: 'eye-outline' },
  Historique: { focused: 'time',            default: 'time-outline' },
  Subscription:{ focused: 'card',           default: 'card-outline' },
  Settings:   { focused: 'person',          default: 'person-outline' },
  // GetHistory is a hidden tab — must still be safe
  GetHistory: { focused: 'document-text',   default: 'document-text-outline' },
};

const OPERATORS: { key: Operator; label: string; color: string }[] = [
  { key: Operator.AIRTEL, label: 'Airtel', color: '#ff4d4d' },
  { key: Operator.ORANGE, label: 'Orange', color: '#ff9f1c' },
  { key: Operator.VODACOM, label: 'Vodacom', color: '#e63946' },
  { key: Operator.AFRICELL, label: 'Africell', color: '#9b5de5' },
];

const SERVICE_OPTIONS: { key: SimService; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; auto?: boolean }[] = [
  { key: SimService.MOBILE_MONEY, label: 'Mobile Money', icon: 'swap-horizontal', color: '#22c55e' },
  { key: SimService.DATA_BUNDLES, label: 'Data Bundles', icon: 'globe', color: '#3b82f6' },
  { key: SimService.AIRTIME, label: 'Airtime (Crédit)', icon: 'call', color: '#f59e0b' },
  { key: SimService.BILL_PAYMENT, label: 'Paiement Factures', icon: 'receipt', color: '#a78bfa' },
  { key: SimService.TV, label: 'Abonnements TV', icon: 'tv', color: '#06b6d4' },
  { key: SimService.GENERAL_MESSAGES, label: 'Messages généraux', icon: 'chatbox-ellipses', color: '#64748b', auto: true },
];

type Step = 'menu' | 'pickOperator' | 'enterCount' | 'enterNumbers' | 'pickServices' | 'confirm';

const AppNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const drawer = useDrawer();
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [step, setStep] = useState<Step>('menu');
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
  const [simCount, setSimCount] = useState('');
  const [countryCode, setCountryCode] = useState('+243');
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
      updated[index] = value.replace(/\D/g, '');
      return updated;
    });
  };

  const handleConfirm = () => {
    if (!selectedOp) return;
    const invalid = phoneNumbers.some((n) => n.trim().length < 9);
    if (invalid) {
      Alert.alert(
        'Erreur',
        'Veuillez saisir un numéro valide composé d\'au moins 9 chiffres.'
      );
      return;
    }

    const finalNumbers = phoneNumbers.map((n) => countryCode + n);
    simStore.addSims(selectedOp, finalNumbers, selectedServices);
    Alert.alert(
      'Succès',
      `${phoneNumbers.length} SIM(s) ${selectedOpInfo?.label} ajoutée(s) avec ${selectedServices.length} service(s) !`
    );
    resetModal();
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
      onPress: () => {
        setSettingsModalVisible(true);
      },
    },
    {
      icon: 'time-outline' as const,
      label: 'get history',
      onPress: () => {
        navigation.navigate('GetHistory');
      },
    },
    {
      icon: 'document-text-outline' as const,
      label: 'Résumé',
      onPress: () => {
        // Summary feature
      },
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
                // Initialize empty phone number fields
                setPhoneNumbers(Array(c).fill(''));
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
            <View style={{ alignSelf: 'stretch', marginBottom: spacing.md }}>
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: '600' }}>Indicatif global</Text>
              <CountryCodePicker selectedCode={countryCode} onSelectCode={setCountryCode} />
            </View>
            <View style={styles.phoneNumbersList}>
              {phoneNumbers.map((num, idx) => (
                <View key={idx} style={styles.phoneInputRow}>
                  <View style={[styles.phoneInputIndex, { backgroundColor: (selectedOpInfo?.color || colors.primary) + '20' }]}>
                    <Text style={[styles.phoneInputIndexText, { color: selectedOpInfo?.color || colors.primary }]}>{idx + 1}</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="XX XXX XXXX"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    value={num}
                    onChangeText={(val) => updatePhoneNumber(idx, val)}
                    autoFocus={idx === 0}
                    maxLength={10}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.nextBtn, phoneNumbers.some((n) => n.trim().length < 9) && styles.nextBtnDisabled]}
              onPress={() => {
                const invalid = phoneNumbers.some((n) => n.trim().length < 9);
                if (invalid) {
                  Alert.alert('Erreur', 'Veuillez saisir un numéro valide composé d\'au moins 9 chiffres.');
                  return;
                }
                setStep('pickServices');
              }}
              disabled={phoneNumbers.some((n) => n.trim().length < 9)}
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
                const isSelected = svc.auto || selectedServices.includes(svc.key);
                return (
                  <TouchableOpacity
                    key={svc.key}
                    style={[styles.serviceRow, isSelected && styles.serviceRowActive, svc.auto && styles.serviceRowAuto]}
                    onPress={svc.auto ? undefined : () => toggleServiceSelection(svc.key)}
                    activeOpacity={svc.auto ? 1 : 0.7}
                  >
                    <View style={[styles.serviceCheckbox, isSelected && styles.serviceCheckboxActive]}>
                      {isSelected && <Ionicons name={svc.auto ? 'lock-closed' : 'checkmark'} size={14} color={colors.background} />}
                    </View>
                    <Ionicons name={svc.auto ? 'chatbox-ellipses' : svc.icon} size={18} color={isSelected ? svc.color : colors.textLight} />
                    <Text style={[styles.serviceLabel, isSelected && styles.serviceLabelActive, svc.auto && styles.serviceLabelAuto]}>
                      {svc.label}
                    </Text>
                    {svc.auto && <Text style={styles.autoBadge}>Auto</Text>}
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
            // Hidden tabs (e.g. GetHistory with display:'none') have no icon rendered,
            // but the callback is still called — guard against undefined.
            if (!icons) return null;
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
            height: 65 + Math.max(insets.bottom, 10),
            paddingBottom: Math.max(insets.bottom, 10) + 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard"   component={DashboardScreen}   options={{ tabBarLabel: 'Accueil' }} />
        <Tab.Screen name="SIM"          component={SIMScreen}         options={{ tabBarLabel: 'Mes SIM' }} />
        <Tab.Screen name="Monitoring"   component={MonitoringScreen}  options={{ tabBarLabel: 'Surveillance' }} />
        <Tab.Screen name="Historique"   component={HistoryScreen}     options={{ tabBarLabel: 'Historique' }} />
        <Tab.Screen name="Subscription" component={SubscriptionScreen} options={{ tabBarLabel: 'Abonnement' }} />
        <Tab.Screen name="Settings"     component={SettingsScreen}    options={{ tabBarLabel: 'Compte' }} />
        <Tab.Screen name="GetHistory"   component={GetHistoryScreen}  options={{ tabBarItemStyle: { display: 'none' }, tabBarLabel: '' }} />
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

      {/* MODAL: Paramètres */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
                <Text style={styles.modalTitle}>Param\u00e8tres</Text>
              </View>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profil utilisateur */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Mon compte</Text>
                <View style={styles.settingsProfileCard}>
                  <View style={styles.settingsAvatar}>
                    <Ionicons name="person" size={28} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingsProfileName}>Utilisateur</Text>
                    <Text style={styles.settingsProfileSub}>Identifiants enregistr\u00e9s</Text>
                  </View>
                </View>
              </View>

              {/* Nombre de SIM */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Mes SIM</Text>
                <View style={styles.settingsInfoRow}>
                  <View style={styles.settingsInfoLeft}>
                    <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
                    <Text style={styles.settingsInfoText}>Cartes SIM configur\u00e9es</Text>
                  </View>
                  <View style={styles.settingsBadge}>
                    <Text style={styles.settingsBadgeText}>{simStore.getSims().length}</Text>
                  </View>
                </View>
              </View>

              {/* Options */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Pr\u00e9f\u00e9rences</Text>
                <TouchableOpacity style={styles.settingsMenuItem}>
                  <View style={styles.settingsInfoLeft}>
                    <Ionicons name="language-outline" size={20} color="#3b82f6" />
                    <Text style={styles.settingsInfoText}>Langue</Text>
                  </View>
                  <Text style={styles.settingsMenuValue}>Fran\u00e7ais</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingsMenuItem}>
                  <View style={styles.settingsInfoLeft}>
                    <Ionicons name="moon-outline" size={20} color="#a78bfa" />
                    <Text style={styles.settingsInfoText}>Mode de lecture</Text>
                  </View>
                  <Text style={styles.settingsMenuValue}>Sombre</Text>
                </TouchableOpacity>
              </View>

              {/* Support */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Aide</Text>
                <TouchableOpacity style={styles.settingsMenuItem}>
                  <View style={styles.settingsInfoLeft}>
                    <Ionicons name="headset-outline" size={20} color="#06b6d4" />
                    <Text style={styles.settingsInfoText}>Support IT</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                </TouchableOpacity>
              </View>

              {/* Déconnexion */}
              <TouchableOpacity
                style={styles.settingsLogoutBtn}
                onPress={() => {
                  setSettingsModalVisible(false);
                  api.logout();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={styles.settingsLogoutText}>D\u00e9connexion</Text>
              </TouchableOpacity>
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
  serviceRowAuto: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
    opacity: 0.8,
  },
  serviceLabelAuto: {
    color: colors.textLight,
  },
  autoBadge: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
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
  settingsSection: {
    marginBottom: spacing.md,
  },
  settingsSectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  settingsProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  settingsAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsProfileName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  settingsProfileSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  settingsInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsInfoText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  settingsBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  settingsBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.background,
  },
  settingsMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  settingsMenuValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  settingsLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#ef444415',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  settingsLogoutText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#ef4444',
  },
});

export default AppNavigator;

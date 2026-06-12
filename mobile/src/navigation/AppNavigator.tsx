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
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SIMScreen from '../screens/SIMScreen';
import NavigationDrawer from '../components/NavigationDrawer';
import { simStore } from '../services/simStore';
import { SimService } from '../types';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; default: keyof typeof Ionicons.glyphMap }> = {
  Dashboard: { focused: 'home', default: 'home-outline' },
  SIM: { focused: 'phone-portrait', default: 'phone-portrait-outline' },
  History: { focused: 'list', default: 'list-outline' },
  Subscription: { focused: 'card', default: 'card-outline' },
  Settings: { focused: 'person', default: 'person-outline' },
};

const AppNavigator: React.FC = () => {
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [addOperatorOpen, setAddOperatorOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState<'Airtel' | 'Orange' | 'Vodacom' | 'Africell' | null>(null);
  const [simCount, setSimCount] = useState('');
  const [selMobileMoney, setSelMobileMoney] = useState(true);
  const [selDataBundle, setSelDataBundle] = useState(true);

  const handleAddOperatorSims = () => {
    if (!selectedOp) return;
    const count = parseInt(simCount, 10);
    if (!count || count < 1) {
      Alert.alert('Erreur', 'Veuillez saisir un nombre valide de SIMs.');
      return;
    }

    const services: SimService[] = [];
    if (selMobileMoney) services.push(SimService.MOBILE_MONEY);
    if (selDataBundle) services.push(SimService.DATA_BUNDLES);
    simStore.addSims(selectedOp, count, services);
    setSimCount('');
    setSelectedOp(null);
    setAddOperatorOpen(false);
    setServiceModalVisible(false);
    setSelMobileMoney(true);
    setSelDataBundle(true);
    Alert.alert('Succès', `${count} SIM(s) ${selectedOp} ajoutée(s) avec succès !`);
  };

  const drawerItems = [
    {
      icon: 'construct-outline' as const,
      label: 'Service',
      onPress: () => setServiceModalVisible(true),
    },
    {
      icon: 'settings-outline' as const,
      label: 'Paramètres',
      onPress: () => {},
    },
  ];

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
            paddingTop: 4,
            height: 60,
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

      {/* MODAL: Service Feature (Gestion des SIMs / Opérateurs) */}
      <Modal
        visible={serviceModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setServiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="construct-outline" size={22} color={colors.primary} />
                    <Text style={styles.modalTitle}>Service</Text>
                  </View>
                  <TouchableOpacity onPress={() => setServiceModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Sub-feature: Ajouter operateur */}
                <TouchableOpacity
                  style={styles.featureBtn}
                  onPress={() => setAddOperatorOpen(!addOperatorOpen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.featureBtnLeft}>
                    <Ionicons name="add-circle" size={24} color={colors.success} />
                    <Text style={styles.featureBtnText}>Ajouter opérateur</Text>
                  </View>
                  <Ionicons
                    name={addOperatorOpen ? 'chevron-down' : 'chevron-forward'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {/* Operator choice list when sub-feature is expanded */}
                {addOperatorOpen && (
                  <View style={styles.operatorListContainer}>
                    {(['Airtel', 'Orange', 'Vodacom', 'Africell'] as const).map((op) => {
                      const opColor =
                        op === 'Airtel'
                          ? '#ff4d4d'
                          : op === 'Orange'
                          ? '#ff9f1c'
                          : op === 'Vodacom'
                          ? '#e63946'
                          : '#9b5de5';

                      return (
                        <TouchableOpacity
                          key={op}
                          style={[styles.operatorSelectBtn, { borderColor: opColor }]}
                          onPress={() => { setSelectedOp(op); setSimCount(''); }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.operatorDot, { backgroundColor: opColor }]} />
                          <Text style={[styles.operatorText, { color: opColor }]}>{op}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Sub-modal/Inline form: Prompt for Sim Count */}
                {selectedOp && (
                  <View style={styles.promptContainer}>
                    <Text style={styles.promptTitle}>
                      Combien de SIMs {selectedOp} voulez-vous ajouter ?
                    </Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Entrez le nombre de SIMs (ex: 2)"
                      placeholderTextColor="#64748B"
                      keyboardType="number-pad"
                      value={simCount}
                      onChangeText={setSimCount}
                      autoFocus
                    />

                    <Text style={styles.servicesLabel}>Services à activer</Text>
                    <View style={styles.serviceToggleRow}>
                      <Ionicons name="swap-horizontal" size={18} color={colors.success} />
                      <Text style={styles.serviceToggleText}>Mobile Money</Text>
                      <Switch
                        value={selMobileMoney}
                        onValueChange={setSelMobileMoney}
                        trackColor={{ false: colors.border, true: '#64dfdf80' }}
                        thumbColor={selMobileMoney ? '#64dfdf' : colors.textLight}
                      />
                    </View>
                    <View style={styles.serviceToggleRow}>
                      <Ionicons name="globe" size={18} color={colors.primary} />
                      <Text style={styles.serviceToggleText}>Data Bundle</Text>
                      <Switch
                        value={selDataBundle}
                        onValueChange={setSelDataBundle}
                        trackColor={{ false: colors.border, true: '#64dfdf80' }}
                        thumbColor={selDataBundle ? '#64dfdf' : colors.textLight}
                      />
                    </View>

                    <View style={styles.promptActions}>
                      <TouchableOpacity
                        style={[styles.promptBtn, styles.promptBtnCancel]}
                        onPress={() => {
                          setSelectedOp(null);
                          setSimCount('');
                        }}
                      >
                        <Text style={styles.promptBtnCancelText}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.promptBtn, styles.promptBtnConfirm]}
                        onPress={handleAddOperatorSims}
                      >
                        <Text style={styles.promptBtnConfirmText}>Ajouter</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  operatorListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  operatorSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    minWidth: '47%',
  },
  operatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  operatorText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  promptContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  promptTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    color: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  servicesLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  serviceToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  serviceToggleText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  promptActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  promptBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptBtnCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptBtnCancelText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  promptBtnConfirm: {
    backgroundColor: colors.primary,
  },
  promptBtnConfirmText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: fontSize.sm,
  },
});

export default AppNavigator;

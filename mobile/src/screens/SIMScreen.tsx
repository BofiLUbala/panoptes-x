import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { SimCard, SimService, SimTransaction, Operator } from '../types';
import SIMServiceConfig from '../components/SIMServiceConfig';
import AppHeader from '../components/AppHeader';
import SIMCardItem from '../components/SIMCardItem';
import SIMDetailPanel from '../components/SIMDetailPanel';
import { simStore } from '../services/simStore';
import { api } from '../services/api';

const SIMScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [sims, setSims] = useState<SimCard[]>([]);
  const [selectedSimId, setSelectedSimId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const syncFromServer = useCallback(async () => {
    try {
      const devices = await api.getDevices();
      const localSims = simStore.getSims();
      const localNumbers = new Set(localSims.map(s => s.phoneNumber));
      const merged = [...localSims];
      for (const d of devices) {
        if (!localNumbers.has(d.phone_number)) {
          merged.push({
            id: `server-${d.id}`,
            operator: Operator.AIRTEL,
            phoneNumber: d.phone_number,
            cashBalance: 0,
            enabledServices: [],
          });
        }
      }
      setSims(merged);
    } catch {
      setSims(simStore.getSims());
    }
  }, []);

  useEffect(() => {
    syncFromServer();
    const unsubscribe = simStore.subscribe(() => {
      syncFromServer();
    });
    return unsubscribe;
  }, [syncFromServer]);

  const selectedSim = sims.find((s) => s.id === selectedSimId) || null;
  const transactions: SimTransaction[] = [];

  const handleSelectSim = useCallback((simId: string) => {
    setSelectedSimId(simId);
    if (!isTablet) {
      setShowDetail(true);
    }
  }, [isTablet]);

  const handleBack = useCallback(() => {
    setShowDetail(false);
  }, []);

  const handleToggleService = useCallback((service: SimService) => {
    if (!selectedSimId) return;
    simStore.toggleService(selectedSimId, service);
  }, [selectedSimId]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editServices, setEditServices] = useState<SimService[]>([]);

  const handleEditSim = () => {
    if (!selectedSimId || !editPhoneNumber.trim()) return;
    simStore.updateSim(selectedSimId, editPhoneNumber.trim(), editServices);
    setEditModalVisible(false);
    setEditPhoneNumber('');
    setEditServices([]);
  };

  const handleToggleEditService = (service: SimService) => {
    setEditServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleDeleteSim = () => {
    if (!selectedSimId) return;
    Alert.alert(
      'Confirmer la suppression',
      'Cette action supprimera la carte SIM et tous ses services associés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            simStore.deleteSim(selectedSimId);
            setSelectedSimId(null);
            if (!isTablet) setShowDetail(false);
          },
        },
      ]
    );
  };

  const renderEditDeleteButtons = () => (
    <View style={styles.editDeleteRow}>
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => {
          const sim = sims.find((s) => s.id === selectedSimId);
          if (sim) {
            setEditPhoneNumber(sim.phoneNumber);
            setEditServices([...sim.enabledServices]);
            setEditModalVisible(true);
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="create-outline" size={16} color={colors.primary} />
        <Text style={styles.editBtnText}>Modifier</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDeleteSim}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
        <Text style={styles.deleteBtnText}>Supprimer</Text>
      </TouchableOpacity>
    </View>
  );

  // Mobile: show detail fullscreen
  if (!isTablet && showDetail && selectedSim) {
    return (
      <View style={styles.container}>
        <View style={styles.mobileDetailHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.mobileDetailTitle}>
            {selectedSim.operator} — {selectedSim.phoneNumber}
          </Text>
        </View>
        <SIMDetailPanel
          sim={selectedSim}
          transactions={transactions}
          onToggleService={handleToggleService}
        />
        {renderEditDeleteButtons()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Mes cartes SIM" subtitle={`${sims.length} SIM`} />

      <View style={[styles.main, isTablet && styles.mainTablet]}>
        {/* SIM List */}
        <View style={[styles.listPanel, isTablet && styles.listPanelTablet]}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Cartes SIM</Text>
            <Text style={styles.listCount}>{sims.length} enregistrée(s)</Text>
          </View>

          {sims.length === 0 ? (
            <View style={styles.emptyListBox}>
              <Ionicons name="phone-portrait-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyListTitle}>Aucune SIM</Text>
              <Text style={styles.emptyListText}>
                Allez dans le menu → Service → Ajouter opérateur pour ajouter vos premières cartes SIM.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listScroll}>
              {sims.map((sim) => (
                <SIMCardItem
                  key={sim.id}
                  sim={sim}
                  selected={selectedSimId === sim.id}
                  onPress={() => handleSelectSim(sim.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Detail Panel (tablet only) */}
        {isTablet && (
          <View style={styles.detailPanel}>
            {selectedSim ? (
              <>
                <SIMDetailPanel
                  sim={selectedSim}
                  transactions={transactions}
                  onToggleService={handleToggleService}
                />
                {renderEditDeleteButtons()}
              </>
            ) : (
              <View style={styles.emptyDetail}>
                <Ionicons name="phone-portrait-outline" size={48} color={colors.border} />
                <Text style={styles.emptyDetailText}>
                  Sélectionnez une carte SIM pour voir ses détails
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* MODAL: Modifier SIM */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier la SIM</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Numéro de téléphone</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+243 XX XXX XXXX"
              placeholderTextColor="#64748B"
              value={editPhoneNumber}
              onChangeText={setEditPhoneNumber}
              autoFocus
            />

            <Text style={styles.inputLabel}>Services souscrits</Text>
            <Text style={styles.inputLabelHint}>Sélectionnez les services à activer</Text>
            <SIMServiceConfig
              enabledServices={editServices}
              onToggle={handleToggleEditService}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleEditSim} activeOpacity={0.7}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
  },
  mainTablet: {
    flexDirection: 'row',
  },
  listPanel: {
    flex: 1,
  },
  listPanelTablet: {
    flex: 0.4,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  listCount: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  listScroll: {
    padding: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 40,
  },
  emptyListBox: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  emptyListTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  emptyListText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  detailPanel: {
    flex: 0.6,
    backgroundColor: colors.background,
  },
  emptyDetail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyDetailText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  mobileDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: 54,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileDetailTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },

  // Edit / Delete buttons
  editDeleteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
  },
  editBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
  },
  deleteBtnText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  inputLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs },
  inputLabelHint: { fontSize: fontSize.xs, color: colors.textLight, marginBottom: spacing.sm },
  modalInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    color: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '700', color: colors.background },
});

export default SIMScreen;

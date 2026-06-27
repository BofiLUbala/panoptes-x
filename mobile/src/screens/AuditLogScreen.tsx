import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import { api } from '../services/api';

interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string;
  performed_by: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: '#22c55e', update: '#3b82f6', delete: '#ef4444', login: '#f59e0b', logout: '#64748b',
};

const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  create: 'add-circle', update: 'create', delete: 'trash', login: 'log-in', logout: 'log-out',
};

const AuditLogScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getAuditLogs(200);
      setLogs(data);
    } catch { }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Journal d'audit" subtitle={`${logs.length} entrée(s)`} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune entrée</Text>
            <Text style={styles.emptySubtitle}>Le journal d'audit enregistre toutes les actions financières.</Text>
          </View>
        ) : (
          logs.map((log) => {
            const color = ACTION_COLORS[log.action] || colors.textSecondary;
            const icon = ACTION_ICONS[log.action] || 'ellipse';
            return (
              <TouchableOpacity
                key={log.id}
                style={styles.logCard}
                onPress={() => setSelectedLog(log)}
                activeOpacity={0.7}
              >
                <View style={[styles.logIcon, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon} size={16} color={color} />
                </View>
                <View style={styles.logInfo}>
                  <View style={styles.logTopRow}>
                    <View style={[styles.logActionBadge, { backgroundColor: color + '20' }]}>
                      <Text style={[styles.logActionText, { color }]}>{log.action.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.logEntity}>{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}</Text>
                  </View>
                  <Text style={styles.logUser}>Par: {log.performed_by}</Text>
                  <Text style={styles.logDetails} numberOfLines={1}>{log.details}</Text>
                  <Text style={styles.logTime}>{new Date(log.created_at).toLocaleString('fr-FR')}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!selectedLog} transparent animationType="slide" onRequestClose={() => setSelectedLog(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            {selectedLog && (
              <>
                <Text style={styles.sheetTitle}>Détail de l'audit</Text>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Action</Text>
                  <Text style={[styles.sheetValue, { color: ACTION_COLORS[selectedLog.action] || colors.text }]}>
                    {selectedLog.action.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Type d'entité</Text>
                  <Text style={styles.sheetValue}>{selectedLog.entity_type}</Text>
                </View>
                {selectedLog.entity_id && (
                  <View style={styles.sheetRow}>
                    <Text style={styles.sheetLabel}>ID entité</Text>
                    <Text style={styles.sheetValue}>{selectedLog.entity_id}</Text>
                  </View>
                )}
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Utilisateur</Text>
                  <Text style={styles.sheetValue}>{selectedLog.performed_by}</Text>
                </View>
                <View style={styles.sheetDivider} />
                <Text style={styles.sheetLabel}>Détails</Text>
                <View style={styles.sheetDetailsBox}>
                  <Text style={styles.sheetDetailsText}>{selectedLog.details}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Date</Text>
                  <Text style={styles.sheetValue}>{new Date(selectedLog.created_at).toLocaleString('fr-FR')}</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedLog(null)}>
                  <Text style={styles.closeButtonText}>Fermer</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 120 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: 40 },

  logCard: {
    flexDirection: 'row', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  logIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  logInfo: { flex: 1 },
  logTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  logActionBadge: { paddingHorizontal: spacing.sm, paddingVertical: 1, borderRadius: borderRadius.sm },
  logActionText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  logEntity: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  logUser: { fontSize: fontSize.xs, color: colors.textLight, marginBottom: 2 },
  logDetails: { fontSize: fontSize.sm, color: colors.text, marginBottom: 4 },
  logTime: { fontSize: 10, color: colors.textLight },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.border, borderBottomWidth: 0, padding: spacing.lg, paddingBottom: 40,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  sheetLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  sheetValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  sheetDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  sheetDetailsBox: {
    backgroundColor: colors.background, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginVertical: spacing.sm,
  },
  sheetDetailsText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  closeButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  closeButtonText: { color: colors.background, fontWeight: '700', fontSize: fontSize.md },
});

export default AuditLogScreen;

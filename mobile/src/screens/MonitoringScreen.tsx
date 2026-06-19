import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { getGeneralMessages, clearGeneralMessages } from '../services/generalMessages';
import { GeneralMessage } from '../types';
import AppHeader from '../components/AppHeader';

function getOperatorColor(operator: string | null): string {
  switch (operator) {
    case 'AIRTEL': return '#E11B22';
    case 'ORANGE': return '#FF7900';
    case 'VODACOM': return '#00A94F';
    case 'AFRICELL': return '#ED1C24';
    default: return colors.textSecondary;
  }
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ts; }
}

const MonitoringScreen: React.FC = () => {
  const [messages, setMessages] = useState<GeneralMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<GeneralMessage | null>(null);

  const load = useCallback(async () => {
    const msgs = await getGeneralMessages();
    setMessages(msgs);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <View style={styles.container}>
      <AppHeader title="Messages généraux" subtitle={`${messages.length} message(s)`} />

      {messages.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={async () => {
          await clearGeneralMessages();
          setMessages([]);
        }} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
          <Text style={styles.clearBtnText}>Tout effacer</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbox-ellipses-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucun message</Text>
            <Text style={styles.emptySubtitle}>
              Les SMS reçus apparaîtront ici automatiquement.
            </Text>
          </View>
        ) : (
          messages.map((msg) => (
            <TouchableOpacity
              key={msg.id}
              style={styles.msgItem}
              onPress={() => setSelectedMsg(msg)}
              activeOpacity={0.7}
            >
              <View style={styles.msgHeader}>
                <View style={[styles.senderDot, { backgroundColor: getOperatorColor(msg.operator) }]} />
                <Text style={styles.msgSender} numberOfLines={1}>{msg.sender}</Text>
                <Text style={styles.msgTime}>{formatTime(msg.timestamp)}</Text>
              </View>
              <Text style={styles.msgBody} numberOfLines={2}>{msg.message}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!selectedMsg}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMsg(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            {selectedMsg && (
              <>
                <View style={styles.sheetHeader}>
                  <View style={[styles.senderBadge, { borderColor: getOperatorColor(selectedMsg.operator) }]}>
                    <Text style={[styles.senderBadgeText, { color: getOperatorColor(selectedMsg.operator) }]}>
                      {selectedMsg.operator || 'INCONNU'}
                    </Text>
                  </View>
                  <Text style={styles.sheetSender}>{selectedMsg.sender}</Text>
                  <Text style={styles.sheetTime}>{formatTime(selectedMsg.timestamp)}</Text>
                </View>
                <View style={styles.sheetBody}>
                  <Text style={styles.sheetMessage}>{selectedMsg.message}</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedMsg(null)}>
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
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.danger + '40',
    backgroundColor: colors.danger + '10',
  },
  clearBtnText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: '600',
  },
  list: { flex: 1 },
  listContent: { padding: spacing.md, paddingBottom: 40 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  msgItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  senderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  msgSender: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  msgTime: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  msgBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: spacing.sm + 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  senderBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  senderBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sheetSender: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  sheetTime: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  sheetBody: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sheetMessage: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});

export default MonitoringScreen;
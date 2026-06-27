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
import { api } from '../services/api';
import { dataCache } from '../services/dataCache';
import { getGeneralMessages } from '../services/generalMessages';
import { GeneralMessage, ForwardedSms } from '../types';
import AppHeader from '../components/AppHeader';

interface DisplayMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  source: 'local' | 'server';
  targetPhone?: string;
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
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<DisplayMessage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLocalMessages();
  }, []);

  async function loadLocalMessages() {
    const localMsgs = await getGeneralMessages();
    const all: DisplayMessage[] = localMsgs.map(m => ({
      id: m.id,
      sender: m.sender,
      message: m.message,
      timestamp: m.timestamp,
      source: 'local' as const,
    }));
    setMessages(all);
    loadServerMessages(all);
  }

  async function loadServerMessages(existing: DisplayMessage[]) {
    try {
      const relations = dataCache.watchRelations.length > 0
        ? dataCache.watchRelations
        : await api.getWatchRelations();
      const activeTargets = relations.filter(r => r.status === 'active');
      for (const rel of activeTargets) {
        const data = await api.getForwardedSms(rel.target_phone);
        for (const sms of data.results) {
          existing.push({
            id: `svr-${sms.id}`,
            sender: sms.sender,
            message: sms.message,
            timestamp: sms.received_at,
            source: 'server' as const,
            targetPhone: sms.target_phone,
          });
        }
      }
      existing.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMessages([...existing]);
    } catch {}
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Messages généraux" subtitle={`${messages.length} message(s)`} />

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbox-ellipses-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucun message</Text>
            <Text style={styles.emptySubtitle}>
              Les SMS captés apparaîtront ici automatiquement.
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
                <View style={[styles.sourceDot, { backgroundColor: msg.source === 'local' ? colors.primary : colors.success }]} />
                <Text style={styles.msgSender} numberOfLines={1}>{msg.sender}</Text>
                {msg.targetPhone && <Text style={styles.msgTarget}>{msg.targetPhone}</Text>}
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
                  <Text style={styles.sheetSender}>{selectedMsg.sender}</Text>
                  {selectedMsg.targetPhone && <Text style={styles.sheetTarget}>{selectedMsg.targetPhone}</Text>}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  msgSender: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  msgTarget: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
    marginLeft: spacing.xs,
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
  sheetSender: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  sheetTarget: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
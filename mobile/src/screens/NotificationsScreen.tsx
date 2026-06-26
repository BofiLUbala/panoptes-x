import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import { api } from '../services/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  transaction: 'swap-horizontal', subscription: 'card', alert: 'warning', system: 'settings', info: 'information-circle',
};
const TYPE_COLORS: Record<string, string> = {
  transaction: colors.primary, subscription: colors.accent, alert: colors.danger, system: colors.textSecondary, info: colors.textLight,
};

const NotificationsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selected, setSelected] = useState<Notification | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getNotifications(100);
      setNotifications(data);
    } catch { }
  }, []);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleMarkRead = async (id: number) => {
    try { await api.markNotificationRead(id); } catch { }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    try { await api.markAllNotificationsRead(); } catch { }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unread = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Notifications" subtitle={`${unread} non lue(s)`} />

      {unread > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Ionicons name="checkmark-done" size={16} color={colors.primary} />
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>Les notifications apparaîtront ici.</Text>
          </View>
        ) : (
          notifications.map((n) => {
            const icon = TYPE_ICONS[n.type] || 'information-circle';
            const color = TYPE_COLORS[n.type] || colors.textLight;
            return (
              <TouchableOpacity
                key={n.id}
                style={[styles.notifCard, !n.is_read && styles.notifCardUnread]}
                onPress={() => { setSelected(n); if (!n.is_read) handleMarkRead(n.id); }}
                activeOpacity={0.7}
              >
                {!n.is_read && <View style={styles.unreadDot} />}
                <View style={[styles.notifIcon, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon} size={18} color={color} />
                </View>
                <View style={styles.notifInfo}>
                  <Text style={[styles.notifTitle, !n.is_read && styles.notifTitleUnread]}>{n.title}</Text>
                  <Text style={styles.notifMsg} numberOfLines={2}>{n.message}</Text>
                  <Text style={styles.notifTime}>{new Date(n.created_at).toLocaleString('fr-FR')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            {selected && (
              <>
                <View style={[styles.sheetIconBox, { backgroundColor: (TYPE_COLORS[selected.type] || colors.textLight) + '20' }]}>
                  <Ionicons name={TYPE_ICONS[selected.type] || 'information-circle'} size={32} color={TYPE_COLORS[selected.type] || colors.textLight} />
                </View>
                <Text style={styles.sheetTitle}>{selected.title}</Text>
                <Text style={styles.sheetTime}>{new Date(selected.created_at).toLocaleString('fr-FR')}</Text>
                <View style={styles.sheetBody}>
                  <Text style={styles.sheetMessage}>{selected.message}</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
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
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm, marginHorizontal: spacing.md,
  },
  markAllText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: 40 },

  notifCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm, position: 'relative',
  },
  notifCardUnread: { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' },
  unreadDot: { position: 'absolute', top: 12, left: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  notifIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  notifTitleUnread: { fontWeight: '800' },
  notifMsg: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  notifTime: { fontSize: 10, color: colors.textLight, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.border, borderBottomWidth: 0, padding: spacing.lg, paddingBottom: 40,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  sheetIconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sheetTime: { fontSize: fontSize.xs, color: colors.textLight, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
  sheetBody: {
    backgroundColor: colors.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.md,
  },
  sheetMessage: { fontSize: fontSize.sm, color: colors.text, lineHeight: 22 },
  closeButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  closeButtonText: { color: colors.background, fontWeight: '700', fontSize: fontSize.md },
});

export default NotificationsScreen;

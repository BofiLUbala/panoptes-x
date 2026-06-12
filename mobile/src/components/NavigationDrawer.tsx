import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useDrawer } from '../contexts/DrawerContext';
import AppLogo from './AppLogo';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.75;

interface DrawerItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

interface NavigationDrawerProps {
  items: DrawerItem[];
}

const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ items }) => {
  const { isOpen, close } = useDrawer();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, fadeAnim]);

  if (!isOpen) return null;

  const sections = [
    {
      title: 'Navigation',
      items: items.filter((i) => !i.danger),
    },
    {
      title: 'Système',
      items: items.filter((i) => i.danger),
    },
  ].filter((s) => s.items.length > 0);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      <Animated.View
        style={[styles.overlay, { opacity: fadeAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.drawerHeader}>
          <View style={styles.drawerBrand}>
            <View style={styles.drawerLogo}>
              <AppLogo size={28} />
            </View>
            <View>
              <Text style={styles.drawerTitle}>PANOPTES-X</Text>
              <Text style={styles.drawerSubtitle}>Console de pilotage</Text>
            </View>
          </View>
          <TouchableOpacity onPress={close} style={styles.closeButton} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {sections.map((section, sIdx) => (
          <View key={section.title}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            {section.items.map((item, iIdx) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.drawerItem,
                  iIdx < section.items.length - 1 && styles.drawerItemBorder,
                ]}
                onPress={() => {
                  close();
                  item.onPress();
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.danger ? colors.warning : colors.textSecondary}
                  style={styles.drawerIcon}
                />
                <Text
                  style={[
                    styles.drawerItemText,
                    item.danger && { color: colors.warning },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            {sIdx < sections.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        <View style={styles.drawerFooter}>
          <Text style={styles.footerText}>v1.0.0</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.surface,
    paddingTop: 54,
    paddingBottom: spacing.xl,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  drawerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  drawerLogo: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  drawerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  drawerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
  },
  drawerItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  drawerIcon: {
    marginRight: spacing.md,
  },
  drawerItemText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  drawerFooter: {
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
});

export default NavigationDrawer;

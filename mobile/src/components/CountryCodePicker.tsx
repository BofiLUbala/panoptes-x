import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

const COUNTRIES: CountryCode[] = [
  { code: '+243', country: 'RDC', flag: '🇨🇩' },
  { code: '+242', country: 'Congo-Brazzaville', flag: '🇨🇬' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+257', country: 'Burundi', flag: '🇧🇮' },
  { code: '+256', country: 'Ouganda', flag: '🇺🇬' },
  { code: '+244', country: 'Angola', flag: '🇦🇴' },
  { code: '+260', country: 'Zambie', flag: '🇿🇲' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+32', country: 'Belgique', flag: '🇧🇪' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
];

interface CountryCodePickerProps {
  selectedCode: string;
  onSelectCode: (code: string) => void;
}

const CountryCodePicker: React.FC<CountryCodePickerProps> = ({ selectedCode, onSelectCode }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedCountry = COUNTRIES.find((c) => c.code === selectedCode) || COUNTRIES[0];

  const handleSelect = (code: string) => {
    onSelectCode(code);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.pickerButton} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flagText}>{selectedCountry.flag}</Text>
        <Text style={styles.codeText}>{selectedCountry.code}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textLight} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Indicatif du pays</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code + item.country}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.countryItem} 
                  onPress={() => handleSelect(item.code)}
                >
                  <Text style={styles.itemFlag}>{item.flag}</Text>
                  <Text style={styles.itemCountry}>{item.country}</Text>
                  <Text style={styles.itemCode}>{item.code}</Text>
                  {item.code === selectedCode && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    gap: 4,
  },
  flagText: {
    fontSize: 16,
  },
  codeText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemFlag: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  itemCountry: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  itemCode: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: spacing.md,
  },
});

export default CountryCodePicker;

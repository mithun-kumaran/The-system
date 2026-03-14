import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';

interface ReminderPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (offsetMinutes: number) => void;
  currentOffset: number;
}

const OPTIONS = [
  { label: '10 minutes before', value: 10 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
];

export const ReminderPickerModal = ({ visible, onClose, onSelect, currentOffset }: ReminderPickerModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.container}>
          <Text style={styles.title}>Reminder Time</Text>
          {OPTIONS.map(opt => (
              <TouchableOpacity 
                key={opt.value} 
                style={[styles.option, currentOffset === opt.value && styles.selectedOption]}
                onPress={() => {
                    onSelect(opt.value);
                    onClose();
                }}
              >
                  <Text style={[styles.optionText, currentOffset === opt.value && styles.selectedOptionText]}>
                      {opt.label}
                  </Text>
                  {currentOffset === opt.value && (
                      <View style={styles.checkCircle} />
                  )}
              </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.l,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.white,
    fontSize: FONTS.h3,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  option: {
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
      // Highlight background if desired, or just text
  },
  optionText: {
    color: COLORS.textDim,
    fontSize: 18,
  },
  selectedOptionText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  checkCircle: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: COLORS.white,
  },
  closeButton: {
      alignItems: 'center',
      padding: SPACING.m,
      marginTop: SPACING.m,
  },
  closeText: {
      color: COLORS.textDim,
      fontSize: 16,
  },
});

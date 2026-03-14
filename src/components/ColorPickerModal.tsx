import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';

interface ColorPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (color: string) => void;
}

const COLORS_LIST = [
  '#FF453A', '#FF9F0A', '#FFD60A', '#3CAE74', '#66D4CF', 
  '#40C8E0', '#64D2FF', '#0A84FF', '#5E5CE6', '#BF5AF2', 
  '#FF375F', '#AC8E68', '#98989D', '#8E8E93', '#FEF8EF'
];

export const ColorPickerModal = ({ visible, onClose, onSelect }: ColorPickerModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.container}>
          <Text style={styles.title}>Select Color</Text>
          <View style={styles.grid}>
              {COLORS_LIST.map(color => (
                  <TouchableOpacity 
                    key={color} 
                    style={[styles.colorItem, { backgroundColor: color }]}
                    onPress={() => {
                        onSelect(color);
                        onClose();
                    }}
                  />
              ))}
          </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    marginBottom: SPACING.l,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  closeButton: {
      alignItems: 'center',
      padding: SPACING.m,
  },
  closeText: {
      color: COLORS.textDim,
      fontSize: 16,
  },
});

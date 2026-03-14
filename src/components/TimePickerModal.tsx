import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, FONTS } from '../constants/theme';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (time: string) => void;
  initialTime: string; // HH:mm
  title: string;
}

export const TimePickerModal = ({ visible, onClose, onSave, initialTime, title }: TimePickerModalProps) => {
  const [date, setDate] = useState(() => {
    const d = new Date();
    const [h, m] = initialTime.split(':').map(Number);
    d.setHours(h || 9);
    d.setMinutes(m || 0);
    return d;
  });

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
        if (event.type === 'set' && selectedDate) {
            const h = selectedDate.getHours().toString().padStart(2, '0');
            const m = selectedDate.getMinutes().toString().padStart(2, '0');
            onSave(`${h}:${m}`);
        }
        onClose();
    } else {
        if (selectedDate) setDate(selectedDate);
    }
  };

  const handleIOSSave = () => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    onSave(`${h}:${m}`);
    onClose();
  };

  if (Platform.OS === 'android') {
      return visible ? (
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleChange}
          />
      ) : null;
  }

  // iOS Custom Modal
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleIOSSave}>
                <Text style={styles.saveText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerContainer}>
            <DateTimePicker
                value={date}
                mode="time"
                display="spinner"
                onChange={handleChange}
                textColor="#FEF8EF"
                themeVariant="dark"
            />
          </View>
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  title: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelText: {
    color: COLORS.textDim,
    fontSize: 16,
  },
  saveText: {
    color: COLORS.primary, // White or Accent
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
  },
});

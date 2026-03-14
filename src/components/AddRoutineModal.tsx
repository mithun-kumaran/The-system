import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { v4 as uuidv4 } from 'uuid';
import { TimePickerModal } from './TimePickerModal';

interface DayConfig {
  dayIndex: number;
  startTime: string;
  endTime: string;
}

interface RoutineStep {
  id: string;
  label: string;
}

interface AddRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (routineData: any) => void;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const AddRoutineModal = ({ visible, onClose, onSave }: AddRoutineModalProps) => {
  const [title, setTitle] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayConfigs, setDayConfigs] = useState<Map<number, DayConfig>>(new Map());
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [newStep, setNewStep] = useState('');
  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);

  const toggleDay = (index: number) => {
    const next = [...selectedDays];
    if (next.includes(index)) {
      next.splice(next.indexOf(index), 1);
      const dc = new Map(dayConfigs);
      dc.delete(index);
      setDayConfigs(dc);
    } else {
      next.push(index);
      const dc = new Map(dayConfigs);
      dc.set(index, { dayIndex: index, startTime, endTime });
      setDayConfigs(dc);
    }
    next.sort();
    setSelectedDays(next);
  };

  const addStep = () => {
    const label = newStep.trim();
    if (!label) return;
    setSteps([...steps, { id: uuidv4(), label }]);
    setNewStep('');
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) return;
    const next = [...steps];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = next[swapIndex];
    next[swapIndex] = next[index];
    next[index] = temp;
    setSteps(next);
  };

  const removeStep = (index: number) => {
    const next = [...steps];
    next.splice(index, 1);
    setSteps(next);
  };

  const isValid = title.length > 0 && selectedDays.length > 0 && steps.length > 0;

  const handleSave = () => {
    if (!isValid) {
      Alert.alert('Error', 'Please add a title, days, and at least one step');
      return;
    }

    const configs = selectedDays.map(d => dayConfigs.get(d)).filter(c => !!c) as DayConfig[];

    onSave({
      id: uuidv4(),
      title,
      steps,
      configs
    });

    setTitle('');
    setSelectedDays([]);
    setDayConfigs(new Map());
    setSteps([]);
    setNewStep('');
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onDismiss={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Routine</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
            disabled={!isValid}
          >
            <Text style={[styles.saveButtonText, !isValid && styles.saveButtonTextDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Routine title"
            placeholderTextColor={COLORS.textDim}
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Start</Text>
              <TouchableOpacity style={styles.input} onPress={() => setStartTimePickerVisible(true)}>
                <Text style={{ color: COLORS.white, fontSize: 16 }}>{startTime}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>End</Text>
              <TouchableOpacity style={styles.input} onPress={() => setEndTimePickerVisible(true)}>
                <Text style={{ color: COLORS.white, fontSize: 16 }}>{endTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Days</Text>
          <View style={styles.daysContainer}>
            {DAYS.map((d, i) => (
              <TouchableOpacity 
                key={i} 
                style={[styles.dayBubble, selectedDays.includes(i) && styles.dayBubbleActive]}
                onPress={() => toggleDay(i)}
              >
                <Text style={[styles.dayText, selectedDays.includes(i) && styles.dayTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Steps</Text>
          <View style={styles.newStepRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Add a step"
              placeholderTextColor={COLORS.textDim}
              value={newStep}
              onChangeText={setNewStep}
            />
            <TouchableOpacity style={styles.addStepButton} onPress={addStep}>
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.background} />
            </TouchableOpacity>
          </View>

          {steps.map((s, index) => (
            <View key={s.id} style={styles.stepRow}>
              <View style={styles.stepOrder}>
                <Text style={styles.stepOrderText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepLabel}>{s.label}</Text>
              <View style={styles.stepActions}>
                <TouchableOpacity onPress={() => moveStep(index, 'up')} style={styles.stepActionButton}>
                  <MaterialCommunityIcons name="arrow-up" size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveStep(index, 'down')} style={styles.stepActionButton}>
                  <MaterialCommunityIcons name="arrow-down" size={18} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeStep(index)} style={styles.stepActionButton}>
                  <MaterialCommunityIcons name="delete-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        
        <TimePickerModal
          visible={startTimePickerVisible}
          onClose={() => setStartTimePickerVisible(false)}
          onSave={(t) => setStartTime(t)}
          initialTime={startTime}
          title="Start Time"
        />
        <TimePickerModal
          visible={endTimePickerVisible}
          onClose={() => setEndTimePickerVisible(false)}
          onSave={(t) => setEndTime(t)}
          initialTime={endTime}
          title="End Time"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  title: {
    fontSize: FONTS.h1,
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#3A3A3C',
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  saveButtonTextDisabled: {
    color: COLORS.textDim,
  },
  scrollContent: {
    padding: SPACING.l,
    paddingBottom: 50,
  },
  label: {
    color: COLORS.textDim,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.white,
    padding: SPACING.m,
    borderRadius: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.s,
  },
  dayBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBubbleActive: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  dayTextActive: {
    color: COLORS.background,
  },
  newStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  addStepButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: 12,
    marginTop: SPACING.s,
  },
  stepOrder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.s,
  },
  stepOrderText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  stepLabel: {
    color: COLORS.white,
    flex: 1,
  },
  stepActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepActionButton: {
    paddingHorizontal: 8,
  },
});

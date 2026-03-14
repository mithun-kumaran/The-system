import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  Switch, 
  ScrollView, 
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { TimeBlock, BlockType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LocationSearchModal } from './LocationSearchModal';
import { TimePickerModal } from './TimePickerModal';
import { ColorPickerModal } from './ColorPickerModal';
import { ReminderPickerModal } from './ReminderPickerModal';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (habitData: any) => void;
}

interface DayConfig {
  dayIndex: number; // 0=Sun, 1=Mon, etc.
  startTime: string;
  endTime: string;
  location: string;
  isAllDay: boolean;
}

interface Tag {
  id: string;
  label: string;
  color: string;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DEFAULT_TAGS: Tag[] = [
  { id: '1', label: 'Health', color: '#FF453A' },
  { id: '2', label: 'Work', color: '#3CAE74' },
  { id: '3', label: 'Learning', color: '#0A84FF' },
  { id: '4', label: 'Mindfulness', color: '#BF5AF2' },
];

export const AddHabitModal = ({ visible, onClose, onSave }: AddHabitModalProps) => {
  const [habitType, setHabitType] = useState<'maintenance' | 'growth' | 'quit'>('maintenance');
  const [title, setTitle] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayConfigs, setDayConfigs] = useState<Map<number, DayConfig>>(new Map());
  
  // Tag State
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState('#FF453A');

  // Color State
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [customColor, setCustomColor] = useState<string | null>(null);

  // Reminder State
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderOffset, setReminderOffset] = useState(30); // Default 30s as per original, or minutes
  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState(false);
  
  // Location Modal State
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null); // Which day are we editing
  
  // Time Picker State
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'startTime' | 'endTime'>('startTime');
  const [currentTimeValue, setCurrentTimeValue] = useState('09:00');

  const toggleDay = (index: number) => {
    const newSelected = [...selectedDays];
    if (newSelected.includes(index)) {
      // Remove
      const i = newSelected.indexOf(index);
      newSelected.splice(i, 1);
      const newConfigs = new Map(dayConfigs);
      newConfigs.delete(index);
      setDayConfigs(newConfigs);
    } else {
      // Add
      newSelected.push(index);
      const newConfigs = new Map(dayConfigs);
      newConfigs.set(index, {
        dayIndex: index,
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        isAllDay: false
      });
      setDayConfigs(newConfigs);
    }
    newSelected.sort();
    setSelectedDays(newSelected);
  };

  const updateDayConfig = (dayIndex: number, field: keyof DayConfig, value: any) => {
    const newConfigs = new Map(dayConfigs);
    const config = newConfigs.get(dayIndex);
    if (config) {
      newConfigs.set(dayIndex, { ...config, [field]: value });
      setDayConfigs(newConfigs);
    }
  };

  const openLocationSearch = (dayIndex: number) => {
      setActiveDayIndex(dayIndex);
      setIsLocationModalVisible(true);
  };

  const openTimePicker = (dayIndex: number, field: 'startTime' | 'endTime', currentValue: string) => {
      setActiveDayIndex(dayIndex);
      setActiveTimeField(field);
      setCurrentTimeValue(currentValue);
      setIsTimePickerVisible(true);
  };

  const handleTimeSave = (time: string) => {
      if (activeDayIndex !== null) {
          updateDayConfig(activeDayIndex, activeTimeField, time);
      }
  };

  const handleLocationSelect = (loc: string) => {
      if (activeDayIndex !== null) {
          updateDayConfig(activeDayIndex, 'location', loc);
      }
  };

  const isValid = title.length > 0 && selectedDays.length > 0;

  const handleSave = () => {
    if (!isValid) return;

    // Prepare data
    const configs = selectedDays.map(d => dayConfigs.get(d)).filter(c => c !== undefined) as DayConfig[];
    
    onSave({
      id: uuidv4(),
      title,
      type: habitType,
      configs,
      tag: selectedTag,
      color: customColor || selectedTag?.color,
      reminder: reminderEnabled,
      reminderOffset: reminderEnabled ? reminderOffset : 0,
      isHabit: true
    });
    
    // Reset
    setTitle('');
    setSelectedDays([]);
    setDayConfigs(new Map());
    setCustomColor(null);
    setReminderEnabled(false);
    onClose();
  };

  const renderDayConfig = (dayIndex: number) => {
    const config = dayConfigs.get(dayIndex);
    if (!config) return null;
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];

    return (
      <View key={dayIndex} style={styles.dayConfigContainer}>
        <View style={styles.dayConfigHeader}>
          <Text style={styles.dayConfigTitle}>{dayName}</Text>
          <Switch 
            value={config.isAllDay} 
            onValueChange={(v) => updateDayConfig(dayIndex, 'isAllDay', v)}
            trackColor={{ false: '#3A3A3C', true: COLORS.success }}
            thumbColor={COLORS.white}
          />
        </View>

        {!config.isAllDay && (
          <View style={styles.timeRow}>
            <TouchableOpacity 
                style={styles.timeInputContainer}
                onPress={() => openTimePicker(dayIndex, 'startTime', config.startTime)}
            >
              <Text style={styles.labelSmall}>Start</Text>
              <View style={styles.timeInput}>
                  <Text style={styles.timeText}>{config.startTime}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.timeInputContainer}
                onPress={() => openTimePicker(dayIndex, 'endTime', config.endTime)}
            >
              <Text style={styles.labelSmall}>End</Text>
              <View style={styles.timeInput}>
                  <Text style={styles.timeText}>{config.endTime}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.locationContainer}>
             <Text style={styles.labelSmall}>Location</Text>
             <TouchableOpacity 
                style={styles.locationInput}
                onPress={() => openLocationSearch(dayIndex)}
             >
                 <Text style={[styles.locationText, !config.location && styles.placeholderText]}>
                     {config.location || "Enter location..."}
                 </Text>
                 <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textDim} />
             </TouchableOpacity>
        </View>
      </View>
    );
  };

  const createNewTag = () => {
      if(newTagLabel) {
          const newTag = { id: uuidv4(), label: newTagLabel, color: newTagColor };
          setTags([...tags, newTag]);
          setSelectedTag(newTag);
          setNewTagLabel('');
          setIsTagModalVisible(false);
      }
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
          <Text style={styles.title}>Add Habit</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
            disabled={!isValid}
          >
            <Text style={[styles.saveButtonText, !isValid && styles.saveButtonTextDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.textDim} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Type Selector */}
          <View style={styles.typeContainer}>
            <TouchableOpacity 
                style={[styles.typeButton, habitType === 'maintenance' && styles.typeButtonActive]}
                onPress={() => setHabitType('maintenance')}
            >
                <View style={styles.typeHeader}>
                    <Text style={styles.typeTitle}>Maintenance</Text>
                    <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.textDim} 
                        onPress={() => Alert.alert("Maintenance", "Routine tasks to keep you on track. +10xp per week.")}
                    />
                </View>
                <Text style={styles.typeSubtitle}>+10xp per week</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.typeButton, habitType === 'growth' && styles.typeButtonActive]}
                onPress={() => setHabitType('growth')}
            >
                <View style={styles.typeHeader}>
                    <Text style={styles.typeTitle}>Growth</Text>
                    <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.textDim} 
                        onPress={() => Alert.alert("Growth", "Challenging tasks to help you improve. +15xp per week.")}
                    />
                </View>
                <Text style={styles.typeSubtitle}>+15xp per week</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.typeButton, habitType === 'quit' && styles.typeButtonActive]}
                onPress={() => setHabitType('quit')}
            >
                <View style={styles.typeHeader}>
                    <Text style={styles.typeTitle}>Quit</Text>
                    <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.textDim} 
                        onPress={() => Alert.alert("Quit", "Break habits you want to stop. +10xp per week.")}
                    />
                </View>
                <Text style={styles.typeSubtitle}>+10xp per week</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor={COLORS.textDim}
            value={title}
            onChangeText={setTitle}
          />

          {/* Frequency */}
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Frequency</Text>
            <Text style={styles.xpLabel}>+10xp per week</Text>
          </View>
          <View style={styles.daysContainer}>
            {DAYS.map((d, i) => (
                <TouchableOpacity 
                    key={i} 
                    style={[styles.dayBubble, selectedDays.includes(i) && styles.dayBubbleActive]}
                    onPress={() => toggleDay(i)}
                >
                    <Text style={[styles.dayText, { color: COLORS.white }, selectedDays.includes(i) && styles.dayTextActive]}>{d}</Text>
                </TouchableOpacity>
            ))}
          </View>

          {/* Per Day Config */}
          {selectedDays.length > 0 && (
              <View style={styles.configSection}>
                  <Text style={styles.label}>Time & Location</Text>
                  {selectedDays.map(d => renderDayConfig(d))}
              </View>
          )}

          {/* Tag & Color */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.optionButton} onPress={() => setIsTagModalVisible(true)}>
                <MaterialCommunityIcons name="tag-outline" size={20} color={COLORS.white} />
                <Text style={styles.optionText}>{selectedTag ? selectedTag.label : 'Tag'}</Text>
                {selectedTag && <View style={[styles.tagDot, { backgroundColor: selectedTag.color }]} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={() => setIsColorPickerVisible(true)}>
                <View style={[styles.colorCircle, { backgroundColor: customColor || selectedTag?.color || '#FF453A' }]} />
                <Text style={styles.optionText}>Colour</Text>
            </TouchableOpacity>
          </View>

          {/* Reminder */}
          <View style={styles.reminderContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.label}>Reminder</Text>
                  {reminderEnabled && (
                      <TouchableOpacity onPress={() => setIsReminderPickerVisible(true)} style={{ marginLeft: 10 }}>
                          <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>
                              {reminderOffset === 60 ? '1 hr before' : `${reminderOffset}m before`}
                          </Text>
                      </TouchableOpacity>
                  )}
              </View>
              <Switch 
                value={reminderEnabled} 
                onValueChange={(val) => {
                    setReminderEnabled(val);
                    if (val) setIsReminderPickerVisible(true);
                }}
                trackColor={{ false: '#3A3A3C', true: COLORS.success }}
                thumbColor={COLORS.white}
              />
          </View>

        </ScrollView>

        {/* Modals */}
        <LocationSearchModal 
            visible={isLocationModalVisible} 
            onClose={() => setIsLocationModalVisible(false)}
            onSelect={handleLocationSelect}
            initialValue={activeDayIndex !== null ? dayConfigs.get(activeDayIndex)?.location : ''}
        />

        <TimePickerModal
            visible={isTimePickerVisible}
            onClose={() => setIsTimePickerVisible(false)}
            onSave={handleTimeSave}
            initialTime={currentTimeValue}
            title={activeTimeField === 'startTime' ? 'Start Time' : 'End Time'}
        />

        <ColorPickerModal
            visible={isColorPickerVisible}
            onClose={() => setIsColorPickerVisible(false)}
            onSelect={setCustomColor}
        />

        <ReminderPickerModal
            visible={isReminderPickerVisible}
            onClose={() => setIsReminderPickerVisible(false)}
            onSelect={setReminderOffset}
            currentOffset={reminderOffset}
        />

        {/* Tag Selection Modal */}
        <Modal visible={isTagModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Tag</Text>
                    <FlatList
                      data={tags}
                      keyExtractor={item => item.id}
                      renderItem={({item}) => (
                          <TouchableOpacity 
                              style={styles.tagItem} 
                              onPress={() => {
                                  setSelectedTag(item);
                                  setIsTagModalVisible(false);
                              }}
                          >
                              <View style={[styles.tagDot, { backgroundColor: item.color }]} />
                              <Text style={styles.tagLabel}>{item.label}</Text>
                          </TouchableOpacity>
                      )}
                    />
                    <View style={styles.divider} />
                    <Text style={styles.modalSubtitle}>New Tag</Text>
                    <TextInput 
                      style={styles.modalInput} 
                      placeholder="Tag Name" 
                      placeholderTextColor={COLORS.textDim}
                      value={newTagLabel}
                      onChangeText={setNewTagLabel}
                    />
                    <View style={styles.colorRow}>
                        {['#FF453A', '#3CAE74', '#0A84FF', '#BF5AF2', '#FF9F0A'].map(c => (
                            <TouchableOpacity 
                              key={c} 
                              style={[styles.colorOption, { backgroundColor: c }, newTagColor === c && styles.colorOptionActive]}
                              onPress={() => setNewTagColor(c)}
                            />
                        ))}
                    </View>
                    <TouchableOpacity style={styles.createTagButton} onPress={createNewTag}>
                        <Text style={styles.createTagText}>Create Tag</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setIsTagModalVisible(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 20,
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
  closeButton: {
      position: 'absolute',
      right: SPACING.l,
      top: SPACING.m + 50, // Below header
      zIndex: 10,
      display: 'none' 
  },
  scrollContent: {
    padding: SPACING.l,
    paddingBottom: 50,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.l,
  },
  typeButton: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    borderColor: COLORS.success,
    backgroundColor: '#1C1C1E', // Slightly lighter
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  typeSubtitle: {
    color: COLORS.success,
    fontSize: 12,
  },
  label: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.s,
    marginTop: SPACING.m,
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.white,
    padding: SPACING.m,
    borderRadius: 12,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
  },
  xpLabel: {
    color: COLORS.success,
    fontSize: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  dayBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.textDim,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dayBubbleActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  dayText: {
    // color: COLORS.textDim, // Handled inline for dynamic switch, but requested ALL WHITE
    fontWeight: '600',
  },
  dayTextActive: {
    color: COLORS.black,
  },
  configSection: {
    marginBottom: SPACING.m,
  },
  dayConfigContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: 12,
    marginBottom: SPACING.s,
  },
  dayConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  dayConfigTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  timeInputContainer: {
    width: '48%',
  },
  labelSmall: {
    color: COLORS.textDim,
    fontSize: 12,
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeText: {
      color: COLORS.white,
      fontSize: 16,
  },
  locationContainer: {
      marginTop: 8,
  },
  locationInput: {
      backgroundColor: COLORS.background,
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  locationText: {
      color: COLORS.white,
      fontSize: 16,
  },
  placeholderText: {
      color: COLORS.textDim,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.l,
  },
  optionButton: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optionText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reminderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: SPACING.l,
      marginBottom: SPACING.xl,
  },
  
  // Tag Modal Styles
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: SPACING.l,
  },
  modalContent: {
      backgroundColor: COLORS.surface,
      borderRadius: 20,
      padding: SPACING.l,
      maxHeight: '80%',
  },
  modalTitle: {
      color: COLORS.white,
      fontSize: FONTS.h2,
      marginBottom: SPACING.m,
      textAlign: 'center',
  },
  tagItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.m,
      borderBottomWidth: 1,
      borderBottomColor: '#2C2C2E',
  },
  tagLabel: {
      color: COLORS.white,
      marginLeft: SPACING.m,
      fontSize: 16,
  },
  divider: {
      height: 1,
      backgroundColor: '#2C2C2E',
      marginVertical: SPACING.l,
  },
  modalSubtitle: {
      color: COLORS.textDim,
      fontSize: 14,
      marginBottom: SPACING.m,
  },
  modalInput: {
      backgroundColor: COLORS.background,
      color: COLORS.white,
      padding: SPACING.m,
      borderRadius: 12,
      marginBottom: SPACING.m,
  },
  colorRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: SPACING.l,
  },
  colorOption: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: 'transparent',
  },
  colorOptionActive: {
      borderColor: COLORS.white,
  },
  createTagButton: {
      backgroundColor: COLORS.white,
      padding: SPACING.m,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: SPACING.m,
  },
  createTagText: {
      color: COLORS.black,
      fontWeight: 'bold',
  },
  cancelButton: {
      alignItems: 'center',
  },
  cancelText: {
      color: COLORS.textDim,
  },
});

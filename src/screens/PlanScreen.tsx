import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { StorageService } from '../services/storage';
import { TimeBlock, BlockType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AddHabitModal } from '../components/AddHabitModal';
import { AddRoutineModal } from '../components/AddRoutineModal';
import { TimePickerModal } from '../components/TimePickerModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PressScale = ({
  onPress,
  children,
  style,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <AnimatedTouchable
      onPress={onPress}
      activeOpacity={0.9}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedTouchable>
  );
};

const GOAL_CATEGORIES = [
  { id: 'Fitness', options: ['Strength', 'Physique', 'Weight'] },
  { id: 'Academic', options: ['Grades', 'Exams'] },
  { id: 'Career', options: ['Projects', 'Applications'] },
  { id: 'Financial', options: [] },
  { id: 'Personal', options: ['Sleep', 'Confidence', 'Discipline'] },
];

const GOAL_HORIZONS = ['short', 'medium', 'long'];
const GOAL_PRIORITIES = ['low', 'medium', 'high'];
const GOAL_MEASURABILITY = ['clear', 'vague'];

const WORKOUT_TYPES = [
  { id: 'strength', label: 'Strength training' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'sport', label: 'Sport' },
  { id: 'mobility', label: 'Mobility / rehab' },
];

const COMMITMENT_TYPES = ['work', 'school', 'religious', 'family', 'other'];
const EXTERNAL_INPUT_TYPES = ['Google Calendar', 'Notion', 'School portal', 'Other'];

export const PlanScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  
  // Generic Modal/Form State
  const [isFormVisible, setFormVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  
  // Habit Modal State
  const [isHabitModalVisible, setHabitModalVisible] = useState(false);
  const [isRoutineModalVisible, setRoutineModalVisible] = useState(false);
  
  // Form Fields
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<BlockType>('work');
  const [formMode, setFormMode] = useState<'goal' | 'task' | 'event' | 'workout' | 'deadline' | 'commitment'>('task');

  const [goalCategory, setGoalCategory] = useState('');
  const [goalFocus, setGoalFocus] = useState('');
  const [goalTimeHorizon, setGoalTimeHorizon] = useState<'short' | 'medium' | 'long' | ''>('');
  const [goalPriority, setGoalPriority] = useState<'low' | 'medium' | 'high' | ''>('');
  const [goalMeasurability, setGoalMeasurability] = useState<'clear' | 'vague' | ''>('');

  const [workoutType, setWorkoutType] = useState<'strength' | 'cardio' | 'sport' | 'mobility' | ''>('');
  const [workoutExercises, setWorkoutExercises] = useState<Array<{ id: string; name: string; sets?: number; reps?: number; durationMinutes?: number }>>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState('');
  const [newExerciseReps, setNewExerciseReps] = useState('');
  const [newExerciseDuration, setNewExerciseDuration] = useState('');
  const [workoutDurationMin, setWorkoutDurationMin] = useState('');
  const [workoutDurationMax, setWorkoutDurationMax] = useState('');

  const [deadlineDate, setDeadlineDate] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [currentDateValue, setCurrentDateValue] = useState(new Date());

  const [commitmentType, setCommitmentType] = useState('');
  const [externalInputs, setExternalInputs] = useState<Array<{ id: string; type: string; url: string }>>([]);
  const [externalInputType, setExternalInputType] = useState(EXTERNAL_INPUT_TYPES[0]);
  const [externalInputUrl, setExternalInputUrl] = useState('');
  
  // Time Picker State (Generic Form)
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'startTime' | 'endTime'>('startTime');
  const [currentTimeValue, setCurrentTimeValue] = useState('09:00');

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const data = await StorageService.getSchedule();
    setSchedule(data);
  };

  const handleAction = (actionType: string) => {
    // Reset form
    setTitle('');
    setGoalCategory('');
    setGoalFocus('');
    setGoalTimeHorizon('');
    setGoalPriority('');
    setGoalMeasurability('');
    setWorkoutType('');
    setWorkoutExercises([]);
    setNewExerciseName('');
    setNewExerciseSets('');
    setNewExerciseReps('');
    setNewExerciseDuration('');
    setWorkoutDurationMin('');
    setWorkoutDurationMax('');
    setDeadlineDate('');
    setCommitmentType('');
    setExternalInputs([]);
    setExternalInputType(EXTERNAL_INPUT_TYPES[0]);
    setExternalInputUrl('');
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    const formatTime = (d: Date) => d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    
    setStartTime(formatTime(now));
    setEndTime(formatTime(nextHour));
    const initialDate = route.params?.initialDate;
    setDateValue(initialDate || '');
    if (initialDate) {
      const parsed = parseISO(initialDate);
      if (!Number.isNaN(parsed.getTime())) setCurrentDateValue(parsed);
    }
    setEditingBlock(null);

    switch(actionType) {
        case 'habit':
            setHabitModalVisible(true);
            return; // Exit early as we use a different modal
        case 'routine':
            setRoutineModalVisible(true);
            return;
        case 'goal':
            setType('work');
            setFormMode('goal');
            break;
        case 'task':
            setType('work');
            setFormMode('task');
            break;
        case 'event':
            setType('other');
            setFormMode('event');
            break;
        case 'workout':
            setType('routine');
            setFormMode('workout');
            break;
        case 'deadline':
            setType('other');
            setFormMode('deadline');
            break;
        case 'commitment':
            setType('other');
            setFormMode('commitment');
            break;
    }
    setFormVisible(true);
  };

  useEffect(() => {
    const action = route.params?.initialAction;
    if (action) {
      handleAction(action);
    }
  }, [route.params?.initialAction]);

  useEffect(() => {
    const initialDate = route.params?.initialDate;
    if (!initialDate) return;
    setDateValue(initialDate);
    const parsed = parseISO(initialDate);
    if (!Number.isNaN(parsed.getTime())) setCurrentDateValue(parsed);
  }, [route.params?.initialDate]);

  useEffect(() => {
    const block = route.params?.editingBlock as TimeBlock | undefined;
    if (!block || block.isHabit || block.isRoutine) return;
    setEditingBlock(block);
    setTitle(block.title || '');
    setStartTime(block.startTime || '');
    setEndTime(block.endTime || '');
    setType(block.type || 'work');
    const initialDateValue = block.date || block.deadlineDate || '';
    setDateValue(initialDateValue);
    if (initialDateValue) {
      const parsed = parseISO(initialDateValue);
      if (!Number.isNaN(parsed.getTime())) setCurrentDateValue(parsed);
    }
    if (block.goalCategory) {
      setFormMode('goal');
      setGoalCategory(block.goalCategory);
      setGoalFocus(block.goalFocus || '');
      setGoalTimeHorizon((block.goalTimeHorizon as any) || '');
      setGoalPriority((block.goalPriority as any) || '');
      setGoalMeasurability((block.goalMeasurability as any) || '');
    } else if (block.workoutType) {
      setFormMode('workout');
      setWorkoutType(block.workoutType as any);
      setWorkoutExercises(block.workoutExercises || []);
      setWorkoutDurationMin(block.workoutDurationMin ? String(block.workoutDurationMin) : '');
      setWorkoutDurationMax(block.workoutDurationMax ? String(block.workoutDurationMax) : '');
    } else if (block.deadlineDate) {
      setFormMode('deadline');
      setDeadlineDate(block.deadlineDate);
      setExternalInputs(block.externalInputs || []);
    } else if (block.commitmentType) {
      setFormMode('commitment');
      setCommitmentType(block.commitmentType);
      setExternalInputs(block.externalInputs || []);
    } else if (block.type === 'other') {
      setFormMode('event');
    } else {
      setFormMode('task');
    }
    setFormVisible(true);
  }, [route.params?.editingBlock]);

  const addExercise = () => {
    const name = newExerciseName.trim();
    if (!name) return;
    const setsValue = parseInt(newExerciseSets, 10);
    const repsValue = parseInt(newExerciseReps, 10);
    const durationValue = parseInt(newExerciseDuration, 10);
    setWorkoutExercises([
      ...workoutExercises,
      {
        id: uuidv4(),
        name,
        sets: Number.isNaN(setsValue) ? undefined : setsValue,
        reps: Number.isNaN(repsValue) ? undefined : repsValue,
        durationMinutes: Number.isNaN(durationValue) ? undefined : durationValue,
      },
    ]);
    setNewExerciseName('');
    setNewExerciseSets('');
    setNewExerciseReps('');
    setNewExerciseDuration('');
  };

  const removeExercise = (id: string) => {
    setWorkoutExercises(workoutExercises.filter(ex => ex.id !== id));
  };

  const addExternalInput = () => {
    const url = externalInputUrl.trim();
    if (!url) return;
    setExternalInputs([
      ...externalInputs,
      { id: uuidv4(), type: externalInputType, url },
    ]);
    setExternalInputUrl('');
  };

  const removeExternalInput = (id: string) => {
    setExternalInputs(externalInputs.filter(input => input.id !== id));
  };

  const handleSaveGeneric = async () => {
    if (!title || !startTime || !endTime) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        Alert.alert('Error', 'Invalid time format. Use HH:mm (24h)');
        return;
    }

    const newBlock: TimeBlock = {
      id: editingBlock ? editingBlock.id : uuidv4(),
      title,
      startTime,
      endTime,
      type,
      isCompleted: editingBlock?.isCompleted ?? false,
    };
    if (dateValue) {
      newBlock.date = dateValue;
    }

    if (formMode === 'goal') {
      const category = goalCategory.trim();
      const needsFocus = (GOAL_CATEGORIES.find(c => c.id === category)?.options || []).length > 0;
      if (!category || !goalTimeHorizon || !goalPriority || !goalMeasurability || (needsFocus && !goalFocus)) {
        Alert.alert('Error', 'Please complete goal category, horizon, priority, and measurability');
        return;
      }
      newBlock.goalCategory = category;
      newBlock.goalFocus = goalFocus;
      newBlock.goalTimeHorizon = goalTimeHorizon;
      newBlock.goalPriority = goalPriority;
      newBlock.goalMeasurability = goalMeasurability;
    }

    if (formMode === 'workout') {
      if (!workoutType || workoutExercises.length === 0 || !workoutDurationMin || !workoutDurationMax) {
        Alert.alert('Error', 'Please add workout type, exercises, and duration range');
        return;
      }
      newBlock.workoutType = workoutType;
      newBlock.workoutExercises = workoutExercises;
      newBlock.workoutDurationMin = parseInt(workoutDurationMin, 10);
      newBlock.workoutDurationMax = parseInt(workoutDurationMax, 10);
    }

    if (formMode === 'deadline') {
      const resolvedDeadline = deadlineDate.trim() || dateValue;
      if (!resolvedDeadline) {
        Alert.alert('Error', 'Please add a deadline date');
        return;
      }
      newBlock.deadlineDate = resolvedDeadline;
      newBlock.externalInputs = externalInputs;
    }

    if (formMode === 'commitment') {
      if (!commitmentType) {
        Alert.alert('Error', 'Please select a commitment type');
        return;
      }
      newBlock.commitmentType = commitmentType as TimeBlock['commitmentType'];
      newBlock.externalInputs = externalInputs;
    }

    const newSchedule = editingBlock
      ? schedule.map(item => (item.id === editingBlock.id ? newBlock : item))
      : [...schedule, newBlock];
    newSchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

    await StorageService.saveSchedule(newSchedule);
    setSchedule(newSchedule);
    
    // Close everything
    setFormVisible(false);
    navigation.goBack();
  };
  
  const openTimePicker = (field: 'startTime' | 'endTime', current: string) => {
    setActiveTimeField(field);
    setCurrentTimeValue(current || '09:00');
    setIsTimePickerVisible(true);
  };

  const openDatePicker = () => {
    const base = dateValue ? parseISO(dateValue) : new Date();
    if (!Number.isNaN(base.getTime())) {
      setCurrentDateValue(base);
    }
    setIsDatePickerVisible(true);
  };
  
  const handleDateChange = (_event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setIsDatePickerVisible(false);
      if (selected) {
        setDateValue(format(selected, 'yyyy-MM-dd'));
      }
      return;
    }
    if (selected) setCurrentDateValue(selected);
  };

  const handleDateSave = () => {
    setDateValue(format(currentDateValue, 'yyyy-MM-dd'));
    setIsDatePickerVisible(false);
  };

  const getDateLabel = () => {
    if (!dateValue) return 'Add date';
    const parsed = parseISO(dateValue);
    if (Number.isNaN(parsed.getTime())) return dateValue;
    return format(parsed, 'MMM d, yyyy');
  };
  
  const handleTimeSave = (time: string) => {
    if (activeTimeField === 'startTime') setStartTime(time);
    else setEndTime(time);
  };

  const handleSaveHabit = async (habitData: any) => {
      // 1. Save the Habit Definition
      await StorageService.addHabit(habitData);

      // 2. Check if today matches any of the selected days and add to schedule if so
      const todayIndex = new Date().getDay(); // 0=Sun
      const todayConfig = habitData.configs.find((c: any) => c.dayIndex === todayIndex);

      if (todayConfig) {
          const newBlock: TimeBlock = {
              id: uuidv4(),
              title: habitData.title,
              startTime: todayConfig.startTime,
              endTime: todayConfig.endTime,
              type: 'routine', // Habits are routines
              isHabit: true,
              habitType: habitData.type,
              xp: habitData.type === 'growth' ? 15 : 10,
              location: todayConfig.location,
              tagId: habitData.tag?.id,
              tagColor: habitData.tag?.color,
              reminderEnabled: habitData.reminder,
              isCompleted: false
          };
          
          const newSchedule = [...schedule, newBlock];
          newSchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
          await StorageService.saveSchedule(newSchedule);
          setSchedule(newSchedule);
      }

      setHabitModalVisible(false);
      navigation.goBack();
  };

  const handleSaveRoutine = async (routineData: any) => {
      await StorageService.addRoutine(routineData);
      const todayIndex = new Date().getDay();
      const todayConfig = routineData.configs.find((c: any) => c.dayIndex === todayIndex);
      if (todayConfig) {
          const newBlock: TimeBlock = {
              id: uuidv4(),
              title: routineData.title,
              startTime: todayConfig.startTime,
              endTime: todayConfig.endTime,
              type: 'routine',
              isRoutine: true,
              steps: routineData.steps.map((s: any) => ({ id: s.id, label: s.label, isDone: false })),
              isCompleted: false,
          };
          const newSchedule = [...schedule, newBlock];
          newSchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
          await StorageService.saveSchedule(newSchedule);
          setSchedule(newSchedule);
      }
      setRoutineModalVisible(false);
      navigation.goBack();
  };

  const closeAll = () => {
      navigation.goBack();
  };

  return (
    <TouchableOpacity 
        style={styles.container} 
        activeOpacity={1} 
        onPress={closeAll}
    >
      <View style={styles.contentContainer}>
        <View style={styles.gridContainer}>
            <PressScale style={styles.gridButton} onPress={() => handleAction('habit')}>
                <View style={[styles.iconCircle, { backgroundColor: '#2C2C2E' }]}>
                    <MaterialCommunityIcons name="boxing-glove" size={24} color={COLORS.white} />
                </View>
                <Text style={styles.gridLabel}>Start Habit</Text>
            </PressScale>

            <PressScale style={styles.gridButton} onPress={() => handleAction('goal')}>
                <View style={[styles.iconCircle, { backgroundColor: '#2C2C2E' }]}>
                    <MaterialCommunityIcons name="ribbon" size={24} color={COLORS.white} />
                </View>
                <Text style={styles.gridLabel}>Add Goal</Text>
            </PressScale>

            <PressScale style={styles.gridButton} onPress={() => handleAction('task')}>
                <View style={[styles.iconCircle, { backgroundColor: '#2C2C2E' }]}>
                    <MaterialCommunityIcons name="check-circle-outline" size={24} color={COLORS.white} />
                </View>
                <Text style={styles.gridLabel}>New Task</Text>
            </PressScale>

            <PressScale style={styles.gridButton} onPress={() => handleAction('routine')}>
                <View style={[styles.iconCircle, { backgroundColor: '#2C2C2E' }]}>
                    <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={COLORS.white} />
                </View>
                <Text style={styles.gridLabel}>Add Routine</Text>
            </PressScale>

            <PressScale style={styles.gridButton} onPress={() => handleAction('workout')}>
                <View style={[styles.iconCircle, { backgroundColor: '#2C2C2E' }]}>
                    <MaterialCommunityIcons name="dumbbell" size={24} color={COLORS.white} />
                </View>
                <Text style={styles.gridLabel}>Add Workout</Text>
            </PressScale>

            <PressScale style={styles.gridButton} onPress={() => handleAction('event')}>
                <View style={[styles.iconCircle, { backgroundColor: '#2C2C2E' }]}>
                    <MaterialCommunityIcons name="map-marker-outline" size={24} color={COLORS.white} />
                </View>
                <Text style={styles.gridLabel}>New Event</Text>
            </PressScale>

            <PressScale style={styles.gridButton} onPress={() => handleAction('deadline')}>
                <View style={[styles.iconCircle, { backgroundColor: '#2C2C2E' }]}>
                    <MaterialCommunityIcons name="calendar-alert" size={24} color={COLORS.white} />
                </View>
                <Text style={styles.gridLabel}>Add Deadlines</Text>
            </PressScale>

            <PressScale style={styles.gridButton} onPress={() => handleAction('commitment')}>
                <View style={[styles.iconCircle, { backgroundColor: '#2C2C2E' }]}>
                    <MaterialCommunityIcons name="account-multiple-outline" size={24} color={COLORS.white} />
                </View>
                <Text style={styles.gridLabel}>Add Commitments</Text>
            </PressScale>
        </View>

        <PressScale style={styles.closeButton} onPress={closeAll}>
             <MaterialCommunityIcons name="close" size={32} color={COLORS.black} />
        </PressScale>
      </View>

      {/* Generic Form Modal - PageSheet Style */}
      <Modal 
        visible={isFormVisible} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setFormVisible(false)}
        onDismiss={() => setFormVisible(false)}
      >
        <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                    {formMode === 'goal' ? 'Add Goal' :
                     formMode === 'workout' ? 'Add Workout' :
                     formMode === 'deadline' ? 'Add Deadline' :
                     formMode === 'commitment' ? 'Add Commitment' :
                     type === 'routine' ? 'Add Routine' :
                     type === 'other' ? 'New Event' : 'New Task'}
                </Text>
                <TouchableOpacity onPress={handleSaveGeneric} style={styles.sheetSaveButton}>
                    <Text style={styles.sheetSaveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setFormVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textDim} />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.sheetContent}>
                <Text style={styles.label}>Title</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Title" 
                    placeholderTextColor={COLORS.textDim}
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                />
                
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.label}>Start</Text>
                        <TouchableOpacity 
                            style={styles.input} 
                            onPress={() => openTimePicker('startTime', startTime)}
                        >
                            <Text style={{ color: COLORS.white, fontSize: 16 }}>
                                {startTime || '09:00'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.label}>End</Text>
                        <TouchableOpacity 
                            style={styles.input} 
                            onPress={() => openTimePicker('endTime', endTime)}
                        >
                            <Text style={{ color: COLORS.white, fontSize: 16 }}>
                                {endTime || '10:00'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.label}>Date</Text>
                <TouchableOpacity style={styles.input} onPress={openDatePicker}>
                  <Text style={{ color: COLORS.white, fontSize: 16 }}>
                    {getDateLabel()}
                  </Text>
                </TouchableOpacity>

                {formMode === 'goal' && (
                  <>
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.chipRow}>
                      {GOAL_CATEGORIES.map(category => (
                        <TouchableOpacity
                          key={category.id}
                          style={[styles.chip, goalCategory === category.id && styles.chipActive]}
                          onPress={() => {
                            setGoalCategory(category.id);
                            setGoalFocus('');
                          }}
                        >
                          <Text style={[styles.chipText, goalCategory === category.id && styles.chipTextActive]}>{category.id}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {(GOAL_CATEGORIES.find(c => c.id === goalCategory)?.options || []).length > 0 && (
                      <>
                        <Text style={styles.label}>Focus</Text>
                        <View style={styles.chipRow}>
                          {(GOAL_CATEGORIES.find(c => c.id === goalCategory)?.options || []).map(option => (
                            <TouchableOpacity
                              key={option}
                              style={[styles.chip, goalFocus === option && styles.chipActive]}
                              onPress={() => setGoalFocus(option)}
                            >
                              <Text style={[styles.chipText, goalFocus === option && styles.chipTextActive]}>{option}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}

                    <Text style={styles.label}>Time Horizon</Text>
                    <View style={styles.chipRow}>
                      {GOAL_HORIZONS.map(horizon => (
                        <TouchableOpacity
                          key={horizon}
                          style={[styles.chip, goalTimeHorizon === horizon && styles.chipActive]}
                          onPress={() => setGoalTimeHorizon(horizon as 'short' | 'medium' | 'long')}
                        >
                          <Text style={[styles.chipText, goalTimeHorizon === horizon && styles.chipTextActive]}>{horizon}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.label}>Priority</Text>
                    <View style={styles.chipRow}>
                      {GOAL_PRIORITIES.map(priority => (
                        <TouchableOpacity
                          key={priority}
                          style={[styles.chip, goalPriority === priority && styles.chipActive]}
                          onPress={() => setGoalPriority(priority as 'low' | 'medium' | 'high')}
                        >
                          <Text style={[styles.chipText, goalPriority === priority && styles.chipTextActive]}>{priority}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.label}>Measurability</Text>
                    <View style={styles.chipRow}>
                      {GOAL_MEASURABILITY.map(m => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.chip, goalMeasurability === m && styles.chipActive]}
                          onPress={() => setGoalMeasurability(m as 'clear' | 'vague')}
                        >
                          <Text style={[styles.chipText, goalMeasurability === m && styles.chipTextActive]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {formMode === 'workout' && (
                  <>
                    <Text style={styles.label}>Workout Type</Text>
                    <View style={styles.chipRow}>
                      {WORKOUT_TYPES.map(w => (
                        <TouchableOpacity
                          key={w.id}
                          style={[styles.chip, workoutType === w.id && styles.chipActive]}
                          onPress={() => setWorkoutType(w.id as 'strength' | 'cardio' | 'sport' | 'mobility')}
                        >
                          <Text style={[styles.chipText, workoutType === w.id && styles.chipTextActive]}>{w.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.label}>Exercises</Text>
                    <View style={styles.exerciseRow}>
                      <TextInput
                        style={[styles.input, styles.exerciseNameInput]}
                        placeholder="Exercise"
                        placeholderTextColor={COLORS.textDim}
                        value={newExerciseName}
                        onChangeText={setNewExerciseName}
                      />
                      <TextInput
                        style={[styles.input, styles.exerciseNumberInput]}
                        placeholder="Sets"
                        placeholderTextColor={COLORS.textDim}
                        keyboardType="number-pad"
                        value={newExerciseSets}
                        onChangeText={setNewExerciseSets}
                      />
                      <TextInput
                        style={[styles.input, styles.exerciseNumberInput]}
                        placeholder="Reps"
                        placeholderTextColor={COLORS.textDim}
                        keyboardType="number-pad"
                        value={newExerciseReps}
                        onChangeText={setNewExerciseReps}
                      />
                      <TextInput
                        style={[styles.input, styles.exerciseNumberInput]}
                        placeholder="Min"
                        placeholderTextColor={COLORS.textDim}
                        keyboardType="number-pad"
                        value={newExerciseDuration}
                        onChangeText={setNewExerciseDuration}
                      />
                      <TouchableOpacity style={styles.addMiniButton} onPress={addExercise}>
                        <MaterialCommunityIcons name="plus" size={18} color={COLORS.background} />
                      </TouchableOpacity>
                    </View>

                    {workoutExercises.map(ex => {
                      const metaParts = [];
                      if (ex.sets) metaParts.push(`${ex.sets} sets`);
                      if (ex.reps) metaParts.push(`${ex.reps} reps`);
                      if (ex.durationMinutes) metaParts.push(`${ex.durationMinutes} min`);
                      return (
                        <View key={ex.id} style={styles.exerciseItem}>
                          <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseTitle}>{ex.name}</Text>
                            {metaParts.length > 0 && (
                              <Text style={styles.exerciseMeta}>{metaParts.join(' • ')}</Text>
                            )}
                          </View>
                          <TouchableOpacity onPress={() => removeExercise(ex.id)} style={styles.iconButton}>
                            <MaterialCommunityIcons name="close" size={18} color={COLORS.textDim} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    <Text style={styles.label}>Duration Range (min)</Text>
                    <View style={styles.row}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <TextInput
                          style={styles.input}
                          placeholder="Min"
                          placeholderTextColor={COLORS.textDim}
                          keyboardType="number-pad"
                          value={workoutDurationMin}
                          onChangeText={setWorkoutDurationMin}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <TextInput
                          style={styles.input}
                          placeholder="Max"
                          placeholderTextColor={COLORS.textDim}
                          keyboardType="number-pad"
                          value={workoutDurationMax}
                          onChangeText={setWorkoutDurationMax}
                        />
                      </View>
                    </View>
                  </>
                )}

                {(formMode === 'deadline' || formMode === 'commitment') && (
                  <>
                    {formMode === 'deadline' && (
                      <>
                        <Text style={styles.label}>Deadline Date</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={COLORS.textDim}
                          value={deadlineDate}
                          onChangeText={setDeadlineDate}
                        />
                      </>
                    )}

                    {formMode === 'commitment' && (
                      <>
                        <Text style={styles.label}>Commitment Type</Text>
                        <View style={styles.chipRow}>
                          {COMMITMENT_TYPES.map(ct => (
                            <TouchableOpacity
                              key={ct}
                              style={[styles.chip, commitmentType === ct && styles.chipActive]}
                              onPress={() => setCommitmentType(ct)}
                            >
                              <Text style={[styles.chipText, commitmentType === ct && styles.chipTextActive]}>{ct}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}

                    <Text style={styles.label}>External Inputs</Text>
                    <View style={styles.chipRow}>
                      {EXTERNAL_INPUT_TYPES.map(it => (
                        <TouchableOpacity
                          key={it}
                          style={[styles.chip, externalInputType === it && styles.chipActive]}
                          onPress={() => setExternalInputType(it)}
                        >
                          <Text style={[styles.chipText, externalInputType === it && styles.chipTextActive]}>{it}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.externalRow}>
                      <TextInput
                        style={[styles.input, styles.externalInput]}
                        placeholder="https://"
                        placeholderTextColor={COLORS.textDim}
                        value={externalInputUrl}
                        onChangeText={setExternalInputUrl}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity style={styles.addMiniButton} onPress={addExternalInput}>
                        <MaterialCommunityIcons name="plus" size={18} color={COLORS.background} />
                      </TouchableOpacity>
                    </View>

                    {externalInputs.map(input => (
                      <View key={input.id} style={styles.externalItem}>
                        <View style={styles.externalInfo}>
                          <Text style={styles.externalType}>{input.type}</Text>
                          <Text style={styles.externalUrl}>{input.url}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeExternalInput(input.id)} style={styles.iconButton}>
                          <MaterialCommunityIcons name="close" size={18} color={COLORS.textDim} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}
            </ScrollView>
        </View>
      </Modal>

      {/* Habit Modal */}
      <AddHabitModal 
        visible={isHabitModalVisible} 
        onClose={() => setHabitModalVisible(false)} 
        onSave={handleSaveHabit} 
      />
      
      {/* Routine Modal */}
      <AddRoutineModal
        visible={isRoutineModalVisible}
        onClose={() => setRoutineModalVisible(false)}
        onSave={handleSaveRoutine}
      />
      
      <Modal
        visible={isDatePickerVisible && Platform.OS === 'ios'}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDatePickerVisible(false)}
      >
        <TouchableOpacity style={styles.datePickerBackdrop} activeOpacity={1} onPress={() => setIsDatePickerVisible(false)}>
          <TouchableOpacity style={styles.datePickerCard} activeOpacity={1}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setIsDatePickerVisible(false)}>
                <Text style={styles.datePickerAction}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDateSave}>
                <Text style={styles.datePickerAction}>Done</Text>
              </TouchableOpacity>
            </View>
      <DateTimePicker
              value={currentDateValue}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              textColor={COLORS.white}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      {Platform.OS === 'android' && isDatePickerVisible ? (
        <DateTimePicker
          value={currentDateValue}
          mode="date"
          display="calendar"
          onChange={handleDateChange}
        />
      ) : null}

      {/* Time Picker */}
      <TimePickerModal 
        visible={isTimePickerVisible}
        onClose={() => setIsTimePickerVisible(false)}
        onSave={handleTimeSave}
        initialTime={currentTimeValue}
        title={activeTimeField === 'startTime' ? 'Start Time' : 'End Time'}
      />

    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.8)', // Transparent overlay
  },
  contentContainer: {
    padding: SPACING.xl,
    paddingBottom: 50,
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 50,
    gap: 15,
  },
  gridButton: {
    width: '47%',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: SPACING.l,
    alignItems: 'center',
    marginBottom: 20,
    height: 130,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  gridLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Sheet Styles (New)
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  sheetTitle: {
    fontSize: FONTS.h1,
    color: COLORS.white,
  },
  sheetSaveButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  sheetSaveText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sheetContent: {
    padding: SPACING.l,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: COLORS.background,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseNameInput: {
    flex: 1.2,
  },
  exerciseNumberInput: {
    width: 70,
    textAlign: 'center',
  },
  addMiniButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: 12,
    marginTop: SPACING.s,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    color: COLORS.white,
    fontWeight: '600',
  },
  exerciseMeta: {
    color: COLORS.textDim,
    marginTop: 4,
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  externalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  externalInput: {
    flex: 1,
  },
  externalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: 12,
    marginTop: SPACING.s,
  },
  externalInfo: {
    flex: 1,
  },
  externalType: {
    color: COLORS.white,
    fontWeight: '600',
  },
  externalUrl: {
    color: COLORS.textDim,
    marginTop: 4,
  },
  datePickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACING.l,
  },
  datePickerCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: '#242424',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  datePickerAction: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, LayoutAnimation, Platform, UIManager, ScrollView, Modal, Alert, Image, Linking, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { addDays, format, parseISO, isAfter, startOfDay } from 'date-fns';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { StorageService } from '../services/storage';
import { TimeBlock, UserProfile } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { HomeHeader } from '../components/HomeHeader';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { Swipeable } from 'react-native-gesture-handler';
import { SvgUri } from 'react-native-svg';
import * as Location from 'expo-location';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type LongPressScaleProps = {
  style?: any;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  activeOpacity?: number;
  pressInScale?: number;
  onLayout?: (event: LayoutChangeEvent) => void;
  children: React.ReactNode;
};

const LongPressScale = ({
  style,
  onPress,
  onLongPress,
  delayLongPress,
  activeOpacity = 0.85,
  pressInScale = 1.02,
  onLayout,
  children,
}: LongPressScaleProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: pressInScale,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };
  return (
    <AnimatedTouchable
      style={[style, { transform: [{ scale }] }]}
      activeOpacity={activeOpacity}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={onLayout}
    >
      {children}
    </AnimatedTouchable>
  );
};

const TaskCheck = ({
  isActive,
  size,
  radius,
  inset,
}: {
  isActive: boolean;
  size: number;
  radius: number;
  inset: number;
}) => (
  <View
    style={[
      styles.checkBase,
      { width: size, height: size, borderRadius: radius },
      isActive && styles.checkBaseActive,
    ]}
  >
    {isActive ? <View style={[styles.checkGlow, { borderRadius: radius }]} /> : null}
    {isActive ? <Ionicons name="checkmark" size={Math.max(size - inset * 2, 10)} color="#0B0B0C" /> : null}
  </View>
);

export const NowScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyItems, setDailyItems] = useState<TimeBlock[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const [headerTab, setHeaderTab] = useState<'today' | 'week' | 'later'>('today');
  const [laterItems, setLaterItems] = useState<TimeBlock[]>([]);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetMounted, setActionSheetMounted] = useState(false);
  const [actionTask, setActionTask] = useState<TimeBlock | null>(null);
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [rescheduleTask, setRescheduleTask] = useState<TimeBlock | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailTask, setDetailTask] = useState<TimeBlock | null>(null);
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const geocodeCacheRef = useRef<Record<string, string>>({});
  const confettiPiecesRef = useRef<Array<{
    id: string;
    color: string;
    startX: number;
    startY: number;
    width: number;
    height: number;
    tx: Animated.Value;
    ty: Animated.Value;
    rot: Animated.Value;
    opacity: Animated.Value;
  }>>([]);
  const [confettiVersion, setConfettiVersion] = useState(0);
  const lastProgressRef = useRef(0);
  const lastConfettiDateRef = useRef<string | null>(null);
  const actionSheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (actionSheetVisible) {
      setActionSheetMounted(true);
      actionSheetAnim.setValue(0);
      Animated.timing(actionSheetAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(actionSheetAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setActionSheetMounted(false);
      }
    });
  }, [actionSheetVisible, actionSheetAnim]);

  const isAllDayItem = (item: TimeBlock) =>
    item.isLater || (item.source === 'calendar' && item.startTime === '00:00' && item.endTime === '23:59');
  const isWakeOrSleep = (item: TimeBlock) => {
    const title = item.title.toLowerCase();
    return title.includes('wake') || title.includes('sleep');
  };
  const computeCompletionEntryForDate = useCallback((schedule: TimeBlock[], dateKey: string) => {
    const items = schedule.filter(item => item.date === dateKey && !item.isDeleted);
    let total = 0;
    let completed = 0;
    items.forEach(item => {
      const steps = item.steps ?? [];
      if (steps.length > 0) {
        total += steps.length;
        completed += steps.filter(step => step.isDone).length;
      } else {
        total += 1;
        if (item.isCompleted) completed += 1;
      }
    });
    return { date: dateKey, total, completed };
  }, []);
  const updateCompletionHistoryForDate = useCallback(
    async (dateKey: string, schedule?: TimeBlock[]) => {
      const sourceSchedule = schedule ?? (await StorageService.getSchedule());
      const entry = computeCompletionEntryForDate(sourceSchedule, dateKey);
      await StorageService.upsertDailyCompletion(entry);
      bumpScheduleVersion();
    },
    [computeCompletionEntryForDate],
  );

  const openTaskMenu = (task: TimeBlock) => {
    setActionTask(task);
    setActionSheetVisible(true);
  };

  const closeTaskMenu = () => {
    setActionSheetVisible(false);
  };
  const openTaskDetails = (task: TimeBlock) => {
    setDetailTask(task);
    setDetailVisible(true);
  };
  const closeTaskDetails = () => {
    setDetailVisible(false);
  };
  const lightningIconUri = Image.resolveAssetSource(require('../../assets/lightning.svg')).uri;
  const highIconUri = Image.resolveAssetSource(require('../../assets/icons/HIGHICON.svg')).uri;
  const lowIconUri = Image.resolveAssetSource(require('../../assets/icons/LOWICON.svg')).uri;
  const clockIconUri = Image.resolveAssetSource(require('../../assets/icons/CLOCK ICON.svg')).uri;
  const timetableIconUri = Image.resolveAssetSource(require('../../assets/icons/TIMETABLE ICON.svg')).uri;
  const detailIconUri = Image.resolveAssetSource(require('../../assets/icons/DETAILICON.svg')).uri;
  const mapIconUri = Image.resolveAssetSource(require('../../assets/icons/MAPICON.svg')).uri;
  const editIconUri = Image.resolveAssetSource(require('../../assets/icons/EDIT ICON.svg')).uri;
  const busIconUri = Image.resolveAssetSource(require('../../assets/icons/bus icon.svg')).uri;
  const walkIconUri = Image.resolveAssetSource(require('../../assets/icons/walk icon.svg')).uri;
  const flightIconUri = Image.resolveAssetSource(require('../../assets/icons/flight icon.svg')).uri;
  const taxiIconUri = Image.resolveAssetSource(require('../../assets/icons/taxi icon.svg')).uri;
  const bikeIconUri = Image.resolveAssetSource(require('../../assets/icons/bike icon.svg')).uri;
  const carIconUri = Image.resolveAssetSource(require('../../assets/icons/car icon.svg')).uri;
  const prioritiseActionIconUri = Image.resolveAssetSource(require('../../assets/icons/prioritise icon.svg')).uri;
  const copyActionIconUri = Image.resolveAssetSource(require('../../assets/icons/settingsicon/copy icon.svg')).uri;
  const moveActionIconUri = Image.resolveAssetSource(require('../../assets/icons/settingsicon/move icon.svg')).uri;
  const rescheduleActionIconUri = Image.resolveAssetSource(require('../../assets/icons/settingsicon/reschedule icon.svg')).uri;
  const rescheduleTomorrowIconUri = Image.resolveAssetSource(require('../../assets/icons/settingsicon/reschedule tmr icon.svg')).uri;
  const startActionIconUri = Image.resolveAssetSource(require('../../assets/icons/settingsicon/start icon.svg')).uri;
  const editActionIconUri = Image.resolveAssetSource(require('../../assets/icons/settingsicon/edit icon.svg')).uri;
  const deleteActionIconUri = Image.resolveAssetSource(require('../../assets/icons/white bin icon.svg')).uri;
  const bumpScheduleVersion = () => {
    setScheduleVersion(prev => prev + 1);
  };
  const renderLightningAction = (task: TimeBlock) => {
    const isDeleteRestricted = isWakeOrSleep(task);
    return (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[styles.swipeActionButton, styles.swipeActionLightning]}
          activeOpacity={0.85}
          onPress={() => openTaskMenu(task)}
        >
          <SvgUri uri={lightningIconUri} width={18} height={18} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.swipeActionButton,
            styles.swipeActionDelete,
            isDeleteRestricted && styles.swipeActionDisabled,
          ]}
          activeOpacity={1}
          onPress={() => {
            if (isDeleteRestricted) return;
            Alert.alert('Delete task?', 'This will remove the task.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteTaskFromSwipe(task) },
            ]);
          }}
        >
          <SvgUri uri={deleteActionIconUri} width={18} height={18} />
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const buildConcreteTask = (
    task: TimeBlock,
    overrides: Partial<TimeBlock> = {},
    options: { forceNewId?: boolean; resetSteps?: boolean } = {},
  ) => {
    const dateKey = task.date ?? format(selectedDate, 'yyyy-MM-dd');
    const next: TimeBlock = { ...task, date: dateKey, isDeleted: false, ...overrides };
    if (options.forceNewId || task.id.startsWith('virtual-')) {
      next.id = uuidv4();
    }
    if (options.resetSteps && next.steps) {
      next.steps = next.steps.map(step => ({ ...step, id: uuidv4(), isDone: false }));
    }
    return next;
  };

  const applyScheduleUpdate = async (task: TimeBlock, overrides: Partial<TimeBlock>) => {
    const schedule = await StorageService.getSchedule();
    const updated = buildConcreteTask(task, overrides);
    const next = task.id.startsWith('virtual-')
      ? [...schedule, updated]
      : schedule.map(s => (s.id === task.id ? updated : s));
    await StorageService.saveSchedule(next);
    await loadData();
    bumpScheduleVersion();
    return updated;
  };

  const duplicateTask = async (task: TimeBlock) => {
    const schedule = await StorageService.getSchedule();
    const copy = buildConcreteTask(
      task,
      { isCompleted: false, isInProgress: false },
      { forceNewId: true, resetSteps: true },
    );
    const next = [...schedule, copy];
    await StorageService.saveSchedule(next);
    await loadData();
    bumpScheduleVersion();
  };

  const deleteTask = async (task: TimeBlock) => {
    const schedule = await StorageService.getSchedule();
    if (task.id.startsWith('virtual-')) {
      const deleted: TimeBlock = {
        ...task,
        id: uuidv4(),
        isDeleted: true,
        date: format(selectedDate, 'yyyy-MM-dd'),
      };
      await StorageService.saveSchedule([...schedule, deleted]);
      await loadData();
      bumpScheduleVersion();
      return;
    }
    const next = schedule.map(s => (s.id === task.id ? { ...s, isDeleted: true } : s));
    await StorageService.saveSchedule(next);
    await loadData();
    bumpScheduleVersion();
  };
  const deleteTaskFromSwipe = async (task: TimeBlock) => {
    const inDaily = dailyItems.some(item => item.id === task.id);
    if (inDaily) {
      await handleDelete(task.id);
      return;
    }
    const inLater = laterItems.some(item => item.id === task.id);
    if (!inLater) {
      await deleteTask(task);
      return;
    }
    setLaterItems(prev => prev.filter(item => item.id !== task.id));
    const dateKey = task.date ?? format(selectedDate, 'yyyy-MM-dd');
    if (task.id.startsWith('virtual-')) {
      const deleted: TimeBlock = {
        ...task,
        id: uuidv4(),
        isDeleted: true,
        isCompleted: false,
        date: dateKey,
      };
      const schedule = await StorageService.getSchedule();
      const next = [...schedule, deleted];
      await StorageService.saveSchedule(next);
      await updateCompletionHistoryForDate(dateKey, next);
      return;
    }
    const schedule = await StorageService.getSchedule();
    const next = schedule.map(item => (item.id === task.id ? { ...item, isDeleted: true } : item));
    await StorageService.saveSchedule(next);
    await updateCompletionHistoryForDate(dateKey, next);
  };

  const openReschedulePicker = (task: TimeBlock) => {
    const baseDate = task.date ? parseISO(task.date) : selectedDate;
    setRescheduleTask(task);
    setRescheduleDate(baseDate);
    setRescheduleVisible(true);
  };

  const openEditTask = async (task: TimeBlock) => {
    if (task.id.startsWith('virtual-')) {
      const schedule = await StorageService.getSchedule();
      const concrete = buildConcreteTask(task, {}, { forceNewId: true });
      await StorageService.saveSchedule([...schedule, concrete]);
      await loadData();
      navigation.navigate('AddModal', { editingBlock: concrete });
      return;
    }
    navigation.navigate('AddModal', { editingBlock: task });
  };

  const commitReschedule = async (date: Date) => {
    if (!rescheduleTask) return;
    await applyScheduleUpdate(rescheduleTask, { date: format(date, 'yyyy-MM-dd') });
    setRescheduleTask(null);
  };

  const handleRescheduleChange = (_event: any, date?: Date) => {
    if (!date) return;
    if (Platform.OS === 'android') {
      setRescheduleVisible(false);
      commitReschedule(date);
      return;
    }
    setRescheduleDate(date);
  };

  const handleRescheduleSave = () => {
    setRescheduleVisible(false);
    commitReschedule(rescheduleDate);
  };

  const handleActionPress = async (action: string) => {
    if (!actionTask) return;
    const task = actionTask;
    if (action === 'cancel') {
      closeTaskMenu();
      return;
    }
    closeTaskMenu();
    if (isWakeOrSleep(task) && ['copy', 'todo', 'tomorrow', 'delete'].includes(action)) {
      Alert.alert('Action unavailable', 'Wake up and Sleep time cannot be modified that way.');
      return;
    }
    if (action === 'copy') {
      await duplicateTask(task);
      return;
    }
    if (action === 'todo') {
      await applyScheduleUpdate(task, {
        date: format(selectedDate, 'yyyy-MM-dd'),
        source: 'app',
        isLater: true,
      });
      return;
    }
    if (action === 'reschedule') {
      openReschedulePicker(task);
      return;
    }
    if (action === 'tomorrow') {
      await applyScheduleUpdate(task, { date: format(addDays(selectedDate, 1), 'yyyy-MM-dd') });
      return;
    }
    if (action === 'start') {
      await applyScheduleUpdate(task, { isInProgress: true });
      return;
    }
    if (action === 'priority') {
      const nextPriority = task.goalPriority === 'high' ? 'low' : 'high';
      await applyScheduleUpdate(task, { goalPriority: nextPriority });
      return;
    }
    if (action === 'edit') {
      await openEditTask(task);
      return;
    }
    if (action === 'delete') {
      Alert.alert('Delete task?', 'This will remove the task.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task) },
      ]);
    }
  };

  const normalizeWakeSleepTitle = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('wake')) return 'wake';
    if (lower.includes('sleep')) return 'sleep';
    return null;
  };

  const loadData = async () => {
    // 1. Load User
    const profile = await StorageService.getUserProfile();
    let activeProfile = profile;
    if (profile?.backgroundLocationEnabled || profile?.locationEnabled) {
      try {
        let last = await Location.getLastKnownPositionAsync();
        if (!last && profile.locationEnabled) {
          last = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        if (last?.coords) {
          const updatedProfile = {
            ...profile,
            lastKnownLatitude: last.coords.latitude,
            lastKnownLongitude: last.coords.longitude,
            lastKnownAt: new Date().toISOString(),
          };
          await StorageService.saveUserProfile(updatedProfile);
          activeProfile = updatedProfile;
        }
      } catch (e) {
        activeProfile = profile;
      }
    }
    setUserProfile(activeProfile ?? null);

    // 2. Load Schedule (Concrete Tasks/Events)
    let schedule = await StorageService.getSchedule();
    if (schedule.length === 0) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      schedule = [
        {
          id: uuidv4(),
          title: 'Sleep time',
          startTime: '00:00',
          endTime: '06:30',
          type: 'other',
          isCompleted: false,
          date: dateKey,
        },
        {
          id: uuidv4(),
          title: 'Wake up',
          startTime: '06:30',
          endTime: '06:35',
          type: 'other',
          isCompleted: false,
          date: dateKey,
        },
      ];
      await StorageService.saveSchedule(schedule);
    }
    const keepIndexByKey: Record<string, number> = {};
    let scheduleChanged = false;
    const nextSchedule = [...schedule];
    for (let i = 0; i < nextSchedule.length; i += 1) {
      const item = nextSchedule[i];
      if (item.isDeleted) continue;
      const kind = normalizeWakeSleepTitle(item.title);
      if (!kind) continue;
      const dateKey = item.date ?? 'undated';
      const key = `${dateKey}-${kind}`;
      const existingIndex = keepIndexByKey[key];
      if (existingIndex === undefined) {
        keepIndexByKey[key] = i;
        continue;
      }
      const existingItem = nextSchedule[existingIndex];
      const existingTime = existingItem.startTime ?? '99:99';
      const currentTime = item.startTime ?? '99:99';
      if (currentTime < existingTime) {
        nextSchedule[existingIndex] = { ...existingItem, isDeleted: true };
        keepIndexByKey[key] = i;
        scheduleChanged = true;
        continue;
      }
      nextSchedule[i] = { ...item, isDeleted: true };
      scheduleChanged = true;
    }
    if (scheduleChanged) {
      await StorageService.saveSchedule(nextSchedule);
      schedule = nextSchedule;
    }
    const adjusted = adjustWakeSleepTimes(profile, schedule);
    // Persist adjustment if changed
    const changed = JSON.stringify(schedule) !== JSON.stringify(adjusted);
    if (changed) {
      await StorageService.saveSchedule(adjusted);
      schedule = adjusted;
    }
    // 3. Load Habits (Definitions)
    const habits = await StorageService.getHabits(); // We need to add getHabits to interface if not public? It is public.
    // 4. Load Routines (Definitions)
    const routines = await StorageService.getRoutines();

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayIndex = selectedDate.getDay();

    // Filter Concrete Items (Tasks, Events, Specific Habit Instances)
    const concreteItems = schedule.filter(item => {
        // Exclude deleted items
        if (item.isDeleted) return false;
        if (isAllDayItem(item)) return false;

        // If item has a date, match it
        if (item.date) {
            return item.date === dateKey;
        }
        // If item has NO date (legacy), treat as daily? 
        // Or strictly 'today'? 
        // For now, let's assume legacy items show up every day (Daily Routine)
        const hasDatedInstance = schedule.some(
          scheduled =>
            !scheduled.isDeleted &&
            scheduled.date === dateKey &&
            scheduled.title === item.title &&
            scheduled.startTime === item.startTime
        );
        return !hasDatedInstance; 
    });

    // Generate Virtual Habit Items
    // We only want to show a virtual habit if it's NOT already completed/instantiated in concreteItems
    const virtualHabits: TimeBlock[] = [];
    
    habits.forEach((habit: any) => {
        const config = habit.configs.find((c: any) => c.dayIndex === dayIndex);
        if (config) {
            // Check if this habit is already in concreteItems (completed or manually added)
            // Matching by Title and StartTime is a heuristic
            const isInstantiated = concreteItems.some(
                item => item.title === habit.title && item.startTime === config.startTime && item.isHabit
            );

            if (!isInstantiated) {
                virtualHabits.push({
                    id: `virtual-${habit.id}-${dateKey}`,
                    title: habit.title,
                    startTime: config.startTime,
                    endTime: config.endTime,
                    type: 'routine',
                    isHabit: true,
                    habitType: habit.type,
                    xp: habit.type === 'growth' ? 15 : 10,
                    location: config.location,
                    tagId: habit.tag?.id,
                    tagColor: habit.tag?.color,
                    reminderEnabled: habit.reminder,
                    isCompleted: false,
                    date: dateKey // Bind to this date
                });
            }
        }
    });

    // Generate Virtual Routine Items
    const virtualRoutines: TimeBlock[] = [];
    routines.forEach((routine: any) => {
        if (routine.isTemplate) return;
        const config = routine.configs.find((c: any) => c.dayIndex === dayIndex);
        if (config) {
            const isInstantiated = concreteItems.some(
                item => item.title === routine.title && item.startTime === config.startTime && item.isRoutine
            );
            if (!isInstantiated) {
                virtualRoutines.push({
                    id: `virtual-routine-${routine.id}-${dateKey}`,
                    title: routine.title,
                    startTime: config.startTime,
                    endTime: config.endTime,
                    type: 'routine',
                    isRoutine: true,
                    steps: routine.steps.map((s: any) => ({ id: s.id, label: s.label, isDone: false })),
                    isCompleted: false,
                    date: dateKey
                });
            }
        }
    });

    const allDayItems = schedule
      .filter(item => {
        if (item.isDeleted) return false;
        if (!isAllDayItem(item)) return false;
        if (!item.date) return false;
        return item.date >= dateKey;
      })
      .sort((a, b) => {
        if ((a.date || '') !== (b.date || '')) return (a.date || '').localeCompare(b.date || '');
        return a.title.localeCompare(b.title);
      });

    setLaterItems(allDayItems);

    const allItems = [...concreteItems, ...virtualHabits, ...virtualRoutines];
    const withCommute = addCommuteBlocks(allItems, dateKey, activeProfile);
    withCommute.sort((a, b) => a.startTime.localeCompare(b.startTime));

    setDailyItems(withCommute);
    void enhanceCommuteBlocks(withCommute, activeProfile ?? undefined);
  };

  const handleLaterToggle = async (id: string) => {
    const item = laterItems.find(i => i.id === id);
    if (!item) return;
    if (item.date && isAfter(startOfDay(parseISO(item.date)), startOfDay(new Date()))) return;
    const nextCompleted = !item.isCompleted;
    const updatedItems = laterItems.map(i => (i.id === id ? { ...i, isCompleted: nextCompleted } : i));
    setLaterItems(updatedItems);
    const schedule = await StorageService.getSchedule();
    const newSchedule = schedule.map(s => (s.id === id ? { ...s, isCompleted: nextCompleted } : s));
    await StorageService.saveSchedule(newSchedule);
    if (item.date) {
      await updateCompletionHistoryForDate(item.date, newSchedule);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const handleToggle = async (id: string) => {
      // Find the item
      const item = dailyItems.find(i => i.id === id);
      if (!item) return;
      if (isFutureSelectedDate) return;
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const isToday = dateKey === format(new Date(), 'yyyy-MM-dd');

      const newCompletedState = !item.isCompleted;

      // Optimistic Update
      const updatedItems = dailyItems.map(i => 
          i.id === id ? { ...i, isCompleted: newCompletedState } : i
      );
      setDailyItems(updatedItems);
      if (newCompletedState && isToday) triggerConfetti('small');

      // XP Logic
      if (newCompletedState && item.xp) {
          await StorageService.addXP(item.xp);
          // Reload profile to update rank
          const updatedProfile = await StorageService.getUserProfile();
          setUserProfile(updatedProfile);
      }

      // Storage Update
      if (id.startsWith('virtual-')) {
          // It's a virtual item being completed -> Instantiate it
          const newItem: TimeBlock = {
              ...item,
              id: uuidv4(), // Generate real ID
              isCompleted: newCompletedState,
              date: dateKey
          };
          
          const schedule = await StorageService.getSchedule();
          const newSchedule = [...schedule, newItem];
          await StorageService.saveSchedule(newSchedule);
          await updateCompletionHistoryForDate(dateKey, newSchedule);
      } else if (!item.date) {
          const newItem: TimeBlock = {
              ...item,
              id: uuidv4(),
              isCompleted: newCompletedState,
              date: dateKey
          };
          const schedule = await StorageService.getSchedule();
          const newSchedule = [...schedule, newItem];
          await StorageService.saveSchedule(newSchedule);
          await updateCompletionHistoryForDate(dateKey, newSchedule);
      } else {
          // It's a concrete item -> Update it
          const schedule = await StorageService.getSchedule();
          const newSchedule = schedule.map(s => 
              s.id === id ? { ...s, isCompleted: newCompletedState } : s
          );
          await StorageService.saveSchedule(newSchedule);
          await updateCompletionHistoryForDate(dateKey, newSchedule);
      }
      
      // We don't reload data immediately to avoid jumpiness, 
      // but the optimistic update handles the UI.
  };

  const handleDelete = async (id: string) => {
    const item = dailyItems.find(i => i.id === id);
    if (!item) return;

    const updatedItems = dailyItems.filter(i => i.id !== id);
    setDailyItems(updatedItems);
    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    if (id.startsWith('virtual-')) {
        const newItem: TimeBlock = {
            ...item,
            id: uuidv4(),
            isCompleted: false,
            isDeleted: true,
            date: dateKey
        };
        const schedule = await StorageService.getSchedule();
        const newSchedule = [...schedule, newItem];
        await StorageService.saveSchedule(newSchedule);
        await updateCompletionHistoryForDate(dateKey, newSchedule);
    } else {
        const schedule = await StorageService.getSchedule();
        const newSchedule = schedule.map(s => 
            s.id === id ? { ...s, isDeleted: true } : s
        );
        await StorageService.saveSchedule(newSchedule);
        await updateCompletionHistoryForDate(dateKey, newSchedule);
    }
  };

  const handleToggleStep = async (blockId: string, stepId: string) => {
    const item = dailyItems.find(i => i.id === blockId);
    if (!item || !item.steps) return;
    if (isFutureSelectedDate) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const isToday = dateKey === format(new Date(), 'yyyy-MM-dd');
    const updatedSteps = item.steps.map(s => s.id === stepId ? { ...s, isDone: !s.isDone } : s);
    const allDone = updatedSteps.every(s => s.isDone);
    const updatedItems = dailyItems.map(i => i.id === blockId ? { ...i, steps: updatedSteps, isCompleted: allDone } : i);
    setDailyItems(updatedItems);
    if (allDone && isToday) triggerConfetti('medium');
    
    if (blockId.startsWith('virtual-routine-')) {
        const newItem: TimeBlock = {
            ...item,
            id: uuidv4(),
            steps: updatedSteps,
            isCompleted: allDone,
            date: dateKey
        };
        const schedule = await StorageService.getSchedule();
        const newSchedule = [...schedule, newItem];
        await StorageService.saveSchedule(newSchedule);
        await updateCompletionHistoryForDate(dateKey, newSchedule);
    } else if (!item.date) {
        const newItem: TimeBlock = {
            ...item,
            id: uuidv4(),
            steps: updatedSteps,
            isCompleted: allDone,
            date: dateKey
        };
        const schedule = await StorageService.getSchedule();
        const newSchedule = [...schedule, newItem];
        await StorageService.saveSchedule(newSchedule);
        await updateCompletionHistoryForDate(dateKey, newSchedule);
    } else {
        const schedule = await StorageService.getSchedule();
        const newSchedule = schedule.map(s => 
            s.id === blockId ? { ...s, steps: updatedSteps, isCompleted: allDone } : s
        );
        await StorageService.saveSchedule(newSchedule);
        await updateCompletionHistoryForDate(dateKey, newSchedule);
    }
  };

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
  };

  const adjustWakeSleepTimes = (profile: UserProfile | null, items: TimeBlock[]) => {
    if (!profile) return items;
    const updated = items.map(block => {
      if (block.title === 'Wake Up' && profile.wakeTime) {
        const [h, m] = profile.wakeTime.split(':').map(Number);
        const end = new Date();
        end.setHours(h ?? 7, (m ?? 0) + 30, 0, 0);
        const endStr = `${end.getHours().toString().padStart(2,'0')}:${end.getMinutes().toString().padStart(2,'0')}`;
        return { ...block, startTime: profile.wakeTime, endTime: endStr };
      }
      if (block.title === 'Sleep Time' && profile.sleepTime) {
        const [h, m] = profile.sleepTime.split(':').map(Number);
        const end = new Date();
        end.setHours((h ?? 22) + 1, m ?? 0, 0, 0);
        const endStr = `${end.getHours().toString().padStart(2,'0')}:${end.getMinutes().toString().padStart(2,'0')}`;
        return { ...block, startTime: profile.sleepTime, endTime: endStr };
      }
      return block;
    });
    return updated;
  };

  const isFutureSelectedDate = isAfter(startOfDay(selectedDate), startOfDay(new Date()));

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const timeLabel = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const minutesToTime = (mins: number) => {
    const clamped = Math.max(0, Math.min(1439, Math.round(mins)));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const buildDateTimeForItem = (item: TimeBlock, baseDate: Date) => {
    const dateBase = item.date ? parseISO(item.date) : baseDate;
    const [h, m] = item.startTime.split(':').map(Number);
    const next = new Date(dateBase);
    next.setHours(h || 0, m || 0, 0, 0);
    return next;
  };

  const buildCommuteUrl = (origin: string, destination: string, mode: string) => {
    const params = new URLSearchParams({
      origin,
      destination,
      travelmode: mode,
    });
    return `https://www.google.com/maps/dir/?api=1&${params.toString()}`;
  };

  const extractTransitSummary = (steps: Array<any>) => {
    const parts: string[] = [];
    steps.forEach(step => {
      if (step?.travel_mode !== 'TRANSIT') return;
      const line = step?.transit_details?.line;
      const vehicle = line?.vehicle?.name;
      const short = line?.short_name;
      const name = line?.name;
      const label = [vehicle, short || name].filter(Boolean).join(' ');
      if (label && !parts.includes(label)) {
        parts.push(label);
      }
    });
    return parts.join(' → ');
  };

  const fetchCommuteDetails = async (
    origin: string,
    destination: string,
    departureTime: number,
    mode: 'transit' | 'driving' | 'walking' | 'bicycling'
  ) => {
    if (!GOOGLE_MAPS_API_KEY) return null;
    const trafficParam = mode === 'driving' ? '&traffic_model=best_guess' : '';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&departure_time=${departureTime}${trafficParam}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const route = data?.routes?.[0];
    const leg = route?.legs?.[0];
    if (!leg) return null;
    const durationSource =
      mode === 'driving' && leg?.duration_in_traffic?.value ? leg.duration_in_traffic.value : leg?.duration?.value;
    const durationMinutes = durationSource ? Math.round(durationSource / 60) : null;
    const distanceText = leg?.distance?.text;
    const summary = mode === 'transit' && leg?.steps ? extractTransitSummary(leg.steps) : route?.summary;
    return {
      durationMinutes: durationMinutes ?? null,
      distanceText: typeof distanceText === 'string' ? distanceText : undefined,
      summary: typeof summary === 'string' ? summary : undefined,
      mode,
    };
  };

  const fetchCommuteDetailsWithFallback = async (
    origin: string,
    destination: string,
    departureTime: number
  ) => {
    const modes: Array<'transit' | 'driving' | 'walking' | 'bicycling'> = ['transit', 'driving', 'walking'];
    for (const mode of modes) {
      const details = await fetchCommuteDetails(origin, destination, departureTime, mode);
      if (details?.durationMinutes) {
        return details;
      }
    }
    return null;
  };

  const isCommuteTask = (item: TimeBlock) => item.isCommute || item.title.toLowerCase().includes('commute');

  const parseLatLng = (value: string) => {
    const trimmed = value.trim();
    const match = trimmed.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[3]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return `${lat},${lng}`;
  };

  const resolveLocationToCoords = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const fromCache = geocodeCacheRef.current[trimmed];
    if (fromCache) return fromCache;
    const direct = parseLatLng(trimmed);
    if (direct) {
      geocodeCacheRef.current[trimmed] = direct;
      return direct;
    }
    if (!GOOGLE_MAPS_API_KEY) return trimmed;
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      const location = data?.results?.[0]?.geometry?.location;
      if (location?.lat && location?.lng) {
        const coords = `${location.lat},${location.lng}`;
        geocodeCacheRef.current[trimmed] = coords;
        return coords;
      }
    } catch (e) {
      return trimmed;
    }
    return trimmed;
  };

  const estimateCommuteMinutes = (location?: string) => {
    const text = location?.trim().toLowerCase() ?? '';
    if (!text) return 0;
    if (/(online|zoom|virtual|remote)/.test(text)) return 0;
    if (/(campus|university|uni|school|lecture|class)/.test(text)) return 30;
    if (/(hospital|clinic|doctor|dentist)/.test(text)) return 35;
    if (/(office|work|gym|studio)/.test(text)) return 20;
    return 15;
  };

  const getCommuteModeLabel = (mode?: string, summary?: string) => {
    const summaryText = summary?.toLowerCase() ?? '';
    if (summaryText.includes('taxi')) return 'Taxi';
    if (summaryText.includes('flight') || summaryText.includes('airport')) return 'Flight';
    if (mode === 'driving') return 'Car';
    if (mode === 'walking') return 'Walk';
    if (mode === 'bicycling') return 'Bike';
    if (mode === 'transit') return 'Bus';
    return '';
  };

  const getCommuteModeIconUri = (mode?: string, summary?: string) => {
    const summaryText = summary?.toLowerCase() ?? '';
    if (summaryText.includes('taxi')) return taxiIconUri;
    if (summaryText.includes('flight') || summaryText.includes('airport')) return flightIconUri;
    if (mode === 'driving') return carIconUri;
    if (mode === 'walking') return walkIconUri;
    if (mode === 'bicycling') return bikeIconUri;
    if (mode === 'transit') return busIconUri;
    return undefined;
  };

  const addCommuteBlocks = (items: TimeBlock[], dateKey: string, profile?: UserProfile | null) => {
    const baseItems = items.filter(
      item => !(item.isCommute || (typeof item.id === 'string' && item.id.startsWith('virtual-commute-')))
    );
    const extra: TimeBlock[] = [];
    const bufferMinutes = profile?.commuteBufferMinutes ?? 10;
    const homeCoords =
      profile?.homeLatitude !== undefined && profile?.homeLongitude !== undefined
        ? `${profile.homeLatitude},${profile.homeLongitude}`
        : undefined;
    const lastKnownCoords =
      profile?.lastKnownLatitude !== undefined && profile?.lastKnownLongitude !== undefined
        ? `${profile.lastKnownLatitude},${profile.lastKnownLongitude}`
        : undefined;
    const defaultOrigin = homeCoords || profile?.homeAddress || lastKnownCoords;
    const generatedCommuteIds = new Set<string>();
    baseItems.forEach(item => {
      if (!item.location || isCommuteTask(item) || isWakeOrSleep(item)) return;
      const beforeId = `virtual-commute-before-${item.id}`;
      const afterId = `virtual-commute-after-${item.id}`;
      if (generatedCommuteIds.has(beforeId) || generatedCommuteIds.has(afterId)) return;
      const start = toMinutes(item.startTime);
      const end = toMinutes(item.endTime);
      if (Number.isNaN(start) || Number.isNaN(end)) return;
      const commuteMinutes = estimateCommuteMinutes(item.location);
      if (commuteMinutes < 5) return;
      const totalMinutes = commuteMinutes + bufferMinutes;
      const beforeStart = start - totalMinutes;
      const afterEnd = end + totalMinutes;
      const beforeBlock: TimeBlock = {
        id: beforeId,
        title: `Commute to ${item.location}`,
        startTime: minutesToTime(beforeStart),
        endTime: minutesToTime(start),
        type: 'other',
        date: item.date ?? dateKey,
        location: item.location,
        isCommute: true,
        isCompleted: false,
        commuteFrom: defaultOrigin,
        commuteTo: item.location,
        commuteDurationMinutes: commuteMinutes,
        commuteBufferMinutes: bufferMinutes,
        commuteMode: 'transit',
        commuteUrl: defaultOrigin ? buildCommuteUrl(defaultOrigin, item.location, 'transit') : undefined,
      };
      const afterBlock: TimeBlock = {
        id: afterId,
        title: `Commute from ${item.location}`,
        startTime: minutesToTime(end),
        endTime: minutesToTime(afterEnd),
        type: 'other',
        date: item.date ?? dateKey,
        location: item.location,
        isCommute: true,
        isCompleted: false,
        commuteFrom: item.location,
        commuteTo: defaultOrigin,
        commuteDurationMinutes: commuteMinutes,
        commuteBufferMinutes: bufferMinutes,
        commuteMode: 'transit',
        commuteUrl: defaultOrigin ? buildCommuteUrl(item.location, defaultOrigin, 'transit') : undefined,
      };
      if (toMinutes(beforeBlock.endTime) > toMinutes(beforeBlock.startTime)) {
        extra.push(beforeBlock);
      }
      if (toMinutes(afterBlock.endTime) > toMinutes(afterBlock.startTime)) {
        extra.push(afterBlock);
      }
      generatedCommuteIds.add(beforeId);
      generatedCommuteIds.add(afterId);
    });
    return [...baseItems, ...extra];
  };

  const enhanceCommuteBlocks = async (items: TimeBlock[], profile?: UserProfile | null) => {
    if (!profile || !GOOGLE_MAPS_API_KEY) return;
    const baseDate = selectedDate;
    const buildDateTimeFromTime = (time: string, dateValue?: string) => {
      const dateBase = dateValue ? parseISO(dateValue) : baseDate;
      const [h, m] = time.split(':').map(Number);
      const next = new Date(dateBase);
      next.setHours(h || 0, m || 0, 0, 0);
      return next;
    };
    const updated = await Promise.all(
      items.map(async item => {
        if (!item.isCommute || !item.commuteFrom || !item.commuteTo) return item;
        const isBefore = item.title.toLowerCase().includes('commute to');
        const departureTime = isBefore ? item.endTime : item.startTime;
        const departureDate = buildDateTimeFromTime(departureTime, item.date);
        const resolvedFrom = await resolveLocationToCoords(item.commuteFrom);
        const resolvedTo = await resolveLocationToCoords(item.commuteTo);
        if (!resolvedFrom || !resolvedTo) return item;
        const details = await fetchCommuteDetailsWithFallback(
          resolvedFrom,
          resolvedTo,
          Math.floor(departureDate.getTime() / 1000)
        );
        if (!details || !details.durationMinutes) return item;
        const bufferMinutes = item.commuteBufferMinutes ?? profile.commuteBufferMinutes ?? 10;
        const totalMinutes = details.durationMinutes + bufferMinutes;
        const startMinutes = isBefore ? toMinutes(item.endTime) - totalMinutes : toMinutes(item.startTime);
        const endMinutes = isBefore ? toMinutes(item.endTime) : toMinutes(item.startTime) + totalMinutes;
        return {
          ...item,
          startTime: minutesToTime(startMinutes),
          endTime: minutesToTime(endMinutes),
          commuteDurationMinutes: details.durationMinutes,
          commuteDistanceText: details.distanceText,
          commuteSummary: details.summary,
          commuteMode: details.mode,
          commuteUrl: buildCommuteUrl(item.commuteFrom, item.commuteTo, details.mode),
          commuteUpdatedAt: Date.now(),
        };
      })
    );
    updated.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setDailyItems(updated);
  };

  const formatDuration = (minutes: number) => {
    const mins = Math.max(0, Math.round(minutes));
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m === 0 ? `${h}h` : `${h}h ${m}m`;
    }
    return `${mins}m`;
  };

  const parseDurationFromLabel = (label: string) => {
    const match = label.match(/(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)/i);
    if (!match) return null;
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (Number.isNaN(value)) return null;
    if (unit.startsWith('h')) return value * 60;
    return value;
  };

  const getDotCountForHeight = (height: number, minCount: number, maxCount: number) => {
    if (!height || height <= 0) return minCount;
    const dotSize = 7;
    const stackPadding = 12;
    const targetGap = 6;
    const available = Math.max(0, height - stackPadding);
    const raw = Math.round((available + targetGap) / (dotSize + targetGap));
    return Math.min(maxCount, Math.max(minCount, raw));
  };

  const stepPalette = ['#F6C453', '#A7F3D0', '#F9A8D4', '#C7D2FE', '#FDE68A'];
  const taskPalette = ['#F6C453', '#A7F3D0', '#F9A8D4', '#C7D2FE', '#FDE68A', '#FCA5A5', '#86EFAC'];
  const emojiPalette = ['🧠', '🎯', '📌', '🧩', '📝', '🎨', '📚', '🧘‍♂️', '🏃‍♂️', '🍀'];
  const getStepIcon = (label: string, index: number) => {
    const lower = label.toLowerCase();
    if (lower.includes('brush') || lower.includes('teeth')) return { emoji: '🪥', bg: '#FCA5A5' };
    if (lower.includes('skin')) return { emoji: '🧴', bg: '#FDBA74' };
    if (lower.includes('breakfast') || lower.includes('eat')) return { emoji: '🥐', bg: '#86EFAC' };
    if (lower.includes('wake')) return { emoji: '⏰', bg: '#F6C453' };
    if (lower.includes('shower')) return { emoji: '🚿', bg: '#93C5FD' };
    return { emoji: '✅', bg: stepPalette[index % stepPalette.length] };
  };

  const getTaskVisual = (title: string) => {
    const lower = title.toLowerCase();
    let hash = 0;
    for (let i = 0; i < lower.length; i += 1) {
      hash = (hash * 31 + lower.charCodeAt(i)) % 100000;
    }
    const pickColor = taskPalette[hash % taskPalette.length];
    const pickEmoji = emojiPalette[hash % emojiPalette.length];
    if (lower.includes('sleep') || lower.includes('bedtime') || lower.includes('bed')) return { emoji: '🛏️', bg: '#7A5AF8' };
    if (lower.includes('wake')) return { emoji: '⏰', bg: '#F6C453' };
    if (lower.includes('morning')) return { emoji: '🧘‍♂️', bg: '#A7F3D0' };
    if (lower.includes('brush')) return { emoji: '🪥', bg: '#FCA5A5' };
    if (lower.includes('skin')) return { emoji: '🧴', bg: '#FDBA74' };
    if (lower.includes('breakfast')) return { emoji: '🥐', bg: '#86EFAC' };
    if (lower.includes('commute')) return { emoji: '🚶‍♂️', bg: '#C7D2FE' };
    if (lower.includes('gym')) return { emoji: '🏋️‍♂️', bg: '#FBBF24' };
    if (lower.includes('study')) return { emoji: '📚', bg: '#FBCFE8' };
    return { emoji: pickEmoji, bg: pickColor };
  };

  const progressData = useMemo(() => {
    let total = 0;
    let completed = 0;
    dailyItems.forEach(item => {
      const steps = item.steps ?? [];
      if (steps.length > 0) {
        total += steps.length;
        completed += steps.filter(step => step.isDone).length;
      } else {
        total += 1;
        if (item.isCompleted) completed += 1;
      }
    });
    const progress = total > 0 ? completed / total : 0;
    return { total, completed, progress };
  }, [dailyItems]);

  const scheduleRows = useMemo(() => {
    const rows: Array<
      | { kind: 'gap'; startTime: string; durationMins: number }
      | { kind: 'item'; item: TimeBlock; durationMins: number }
    > = [];
    let cursor = 0;
    dailyItems.forEach(item => {
      const start = toMinutes(item.startTime);
      const end = toMinutes(item.endTime);
      const gap = start - cursor;
      if (gap >= 45) {
        rows.push({ kind: 'gap', startTime: timeLabel(cursor), durationMins: gap });
      }
      rows.push({ kind: 'item', item, durationMins: Math.max(5, end - start) });
      cursor = Math.max(cursor, end);
    });
    return rows;
  }, [dailyItems]);

  const endOfDayLabel = '23:59';
  const isTodaySelected =
    format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const detailDate = detailTask?.date ? parseISO(detailTask.date) : selectedDate;
  const detailTitle = detailTask?.title ?? '';
  const detailVisual = detailTask ? getTaskVisual(detailTask.title) : null;
  const detailTypeLabel = detailTask?.type
    ? `[${detailTask.type.charAt(0).toUpperCase()}${detailTask.type.slice(1)}]`
    : '';
  const detailTimeLabel = detailTask
    ? `${format(detailDate, 'EEEE dd MMM')} · ${detailTask.startTime} - ${detailTask.endTime}`
    : '';
  const detailLocation = detailTask?.location ?? 'No location';
  const detailSourceLabel = detailTask?.source === 'calendar' ? 'UCL Timetable' : 'Now';
  const detailDescription = detailTask
    ? `${detailTask.notes ? `${detailTask.notes}\n` : ''}Event: ${detailTask.title}${
        detailTask.type ? `\nEvent type: ${detailTask.type}` : ''
      }`
    : '';
  const detailPriority = detailTask?.goalPriority ?? 'low';
  const detailPriorityLabel = detailPriority === 'low' ? 'LOW' : 'HIGH';
  const detailPriorityIconUri = detailPriority === 'low' ? lowIconUri : highIconUri;
  const detailCommuteSummary = detailTask?.commuteSummary
    ? detailTask.commuteSummary
    : detailTask?.commuteDurationMinutes
    ? `${formatDuration(detailTask.commuteDurationMinutes)}`
    : '';
  const detailCommuteModeLabel = detailTask?.commuteMode
    ? getCommuteModeLabel(detailTask.commuteMode, detailTask.commuteSummary)
    : '';
  const detailCommuteIconUri = detailTask?.commuteMode
    ? getCommuteModeIconUri(detailTask.commuteMode, detailTask.commuteSummary)
    : undefined;
  const detailCommuteDistance = detailTask?.commuteDistanceText;
  const detailCommuteUrl = detailTask?.commuteUrl;

  const handleDetailToggle = async () => {
    if (!detailTask) return;
    if (isFutureSelectedDate) return;
    setDetailTask({ ...detailTask, isCompleted: !detailTask.isCompleted });
    await handleToggle(detailTask.id);
  };

  const handleDetailEdit = async () => {
    if (!detailTask) return;
    closeTaskDetails();
    await openEditTask(detailTask);
  };

  const handleDetailPriorityToggle = async () => {
    if (!detailTask) return;
    const nextPriority = detailTask.goalPriority === 'high' ? 'low' : 'high';
    setDetailTask({ ...detailTask, goalPriority: nextPriority });
    await applyScheduleUpdate(detailTask, { goalPriority: nextPriority });
  };

  const handleOpenCommute = async () => {
    if (!detailCommuteUrl) return;
    const canOpen = await Linking.canOpenURL(detailCommuteUrl);
    if (!canOpen) {
      Alert.alert('Route unavailable', 'Unable to open Google Maps for this route.');
      return;
    }
    await Linking.openURL(detailCommuteUrl);
  };

  useEffect(() => {
    if (!isTodaySelected) return;
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    if (progressData.total === 0) {
      lastProgressRef.current = progressData.progress;
      return;
    }
    const crossedComplete = lastProgressRef.current < 1 && progressData.progress >= 1;
    if (crossedComplete && lastConfettiDateRef.current !== todayKey) {
      triggerConfetti('large');
      lastConfettiDateRef.current = todayKey;
    }
    if (progressData.progress < 1) {
      lastConfettiDateRef.current = null;
    }
    lastProgressRef.current = progressData.progress;
  }, [isTodaySelected, progressData]);

  const triggerConfetti = (intensity: 'small' | 'medium' | 'large' = 'small') => {
    const count = intensity === 'large' ? 28 : intensity === 'medium' ? 18 : 10;
    const startXBase = contentWidth > 0 ? contentWidth / 2 : 180;
    const startYBase = 40;
    const newPieces: typeof confettiPiecesRef.current = [];
    for (let i = 0; i < count; i++) {
      const id = `${Date.now()}-${i}`;
      const color = i % 2 === 0 ? '#FEF8EF' : COLORS.success;
      const width = 6 + Math.floor(Math.random() * 3);
      const height = 2 + Math.floor(Math.random() * 2);
      const startX = startXBase + (Math.random() * 40 - 20);
      const startY = startYBase + (Math.random() * 20 - 10);
      const tx = new Animated.Value(0);
      const ty = new Animated.Value(0);
      const rot = new Animated.Value(0);
      const opacity = new Animated.Value(1);
      newPieces.push({ id, color, startX, startY, width, height, tx, ty, rot, opacity });
      const driftX = (Math.random() * 120 - 60);
      const fallY = 120 + Math.random() * 160;
      const duration = 1200 + Math.random() * 600;
      Animated.parallel([
        Animated.timing(tx, { toValue: driftX, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(ty, { toValue: fallY, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(rot, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (!finished) return;
        confettiPiecesRef.current = confettiPiecesRef.current.filter(p => p.id !== id);
        setConfettiVersion(v => v + 1);
      });
    }
    confettiPiecesRef.current = [...confettiPiecesRef.current, ...newPieces];
    setConfettiVersion(v => v + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader
        centerIcon="view-grid-outline"
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onTabChange={setHeaderTab}
        scheduleVersion={scheduleVersion}
      />
      <View
        style={styles.contentArea}
        onLayout={e => {
          setContentWidth(e.nativeEvent.layout.width);
        }}
      >
        {headerTab !== 'later' ? (
          <>
            <ScrollView contentContainerStyle={styles.scheduleContent} showsVerticalScrollIndicator={false}>
            {scheduleRows.length === 0 ? (
              <Text style={styles.emptyText}>No activities planned</Text>
            ) : (
              scheduleRows.map((row, index) => {
                if (row.kind === 'gap') {
                  const gapStartMins = toMinutes(row.startTime);
                  const gapEndMins = gapStartMins + row.durationMins;
                  const showCurrentLine =
                    isTodaySelected &&
                    currentMinutes >= gapStartMins &&
                    currentMinutes <= gapEndMins;
                  const lineRatio = row.durationMins > 0 ? (currentMinutes - gapStartMins) / row.durationMins : 0;
                  const lineTop = Math.min(1, Math.max(0, lineRatio)) * 100;
                  return (
                    <View key={`gap-${index}`} style={styles.scheduleRow}>
                      <View style={styles.timeColumn}>
                        <Text style={styles.timeText} numberOfLines={1} ellipsizeMode="clip">
                          {row.startTime}
                        </Text>
                      </View>
                      <View style={styles.timelineColumn}>
                        {showCurrentLine ? <View style={[styles.currentTimeLine, { top: `${lineTop}%` as unknown as number }]} /> : null}
                        <View style={styles.timelineDotStack}>
                          {Array.from({ length: 3 }).map((_, dotIndex) => (
                            <View key={`gap-dot-${dotIndex}`} style={[styles.timelineDot, { backgroundColor: '#2C2C2E' }]} />
                          ))}
                        </View>
                      </View>
                      <View style={[styles.card, styles.gapCard, styles.mutedCard]}>
                        <View style={styles.mutedHeader}>
                          <View style={styles.mutedTextBlock}>
                            <Text style={styles.gapTitle}>No planned activities</Text>
                            <Text style={styles.gapDuration}>{formatDuration(row.durationMins)}</Text>
                          </View>
                          <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
                            <Ionicons name="add" size={14} color="#D0D0D6" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                }

                const { item, durationMins } = row;
                const steps = item.steps ?? [];
                const hasSteps = steps.length > 0;
                const completedSteps = steps.filter(step => step.isDone).length;
                const isExpanded = !!expandedIds[item.id];
                const titleLower = item.title.toLowerCase();
                const isSleep = titleLower.includes('sleep');
                const isCommute = item.isCommute || titleLower.includes('commute');
                const isWake = titleLower.includes('wake');
                const isMuted = isCommute;
                const taskVisual = getTaskVisual(item.title);
                const commuteModeLabel = isCommute ? getCommuteModeLabel(item.commuteMode, item.commuteSummary) : '';
                const commuteIconUri = isCommute ? getCommuteModeIconUri(item.commuteMode, item.commuteSummary) : undefined;
                const commuteDurationLabel = item.commuteDurationMinutes
                  ? `${formatDuration(item.commuteDurationMinutes)}`
                  : formatDuration(durationMins);
                const commuteDisplayLabel = commuteModeLabel ? `${commuteModeLabel} · ${commuteDurationLabel}` : commuteDurationLabel;
                const rowHeight = rowHeights[item.id] ?? 0;
                const dotCount = isExpanded && hasSteps
                  ? getDotCountForHeight(rowHeight, 7, 15)
                  : hasSteps
                  ? 5
                  : 3;

                return (
                  <View key={item.id} style={styles.scheduleRow}>
                    <View style={styles.timeColumn}>
                      <Text style={styles.timeText} numberOfLines={1} ellipsizeMode="clip">
                        {item.startTime}
                      </Text>
                    </View>
                    <View style={styles.timelineColumn}>
                      {isWake ? (
                        <>
                          <Ionicons name="sunny" size={16} color="#F7C627" style={styles.timelineIconWake} />
                          <View style={styles.timelineDotStack}>
                            {Array.from({ length: 2 }).map((_, dotIndex) => (
                              <View key={`wake-dot-${dotIndex}`} style={[styles.timelineDot, { backgroundColor: '#F7C627' }]} />
                            ))}
                          </View>
                        </>
                      ) : isSleep ? (
                        <>
                          <View style={[styles.timelineDotStack, styles.sleepDotStack]}>
                            {Array.from({ length: 2 }).map((_, dotIndex) => (
                              <View key={`sleep-dot-${dotIndex}`} style={[styles.timelineDot, { backgroundColor: '#7A5AF8' }]} />
                            ))}
                          </View>
                          <Ionicons name="moon" size={14} color="#7A5AF8" style={styles.timelineIconSleep} />
                        </>
                      ) : (
                        <>
                          <View style={styles.timelineDotStack}>
                            {Array.from({ length: dotCount }).map((_, dotIndex) => (
                              <View
                                key={`dot-${dotIndex}`}
                                style={[
                                  styles.timelineDot,
                                  { backgroundColor: taskVisual.bg },
                                ]}
                              />
                            ))}
                          </View>
                        </>
                      )}
                    </View>
                    <View style={styles.cardSwipeWrap}>
                      <Swipeable
                        renderRightActions={() => renderLightningAction(item)}
                        overshootRight={false}
                      >
                        <LongPressScale
                          style={[
                            styles.card,
                            isMuted && styles.mutedCard,
                            isSleep && styles.sleepCard,
                          ]}
                          activeOpacity={0.85}
                          onLongPress={() => openTaskMenu(item)}
                          delayLongPress={250}
                          onLayout={(e: LayoutChangeEvent) => {
                            const nextHeight = Math.round(e.nativeEvent.layout.height);
                            setRowHeights(prev => (prev[item.id] === nextHeight ? prev : { ...prev, [item.id]: nextHeight }));
                          }}
                          onPress={() => openTaskDetails(item)}
                        >
                          <>
                      <View style={styles.cardHeader}>
                        <View style={[styles.cardIcon, { backgroundColor: taskVisual.bg }, item.isCompleted && styles.cardIconDimmed]}>
                          <Text style={[styles.cardEmoji, item.isCompleted && styles.cardEmojiDimmed]}>{taskVisual.emoji}</Text>
                        </View>
                        <View style={styles.cardText}>
                          <Text
                            style={[styles.cardTitle, isMuted && styles.mutedTitle, item.isCompleted && styles.cardTitleCompleted]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.title}
                          </Text>
                          {isCommute ? (
                            <View style={styles.commuteDurationRow}>
                              {commuteIconUri ? <SvgUri uri={commuteIconUri} width={12} height={12} /> : null}
                              <Text style={[styles.cardDuration, isMuted && styles.mutedDuration, item.isCompleted && styles.cardDurationCompleted]}>
                                {commuteDisplayLabel}
                              </Text>
                            </View>
                          ) : (
                            <Text style={[styles.cardDuration, isMuted && styles.mutedDuration, item.isCompleted && styles.cardDurationCompleted]}>
                              {formatDuration(durationMins)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.cardCheckZone}
                        onPress={() => handleToggle(item.id)}
                        activeOpacity={0.85}
                      >
                        <TaskCheck isActive={!!item.isCompleted} size={20} radius={6} inset={5} />
                      </TouchableOpacity>
                      {hasSteps ? (
                        <TouchableOpacity
                          style={styles.expandRow}
                          activeOpacity={0.8}
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setExpandedIds(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                          }}
                        >
                          <View style={styles.expandLeft}>
                            <View style={styles.progressPill} />
                            <Text style={styles.stepCountText}>
                              {completedSteps}/{steps.length}
                            </Text>
                          </View>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={COLORS.textDim}
                          />
                        </TouchableOpacity>
                      ) : null}
                      {hasSteps && isExpanded ? (
                        <View style={styles.stepList}>
                          {steps.map((step, stepIndex) => {
                            const stepDuration = parseDurationFromLabel(step.label);
                            const stepInfo = getStepIcon(step.label, stepIndex);
                            return (
                              <View key={step.id} style={styles.stepRow}>
                              <View style={[styles.stepIcon, { backgroundColor: stepInfo.bg }]}>
                                <Text style={styles.stepEmoji}>{stepInfo.emoji}</Text>
                              </View>
                                <View style={styles.stepTextWrap}>
                                  <Text style={[styles.stepText, step.isDone && styles.stepTextDone]}>{step.label}</Text>
                                  {stepDuration ? (
                                    <Text style={styles.stepDuration}>{formatDuration(stepDuration)}</Text>
                                  ) : null}
                                </View>
                                <TouchableOpacity
                                  style={[styles.stepCheck, step.isDone && styles.stepCheckActive]}
                                  onPress={() => handleToggleStep(item.id, step.id)}
                                  activeOpacity={0.8}
                                >
                                  {step.isDone ? (
                                    <Ionicons name="checkmark" size={14} color="#0B0B0C" />
                                  ) : null}
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                      ) : null}
                          </>
                        </LongPressScale>
                      </Swipeable>
                    </View>
                </View>
              );
            })
          )}
          <View style={[styles.scheduleRow, styles.endRow]}>
            <View style={styles.timeColumn}>
              <Text style={[styles.timeText, styles.endTimeText]}>{endOfDayLabel}</Text>
            </View>
            <View style={styles.timelineColumn} />
            <View style={styles.endSpacer} />
          </View>
            </ScrollView>
            <View pointerEvents="none" style={styles.confettiOverlay}>
              {confettiPiecesRef.current.map(piece => {
                const rotateInterpolate = piece.rot.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${Math.random() > 0.5 ? 180 : -180}deg`],
                });
                return (
                  <Animated.View
                    key={piece.id}
                    style={{
                      position: 'absolute',
                      left: piece.startX,
                      top: piece.startY,
                      width: piece.width,
                      height: piece.height,
                      backgroundColor: piece.color,
                      opacity: piece.opacity,
                      borderRadius: 2,
                      transform: [
                        { translateX: piece.tx },
                        { translateY: piece.ty },
                        { rotate: rotateInterpolate },
                      ],
                    }}
                  />
                );
              })}
            </View>
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.laterContent} showsVerticalScrollIndicator={false}>
            <View style={styles.laterList}>
              {laterItems.map(item => {
                const taskVisual = getTaskVisual(item.title);
                const itemDate = item.date ? parseISO(item.date) : selectedDate;
                return (
                  <Swipeable
                    key={item.id}
                    renderRightActions={() => renderLightningAction(item)}
                    overshootRight={false}
                  >
                    <LongPressScale
                      style={styles.laterCard}
                      activeOpacity={0.9}
                      onLongPress={() => openTaskMenu(item)}
                      delayLongPress={250}
                    >
                      <View style={styles.laterCardHeader}>
                        <View style={[styles.laterIcon, { backgroundColor: taskVisual.bg }, item.isCompleted && styles.laterIconDimmed]}>
                          <Text style={[styles.laterIconEmoji, item.isCompleted && styles.laterIconEmojiDimmed]}>{taskVisual.emoji}</Text>
                        </View>
                        <View style={styles.laterCardText}>
                          <Text
                            style={[styles.laterCardTitle, item.isCompleted && styles.laterCardTitleCompleted]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.title}
                          </Text>
                          <Text style={[styles.laterCardMeta, item.isCompleted && styles.laterCardMetaCompleted]}>
                            {`By ${format(itemDate, 'do MMMM')}`}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.laterCardCheck}
                          activeOpacity={0.85}
                          onPress={() => handleLaterToggle(item.id)}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <TaskCheck isActive={!!item.isCompleted} size={24} radius={8} inset={6} />
                        </TouchableOpacity>
                      </View>
                    </LongPressScale>
                  </Swipeable>
                );
              })}
              <View style={[styles.laterCard, styles.laterAddCard]}>
                <View style={styles.laterCardHeader}>
                  <Text style={styles.laterAddText}>Add Another Task</Text>
                  <View style={styles.laterAddButton}>
                    <Ionicons name="add" size={16} color={COLORS.textDim} />
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
      <Modal visible={detailVisible} transparent animationType="fade" onRequestClose={closeTaskDetails}>
        <View style={styles.detailOverlay}>
          <BlurView intensity={Platform.OS === 'ios' ? 60 : 28} tint="dark" style={StyleSheet.absoluteFillObject} />
          <TouchableOpacity style={styles.detailBackdrop} activeOpacity={1} onPress={closeTaskDetails} />
          <View style={styles.detailCard}>
            <BlurView intensity={Platform.OS === 'ios' ? 52 : 24} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={styles.detailCardTint} pointerEvents="none" />
            {detailTask ? (
              <>
                <View style={styles.detailCardContent}>
                  <View style={styles.detailHeader}>
                    <View style={[styles.detailIcon, { backgroundColor: detailVisual?.bg }]}>
                      <Text style={styles.detailIconEmoji}>{detailVisual?.emoji}</Text>
                    </View>
                    <View style={styles.detailHeaderText}>
                      <Text style={styles.detailTitle} numberOfLines={2} ellipsizeMode="tail">
                        {detailTitle}
                      </Text>
                      {detailTypeLabel ? (
                        <Text style={styles.detailSubtitle}>{detailTypeLabel}</Text>
                      ) : null}
                    </View>
                    <View style={styles.detailHeaderRight}>
                      <TouchableOpacity style={styles.detailPriorityRow} activeOpacity={0.85} onPress={handleDetailPriorityToggle}>
                        <SvgUri uri={detailPriorityIconUri} width={12} height={12} />
                        <Text style={styles.detailPriorityText}>{detailPriorityLabel}</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.detailCheck}
                      onPress={handleDetailToggle}
                      activeOpacity={0.85}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <TaskCheck isActive={!!detailTask.isCompleted} size={22} radius={7} inset={5} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.detailRows}>
                    <View style={styles.detailRow}>
                      <SvgUri uri={clockIconUri} width={14} height={14} />
                      <Text style={styles.detailRowText}>{detailTimeLabel}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <SvgUri uri={mapIconUri} width={14} height={14} />
                      <Text style={styles.detailRowText}>{detailLocation}</Text>
                    </View>
                    {detailTask.isCommute || detailCommuteSummary ? (
                      <View style={styles.detailRow}>
                        <SvgUri uri={detailCommuteIconUri ?? timetableIconUri} width={14} height={14} />
                        <View style={styles.detailRowStack}>
                          <Text style={styles.detailRowText}>
                            {detailCommuteModeLabel
                              ? `${detailCommuteModeLabel} · ${detailCommuteSummary || 'Route details unavailable'}`
                              : detailCommuteSummary || 'Route details unavailable'}
                          </Text>
                          {detailCommuteDistance ? (
                            <Text style={styles.detailRowSubText}>{detailCommuteDistance}</Text>
                          ) : null}
                        </View>
                      </View>
                    ) : null}
                    <View style={styles.detailRow}>
                      <SvgUri uri={detailIconUri} width={14} height={14} />
                      <Text style={styles.detailRowText}>{detailDescription}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <SvgUri uri={timetableIconUri} width={14} height={14} />
                      <View style={styles.detailRowStack}>
                        <Text style={styles.detailRowText}>{detailSourceLabel}</Text>
                        <Text style={styles.detailRowSubText}>{detailTask.externalId ?? ''}</Text>
                      </View>
                    </View>
                  </View>
                  {detailCommuteUrl ? (
                    <TouchableOpacity style={styles.detailCommuteButton} activeOpacity={0.85} onPress={handleOpenCommute}>
                      <SvgUri uri={mapIconUri} width={14} height={14} />
                      <Text style={styles.detailCommuteButtonText}>Open in Google Maps</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.detailEditButton} activeOpacity={0.85} onPress={handleDetailEdit}>
                  <SvgUri uri={editIconUri} width={16} height={16} />
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
      <Modal visible={actionSheetMounted} transparent animationType="fade" onRequestClose={closeTaskMenu}>
        <View style={styles.actionSheetOverlay}>
          <Animated.View style={[styles.actionSheetBackdrop, { opacity: actionSheetAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeTaskMenu} />
          </Animated.View>
          <Animated.View
            style={[
              styles.actionSheetCard,
              {
                opacity: actionSheetAnim,
                transform: [
                  {
                    translateY: actionSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                  {
                    scale: actionSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <BlurView intensity={Platform.OS === 'ios' ? 70 : 30} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={styles.actionSheetTint} />
            <View style={styles.actionSheetList}>
              {[
                { key: 'priority', label: 'Prioritise', icon: prioritiseActionIconUri },
                { key: 'copy', label: 'Duplicate', icon: copyActionIconUri },
                { key: 'todo', label: 'Move to later', icon: moveActionIconUri },
                { key: 'reschedule', label: 'Reschedule', icon: rescheduleActionIconUri },
                { key: 'tomorrow', label: 'Reschedule for tomorrow', icon: rescheduleTomorrowIconUri },
                { key: 'start', label: 'Start', icon: startActionIconUri },
                { key: 'edit', label: 'Edit', icon: editActionIconUri },
                { key: 'delete', label: 'Delete Task', icon: deleteActionIconUri, destructive: true },
              ].map((action, index, list) => {
                const isRestricted =
                  !!actionTask &&
                  isWakeOrSleep(actionTask) &&
                  ['copy', 'todo', 'tomorrow', 'delete'].includes(action.key);
                return (
                  <TouchableOpacity
                    key={action.key}
                    style={[
                      styles.actionSheetRow,
                      index === list.length - 1 && styles.actionSheetRowLast,
                      isRestricted && styles.actionSheetRowDisabled,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (isRestricted) return;
                      handleActionPress(action.key);
                    }}
                  >
                    <SvgUri uri={action.icon} width={18} height={18} />
                    <Text
                      style={[
                        styles.actionSheetText,
                        action.destructive && styles.actionSheetTextDestructive,
                        isRestricted && styles.actionSheetTextDisabled,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
      <Modal visible={rescheduleVisible && Platform.OS === 'ios'} transparent animationType="fade" onRequestClose={() => setRescheduleVisible(false)}>
        <View style={styles.datePickerOverlay}>
          <TouchableOpacity style={styles.datePickerBackdrop} activeOpacity={1} onPress={() => setRescheduleVisible(false)} />
          <View style={styles.datePickerCard}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setRescheduleVisible(false)} activeOpacity={0.85}>
                <Text style={styles.datePickerAction}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRescheduleSave} activeOpacity={0.85}>
                <Text style={styles.datePickerActionActive}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={rescheduleDate}
              mode="date"
              display="spinner"
              onChange={handleRescheduleChange}
              themeVariant="dark"
              textColor={COLORS.white}
            />
          </View>
        </View>
      </Modal>
      {Platform.OS === 'android' && rescheduleVisible ? (
        <DateTimePicker
          value={rescheduleDate}
          mode="date"
          display="calendar"
          onChange={handleRescheduleChange}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  greeting: {
      color: COLORS.white,
      fontSize: FONTS.h2, // Smaller than previous 'Hero'
      fontWeight: 'bold',
      marginLeft: SPACING.l,
      marginBottom: SPACING.s,
      marginTop: SPACING.s,
  },
  emptyText: {
      color: COLORS.textDim,
      textAlign: 'center',
      marginTop: SPACING.xl,
  },
  contentArea: {
    flex: 1,
  },
  scheduleContent: {
    paddingHorizontal: 0,
    paddingRight: 0,
    paddingBottom: 140,
  },
  laterContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 160,
    paddingTop: 4,
  },
  laterList: {
    marginTop: 2,
    gap: 14,
  },
  laterCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#535353',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  laterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  laterIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterIconDimmed: {
    opacity: 0.7,
  },
  laterIconEmoji: {
    fontSize: 14,
  },
  laterIconEmojiDimmed: {
    opacity: 0.45,
  },
  laterCardText: {
    flex: 1,
  },
  laterCardTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  laterCardTitleCompleted: {
    color: COLORS.textDim,
    textDecorationLine: 'line-through',
  },
  laterCardMeta: {
    color: '#9A9AA0',
    fontSize: 11,
    marginTop: 2,
  },
  laterCardMetaCompleted: {
    color: '#5C5C60',
  },
  laterCardCheck: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterAddCard: {
    backgroundColor: '#000000',
    borderStyle: 'dashed',
    borderWidth: 2.2,
    borderColor: '#535353',
  },
  laterAddText: {
    color: '#5C5C60',
    fontSize: 12,
    fontWeight: '600',
  },
  laterAddButton: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#2D2D30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSwipeWrap: {
    flex: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 14,
  },
  timeColumn: {
    width: 44,
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingLeft: 6,
  },
  timeText: {
    color: '#B0B0B6',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 0,
    width: 44,
    textAlign: 'left',
  },
  timelineColumn: {
    width: 12,
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingBottom: 0,
    position: 'relative',
  },
  currentTimeLine: {
    position: 'absolute',
    left: -34,
    width: 28,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.success,
    zIndex: 2,
  },
  timelineDotStack: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: 6,
  },
  sleepDotStack: {
    marginBottom: 4,
  },
  timelineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  timelineIconWake: {
    marginTop: 2,
    marginBottom: 4,
    alignSelf: 'flex-start',
    marginLeft: -5,
  },
  timelineIconSleep: {
    marginTop: 4,
    alignSelf: 'flex-start',
    marginLeft: -4,
  },
  timeLabelOverlay: {
    position: 'absolute',
    left: -90,
    top: 0,
    color: '#9A9AA0',
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
    width: 90,
    textAlign: 'right',
    opacity: 0,
  },
  endTimeText: {
    marginTop: -8,
  },
  timelineEndMoon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  endRow: {
    marginTop: 6,
    marginBottom: 0,
  },
  endSpacer: {
    flex: 1,
    height: 10,
  },
  confettiOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  card: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 62,
    borderWidth: 1,
    borderColor: '#535353',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'visible',
  },
  gapCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'visible',
  },
  gapDashBorder: {
    ...StyleSheet.absoluteFillObject,
  },
  mutedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mutedTextBlock: {
    flex: 1,
  },
  addButton: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#2D2D30',
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gapTitle: {
    color: '#5C5C60',
    fontSize: 12,
    fontWeight: '500',
  },
  gapDuration: {
    color: '#5C5C60',
    fontSize: 10,
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 56,
  },
  cardIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 12,
    lineHeight: 13,
  },
  cardEmojiDimmed: {
    opacity: 0.45,
  },
  cardIconDimmed: {
    opacity: 0.7,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitleCompleted: {
    color: COLORS.textDim,
    textDecorationLine: 'line-through',
  },
  cardDuration: {
    color: COLORS.textDim,
    fontSize: 10,
    marginTop: 2,
  },
  commuteDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  cardDurationCompleted: {
    color: '#5C5C60',
  },
  checkBase: {
    borderWidth: 2,
    borderColor: '#FEF8EF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  checkBaseActive: {
    borderColor: '#28CA99',
    backgroundColor: '#28CA99',
  },
  checkGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#28CA99',
    shadowColor: '#28CA99',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  cardCheckZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#202024',
  },
  expandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressPill: {
    width: 28,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#2C2C2E',
  },
  stepCountText: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: '600',
  },
  stepList: {
    marginTop: 10,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepEmoji: {
    fontSize: 14,
    lineHeight: 16,
  },
  stepTextWrap: {
    flex: 1,
  },
  stepText: {
    flex: 1,
    color: '#D0D0D6',
    fontSize: 12,
  },
  stepTextDone: {
    color: COLORS.textDim,
  },
  stepDuration: {
    color: COLORS.textDim,
    fontSize: 10,
    marginTop: 2,
  },
  stepCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FEF8EF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  mutedCard: {
    backgroundColor: '#000000',
    borderStyle: 'dashed',
    borderColor: '#535353',
    overflow: 'visible',
    borderWidth: 2.2,
  },
  sleepCard: {},
  mutedTitle: {
    color: '#6B6B70',
    fontSize: 12,
    fontWeight: '600',
  },
  mutedDuration: {
    color: '#6B6B70',
    fontSize: 10,
    marginTop: 2,
  },
  mutedCheck: {
    borderColor: '#2C2C2E',
  },
  swipeActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12,
  },
  swipeActionButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionLightning: {
    backgroundColor: '#28CA99',
    shadowColor: '#28CA99',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  swipeActionDelete: {
    backgroundColor: '#FF5A5F',
    shadowColor: '#E24B4B',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  swipeActionDisabled: {
    opacity: 0.5,
  },
  detailOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  detailBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  detailCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    width: '100%',
    overflow: 'hidden',
  },
  detailCardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  detailCardContent: {
    padding: 16,
    paddingBottom: 34,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailIconEmoji: {
    fontSize: 14,
  },
  detailHeaderText: {
    flex: 1,
    paddingRight: 6,
  },
  detailTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  detailSubtitle: {
    color: '#9A9AA0',
    fontSize: 12,
    marginTop: 2,
  },
  detailHeaderRight: {
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 8,
  },
  detailPriorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailPriorityText: {
    color: '#9A9AA0',
    fontSize: 10,
    fontWeight: '700',
  },
  detailCheck: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginTop: 2,
  },
  detailRows: {
    marginTop: 12,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailRowText: {
    color: '#D0D0D6',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  detailRowStack: {
    flex: 1,
    gap: 2,
  },
  detailRowSubText: {
    color: '#7D7D82',
    fontSize: 11,
  },
  detailCommuteButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailCommuteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailEditButton: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(254,248,239,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  actionSheetOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  actionSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  actionSheetCard: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(12,12,12,0.88)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  actionSheetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  actionSheetList: {
    gap: 8,
  },
  actionSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  actionSheetRowLast: {
    paddingBottom: 10,
  },
  actionSheetRowDisabled: {
    opacity: 0.5,
  },
  actionSheetText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  actionSheetTextDestructive: {
    color: '#FF5A5F',
  },
  actionSheetTextDisabled: {
    color: COLORS.textDim,
  },
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  datePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  datePickerCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: SPACING.l,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  datePickerAction: {
    color: COLORS.textDim,
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerActionActive: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

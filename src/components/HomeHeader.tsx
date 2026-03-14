import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, PanResponder, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addDays, startOfWeek, isSameDay, isAfter, addWeeks } from 'date-fns';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path, SvgUri } from 'react-native-svg';
import { COLORS, SPACING } from '../constants/theme';
import { DailyCompletionEntry } from '../types';
import { StorageService } from '../services/storage';

interface Props {
  centerIcon?: string;
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  hideCalendar?: boolean;
  hideCenterIcon?: boolean;
  onTabChange?: (tab: 'today' | 'week' | 'later') => void;
  scheduleVersion?: number;
}

export const HomeHeader = ({
  centerIcon = 'bulb-outline',
  selectedDate,
  onSelectDate,
  hideCalendar = false,
  hideCenterIcon = false,
  onTabChange,
  scheduleVersion,
}: Props) => {
  const navigation = useNavigation<any>();
  const xpIconUri = Image.resolveAssetSource(require('../../assets/XP ICON.svg')).uri;
  const coinIconUri = Image.resolveAssetSource(require('../../assets/COIN ICON.svg')).uri;
  const settingsIconUri = Image.resolveAssetSource(require('../../assets/SETTINGS ICON.svg')).uri;
  const [internalDate, setInternalDate] = useState(new Date());
  const [name, setName] = useState('Mitu Kitu');
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(300);
  const [completionHistory, setCompletionHistory] = useState<Record<string, DailyCompletionEntry>>({});
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'later'>('today');
  const activeDate = selectedDate ?? internalDate;
  const today = new Date();
  const [stripWidth, setStripWidth] = useState(0);
  const stripWidthRef = useRef(0);
  const baseOffsetRef = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const ringAnimations = useRef<Record<string, Animated.Value>>({});
  const AnimatedCircle = useMemo(() => Animated.createAnimatedComponent(Circle), []);

  const handleTabChange = (tab: 'today' | 'week' | 'later') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const computeCompletionFromSchedule = useCallback((dateKey: string, schedule: any[]) => {
    const items = schedule.filter(item => item.date === dateKey && !item.isDeleted);
    let total = 0;
    let completed = 0;
    items.forEach(item => {
      const steps = item.steps ?? [];
      if (steps.length > 0) {
        total += steps.length;
        completed += steps.filter((step: any) => step.isDone).length;
      } else {
        total += 1;
        if (item.isCompleted) completed += 1;
      }
    });
    return { date: dateKey, total, completed };
  }, []);
  const getCompletionEntry = (
    date: Date,
    completion: Record<string, DailyCompletionEntry>,
    schedule: any[],
  ) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const fromHistory = completion[dateKey];
    if (fromHistory) return fromHistory;
    return computeCompletionFromSchedule(dateKey, schedule);
  };

  const computeStreak = (completion: Record<string, DailyCompletionEntry>, schedule: any[]) => {
    const isComplete = (entry: DailyCompletionEntry) => entry.total > 0 && entry.completed >= entry.total;
    let count = 0;
    let cursor = new Date();
    let entry = getCompletionEntry(cursor, completion, schedule);
    if (!isComplete(entry)) {
      cursor = addDays(cursor, -1);
      entry = getCompletionEntry(cursor, completion, schedule);
    }
    while (isComplete(entry)) {
      count += 1;
      cursor = addDays(cursor, -1);
      entry = getCompletionEntry(cursor, completion, schedule);
    }
    return count;
  };

  const loadHeaderData = useCallback(async () => {
    const profile = await StorageService.getUserProfile();
    if (profile?.name) {
      setName(profile.name);
    }
    if (typeof profile?.xp === 'number') {
      setXp(profile.xp);
    }
    const schedule = await StorageService.getSchedule();
    const completion = await StorageService.getDailyCompletionHistory();
    setScheduleItems(schedule);
    setCompletionHistory(completion);
    const nextStreak = computeStreak(completion, schedule);
    setStreak(nextStreak);
    if (profile && profile.streak !== nextStreak) {
      await StorageService.saveUserProfile({ ...profile, streak: nextStreak });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHeaderData();
    }, [loadHeaderData])
  );

  useEffect(() => {
    if (scheduleVersion === undefined) return;
    loadHeaderData();
  }, [scheduleVersion, loadHeaderData]);

  const weekStart = useMemo(() => startOfWeek(activeDate, { weekStartsOn: 1 }), [activeDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);
  const prevWeekStart = useMemo(() => addWeeks(weekStart, -1), [weekStart]);
  const nextWeekStart = useMemo(() => addWeeks(weekStart, 1), [weekStart]);
  const prevWeekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(prevWeekStart, i)), [prevWeekStart]);
  const nextWeekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(nextWeekStart, i)), [nextWeekStart]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const todayKey = format(today, 'yyyy-MM-dd');
  const activeDateKey = format(activeDate, 'yyyy-MM-dd');
  const weekStartKey = format(weekStart, 'yyyy-MM-dd');
  const weekEndKey = format(weekEnd, 'yyyy-MM-dd');
  const isAllDayItem = (item: any) =>
    item?.isLater || (item?.source === 'calendar' && item?.startTime === '00:00' && item?.endTime === '23:59');
  const { todayCount, weekCount, laterCount } = useMemo(() => {
    const items = scheduleItems.filter(item => !item.isDeleted);
    let todayTasks = 0;
    let weekTasks = 0;
    let laterTasks = 0;
    items.forEach(item => {
      const itemDateKey = item.date ?? activeDateKey;
      if (isAllDayItem(item)) {
        if (item.date && itemDateKey >= activeDateKey) {
          laterTasks += 1;
        }
        return;
      }
      if (itemDateKey === activeDateKey) {
        todayTasks += 1;
        return;
      }
      if (item.date && itemDateKey >= weekStartKey && itemDateKey <= weekEndKey) {
        weekTasks += 1;
        return;
      }
    });
    return { todayCount: todayTasks, weekCount: weekTasks, laterCount: laterTasks };
  }, [scheduleItems, activeDateKey, weekStartKey, weekEndKey]);
  const { todayTasks, weekTasks, laterTasks } = useMemo(() => {
    const items = scheduleItems.filter(item => !item.isDeleted);
    const todayList: any[] = [];
    const weekList: any[] = [];
    const laterList: any[] = [];
    items.forEach(item => {
      const itemDateKey = item.date ?? activeDateKey;
      if (isAllDayItem(item)) {
        if (item.date && itemDateKey >= activeDateKey) {
          laterList.push(item);
        }
        return;
      }
      if (itemDateKey === activeDateKey) {
        todayList.push(item);
        return;
      }
      if (item.date && itemDateKey >= weekStartKey && itemDateKey <= weekEndKey) {
        weekList.push(item);
        return;
      }
    });
    return { todayTasks: todayList, weekTasks: weekList, laterTasks: laterList };
  }, [scheduleItems, activeDateKey, weekStartKey, weekEndKey]);

  const handleSelectDate = (date: Date) => {
    if (onSelectDate) {
      onSelectDate(date);
      return;
    }
    setInternalDate(date);
  };

  const shiftWeek = (direction: 'prev' | 'next') => {
    const nextDate = addWeeks(activeDate, direction === 'prev' ? -1 : 1);
    handleSelectDate(nextDate);
  };
  const shiftWeekRef = useRef(shiftWeek);
  useEffect(() => {
    shiftWeekRef.current = shiftWeek;
  }, [shiftWeek]);

  useEffect(() => {
    stripWidthRef.current = stripWidth;
    if (!stripWidth) return;
    baseOffsetRef.current = -stripWidth;
    translateX.setValue(-stripWidth);
  }, [stripWidth, weekStartKey, translateX]);

  const swipeHandlers = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        !isAnimatingRef.current && Math.abs(gesture.dx) > 6 && Math.abs(gesture.dy) < 12,
      onPanResponderMove: (_, gesture) => {
        const width = stripWidthRef.current;
        if (!width || isAnimatingRef.current) return;
        translateX.setValue(baseOffsetRef.current + gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        const width = stripWidthRef.current;
        if (!width || isAnimatingRef.current) return;
        const threshold = width * 0.22;
        if (gesture.dx < -threshold) {
          isAnimatingRef.current = true;
          Animated.timing(translateX, {
            toValue: baseOffsetRef.current - width,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            shiftWeekRef.current('next');
            translateX.setValue(baseOffsetRef.current);
            isAnimatingRef.current = false;
          });
          return;
        }
        if (gesture.dx > threshold) {
          isAnimatingRef.current = true;
          Animated.timing(translateX, {
            toValue: baseOffsetRef.current + width,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            shiftWeekRef.current('prev');
            translateX.setValue(baseOffsetRef.current);
            isAnimatingRef.current = false;
          });
          return;
        }
        isAnimatingRef.current = true;
        Animated.timing(translateX, {
          toValue: baseOffsetRef.current,
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          isAnimatingRef.current = false;
        });
      },
    })
  ).current;

  const getCompletionForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const fromHistory = completionHistory[dateKey];
    if (fromHistory) return fromHistory;
    return computeCompletionFromSchedule(dateKey, scheduleItems);
  };

  const ringSize = 40;
  const ringStrokeWidth = 5;
  const ringRadius = (ringSize - ringStrokeWidth) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashCount = 8;
  const ringDashLength = ringCircumference / (ringDashCount * 2);
  const ringDashArray = `${ringDashLength} ${ringDashLength}`;
  const ringDays = useMemo(
    () => [...prevWeekDays, ...weekDays, ...nextWeekDays],
    [prevWeekDays, weekDays, nextWeekDays]
  );
  const ringProgressByDate = useMemo(() => {
    const map: Record<string, number> = {};
    ringDays.forEach(day => {
      const completion = getCompletionForDate(day);
      const ratio = completion?.total ? completion.completed / completion.total : 0;
      map[format(day, 'yyyy-MM-dd')] = Math.max(0, Math.min(1, ratio));
    });
    return map;
  }, [ringDays, completionHistory, scheduleItems, computeCompletionFromSchedule]);

  useEffect(() => {
    if (!scheduleItems.length) return;
    const todayKey = format(today, 'yyyy-MM-dd');
    const targetDays = [...ringDays, today];
    const missingEntries: DailyCompletionEntry[] = [];
    targetDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      if (!completionHistory[dateKey]) {
        missingEntries.push(computeCompletionFromSchedule(dateKey, scheduleItems));
      }
    });
    if (missingEntries.length === 0) return;
    const updated = { ...completionHistory };
    missingEntries.forEach(entry => {
      updated[entry.date] = entry;
    });
    setCompletionHistory(updated);
    missingEntries.forEach(entry => {
      StorageService.upsertDailyCompletion(entry);
    });
  }, [completionHistory, ringDays, scheduleItems, today, computeCompletionFromSchedule]);

  useEffect(() => {
    Object.entries(ringProgressByDate).forEach(([dateKey, ratio]) => {
      const existing = ringAnimations.current[dateKey];
      if (!existing) {
        ringAnimations.current[dateKey] = new Animated.Value(ratio);
        return;
      }
      Animated.timing(existing, {
        toValue: ratio,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
  }, [ringProgressByDate]);

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const renderWeek = (days: Date[], keyPrefix: string) => (
    <View key={keyPrefix} style={[styles.daysRow, { width: stripWidth || undefined }]}>
      {days.map(day => {
        const isSelected = isSameDay(day, activeDate);
        const isToday = isSameDay(day, today);
        const dateKey = format(day, 'yyyy-MM-dd');
        const ratio = ringProgressByDate[dateKey] ?? 0;
        const isFuture = isAfter(day, today);
        const dashed = isFuture && ratio === 0;
        const dashArray = ringDashArray;
        let animatedProgress = ringAnimations.current[dateKey];
        if (!animatedProgress) {
          animatedProgress = new Animated.Value(ratio);
          ringAnimations.current[dateKey] = animatedProgress;
        }
        const animatedOffset = animatedProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [ringCircumference, 0],
          extrapolate: 'clamp',
        });
        const animatedColor = animatedProgress.interpolate({
          inputRange: [0, 0.25, 0.85, 1],
          outputRange: ['#E4504B', '#F4B740', '#3CAE74', '#3CAE74'],
          extrapolate: 'clamp',
        });

        return (
          <TouchableOpacity key={dateKey} style={styles.dayItem} onPress={() => handleSelectDate(day)}>
            <View style={[styles.dayLetterPill, isToday && styles.dayLetterPillActive]}>
              <Text style={[styles.dayLetter, isToday && styles.dayLetterActive]}>
                {format(day, 'EEEEE')}
              </Text>
            </View>
            <View style={styles.dayRingWrapper}>
              {!isSelected && (
                <Svg width={ringSize} height={ringSize}>
                  <Circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    stroke="#2A2A2A"
                    strokeWidth={ringStrokeWidth}
                    fill="transparent"
                    strokeDasharray={dashed ? dashArray : undefined}
                    strokeLinecap={dashed ? 'round' : 'butt'}
                  />
                  <AnimatedCircle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    stroke={animatedColor}
                    strokeWidth={ringStrokeWidth}
                    fill="transparent"
                    strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                    strokeDashoffset={animatedOffset}
                    strokeLinecap="round"
                    rotation={-90}
                    originX={ringSize / 2}
                    originY={ringSize / 2}
                  />
                </Svg>
              )}
              <View style={[styles.dayNumberWrap, isSelected && styles.dayNumberWrapSelected]}>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>{format(day, 'd')}</Text>
              </View>
              {isSelected && (
                <View style={styles.dayProgressOverlay}>
                  <Svg width={ringSize} height={ringSize}>
                    <AnimatedCircle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={ringRadius}
                      stroke={animatedColor}
                      strokeWidth={ringStrokeWidth}
                      fill="transparent"
                      strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                      strokeDashoffset={animatedOffset}
                      strokeLinecap="round"
                      rotation={-90}
                      originX={ringSize / 2}
                      originY={ringSize / 2}
                    />
                  </Svg>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={styles.avatarSquare} />
          <View style={styles.userMeta}>
            <Text style={styles.userName}>{name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <View style={styles.statIconWrap}>
                  <Image source={require('../../assets/FIRE ICON.png')} style={styles.fireIcon} />
                </View>
                <Text style={styles.statText}>{String(streak).padStart(3, '0')}</Text>
              </View>
              <View style={styles.statPill}>
                <View style={styles.statIconWrap}>
                  <SvgUri uri={xpIconUri} width={22} height={22} preserveAspectRatio="xMidYMid slice" />
                </View>
                <Text style={styles.statText}>{String(xp).padStart(3, '0')}</Text>
              </View>
              <View style={styles.statPill}>
                <View style={styles.statIconWrap}>
                  <SvgUri uri={coinIconUri} width={22} height={22} preserveAspectRatio="xMidYMid slice" />
                </View>
                <Text style={styles.statText}>{String(coins).padStart(3, '0')}</Text>
              </View>
            </View>
          </View>
        </View>

        {hideCalendar && !hideCenterIcon ? (
          <View style={styles.topCenterAbsolute}>
            <MaterialCommunityIcons name={centerIcon as any} size={24} color={COLORS.white} />
          </View>
        ) : null}

        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <SvgUri uri={settingsIconUri} width={26} height={26} preserveAspectRatio="xMidYMid meet" />
        </TouchableOpacity>
      </View>

      {!hideCalendar && (
        <View style={styles.calendarSection}>
          <Text style={styles.monthLabel}>{format(activeDate, 'MMMM')}</Text>
          <View style={styles.weekRow}>
            <TouchableOpacity style={[styles.weekArrow, styles.weekArrowLeft]} onPress={() => shiftWeek('prev')}>
              <Svg width={12} height={12} viewBox="0 0 12 12">
                <Path
                  d="M8.5 2.5 L4.5 6 L8.5 9.5"
                  stroke={COLORS.white}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </TouchableOpacity>
            <View
              style={styles.daysViewport}
              onLayout={e => setStripWidth(e.nativeEvent.layout.width)}
              {...swipeHandlers.panHandlers}
            >
              <Animated.View style={[styles.daysStrip, { transform: [{ translateX }] }]}>
                {renderWeek(prevWeekDays, 'prev')}
                {renderWeek(weekDays, 'current')}
                {renderWeek(nextWeekDays, 'next')}
              </Animated.View>
            </View>
            <TouchableOpacity style={styles.weekArrow} onPress={() => shiftWeek('next')}>
              <Svg width={12} height={12} viewBox="0 0 12 12">
                <Path
                  d="M3.5 2.5 L7.5 6 L3.5 9.5"
                  stroke={COLORS.white}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </TouchableOpacity>
          </View>
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === 'today' && styles.tabPillActive,
              ]}
              activeOpacity={0.85}
              onPress={() => handleTabChange('today')}
            >
              <Text style={styles.tabLabel}>{`TODAY (${todayCount})`}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === 'later' && styles.tabPillActive,
              ]}
              activeOpacity={0.85}
              onPress={() => handleTabChange('later')}
            >
              <Text style={styles.tabLabel}>{`LATER (${laterCount})`}</Text>
            </TouchableOpacity>
          </View>
          {activeTab === 'later' ? null : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topCenterAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatarSquare: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEF8EF',
  },
  userMeta: {
    justifyContent: 'center',
    gap: 4,
  },
  userName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 8,
  },
  statIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fireIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  statText: {
    color: '#0B0B0C',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
    letterSpacing: 1,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    alignSelf: 'flex-start',
  },
  streakIcon: {
    marginTop: 1,
  },
  streakBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  calendarSection: {
    marginBottom: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 6,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 6,
    position: 'relative',
    flex: 1,
  },
  tabPillActive: {
    borderWidth: 1.5,
    borderColor: '#FEF8EF',
    backgroundColor: '#88C29A',
  },
  tabLabel: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
    letterSpacing: 2,
  },
  laterOnlyWrap: {
    marginTop: 14,
    paddingBottom: 12,
  },
  laterEmptyCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#242424',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  laterEmptyText: {
    color: '#5C5C60',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Circular Std Book',
  },
  laterAddButton: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#2D2D30',
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterAddText: {
    color: '#D0D0D6',
    fontSize: 16,
    fontWeight: '700',
    marginTop: -1,
  },
  monthLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
    textAlign: 'center',
    marginBottom: 3,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -8,
  },
  weekArrow: {
    width: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  weekArrowLeft: {
    marginLeft: -6,
  },
  daysViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  daysStrip: {
    flexDirection: 'row',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 66,
    gap: 5,
  },
  dayRingWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLetterPill: {
    height: 14,
    minWidth: 14,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  dayLetterPillActive: {
    backgroundColor: '#3CAE74',
  },
  dayLetter: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
  },
  dayLetterActive: {
    color: COLORS.white,
  },
  dayNumberWrap: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayProgressOverlay: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberWrapSelected: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  dayNumber: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
  },
  dayNumberSelected: {
    color: '#0B0B0C',
  },
});

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Circle, SvgUri } from 'react-native-svg';
import { addDays, endOfMonth, endOfWeek, format, isAfter, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING } from '../constants/theme';
import { HomeHeader } from '../components/HomeHeader';

const strengthIconUri = Image.resolveAssetSource(require('../../assets/icons/strength icon.svg')).uri;
const intelligenceIconUri = Image.resolveAssetSource(require('../../assets/icons/intelligence icons.svg')).uri;
const healthIconUri = Image.resolveAssetSource(require('../../assets/icons/health icons.svg')).uri;
const masteryIconUri = Image.resolveAssetSource(require('../../assets/icons/mastery icon.svg')).uri;
const appearanceIconUri = Image.resolveAssetSource(require('../../assets/icons/appearance icon.svg')).uri;
const sociabilityIconUri = Image.resolveAssetSource(require('../../assets/icons/sociability icon.svg')).uri;
const disciplineIconUri = Image.resolveAssetSource(require('../../assets/icons/discipline icon.svg')).uri;
const wealthIconUri = Image.resolveAssetSource(require('../../assets/icons/wealth icon.svg')).uri;

const STAT_CARDS = [
  {
    key: 'strength',
    label: 'Strength',
    icon: strengthIconUri,
    progress: 0.22,
    description:
      'Your physical power. Tracked through workouts logged, weight lifted, training consistency, and progressive overload over time. Every session you complete pushes this stat forward. The iron never lies.',
    details: [
      { label: 'Total workouts logged', value: '14' },
      { label: 'Training streak', value: '6 days' },
      { label: 'Avg session length', value: '52m' },
      { label: 'Top lift tracked', value: '185 lb' },
      { label: 'Progressive overload hits', value: '9' },
    ],
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    icon: intelligenceIconUri,
    progress: 0.28,
    description:
      'Your mind is a weapon. This stat tracks how much you sharpen it. Study sessions, books read, courses completed, time spent learning. The most dangerous version of you is the most educated one.',
    details: [
      { label: 'Total study hours logged', value: '13 hrs' },
      { label: 'Average daily study time', value: '23m' },
      { label: 'Longest study streak', value: '7 days' },
      { label: 'Books / audiobooks completed', value: '3' },
      { label: 'Study sessions completed', value: '8' },
      { label: 'Average focus session length', value: '1h 15m' },
      { label: 'Knowledge quests completed', value: '2' },
      { label: 'Peak study time', value: '13:30' },
    ],
  },
  {
    key: 'health',
    label: 'Health',
    icon: healthIconUri,
    progress: 0.18,
    description:
      'The foundation everything else is built on. Tracks your sleep, diet, hydration, steps, and hygiene habits daily. Let this stat slip and every other one suffers. Protect it like your life depends on it because it does.',
    details: [
      { label: 'Avg sleep', value: '6h 48m' },
      { label: 'Hydration goals hit', value: '9' },
      { label: 'Steps logged', value: '52k' },
      { label: 'Nutrition score', value: '78%' },
      { label: 'Hygiene streak', value: '10 days' },
    ],
  },
  {
    key: 'mastery',
    label: 'Mastery',
    icon: masteryIconUri,
    progress: 0.2,
    description:
      'The skills that make you rare. Tracked through deliberate practice sessions, time spent training your craft, and milestones hit across your hobbies and disciplines. A man with a skill nobody else has is a man who can never be ignored.',
    details: [
      { label: 'Practice sessions', value: '11' },
      { label: 'Hours invested', value: '9h 40m' },
      { label: 'Milestones hit', value: '2' },
      { label: 'Longest streak', value: '5 days' },
    ],
  },
  {
    key: 'appearance',
    label: 'Appearance',
    icon: appearanceIconUri,
    progress: 0.14,
    description:
      'How you show up to the world. Tracked through grooming habits, skincare routines, style choices, and looksmaxxing efforts logged consistently. First impressions are made in seconds. This stat makes sure yours counts.',
    details: [
      { label: 'Grooming routines logged', value: '12' },
      { label: 'Skincare days', value: '9' },
      { label: 'Style check-ins', value: '6' },
      { label: 'Looksmaxxing tasks', value: '5' },
    ],
  },
  {
    key: 'sociability',
    label: 'Sociability',
    icon: sociabilityIconUri,
    progress: 0.12,
    description:
      'Your ability to connect, influence, and be remembered. Tracked through social interactions, dates, time with friends, and relationship quality. The Harvard study ran for 85 years and found one thing matters most in life. This is it.',
    details: [
      { label: 'Social interactions', value: '18' },
      { label: 'Quality check-ins', value: '7' },
      { label: 'Time with friends', value: '6h 20m' },
      { label: 'Dates logged', value: '2' },
    ],
  },
  {
    key: 'discipline',
    label: 'Discipline',
    icon: disciplineIconUri,
    progress: 0.25,
    description:
      'The stat that makes all the others possible. Tracked through habit adherence, consistency streaks, and how often you actually do what you said you would. Motivation gets you started. Discipline keeps you going when motivation is gone.',
    details: [
      { label: 'Habits completed', value: '42' },
      { label: 'Consistency streak', value: '9 days' },
      { label: 'Focus blocks hit', value: '10' },
      { label: 'Weekly adherence', value: '82%' },
    ],
  },
  {
    key: 'wealth',
    label: 'Wealth',
    icon: wealthIconUri,
    progress: 0.16,
    description:
      'Not just money. Effort directed toward financial freedom. Tracked through time spent on work, side hustles, businesses, sales, investing, and income generating activities. Every hour you put into building wealth is logged. Stack the hours. Stack the results.',
    details: [
      { label: 'Income hours logged', value: '21h' },
      { label: 'Side hustle sessions', value: '6' },
      { label: 'Deals closed', value: '2' },
      { label: 'Investing sessions', value: '4' },
      { label: 'Revenue tracked', value: '$420' },
    ],
  },
];

const GRID_GAP = 16;
const GRID_SIDE_PADDING = SPACING.l;
const CARD_WIDTH = (Dimensions.get('window').width - GRID_SIDE_PADDING * 2 - GRID_GAP) / 2;
const INSIGHT_GREEN = '#6FB38C';
const INSIGHT_RED = '#B23A4B';
const MONTH_CELL_SIZE = 26;
const MONTH_STROKE_WIDTH = 3;
const MONTH_DASH_COUNT = 8;
const MONTH_DASH_COLOR = '#2F2F2F';
const MONTH_TRACK_COLOR = '#2A2A2A';
const monthDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const monthlyInsightMap: Record<string, { ratio: number; color: string }> = {
  '2026-03-04': { ratio: 0.45, color: INSIGHT_GREEN },
  '2026-03-08': { ratio: 0.8, color: INSIGHT_GREEN },
  '2026-03-10': { ratio: 0.4, color: INSIGHT_RED },
  '2026-03-13': { ratio: 0.7, color: INSIGHT_GREEN },
  '2026-03-16': { ratio: 0.55, color: INSIGHT_GREEN },
  '2026-03-17': { ratio: 0.62, color: INSIGHT_GREEN },
  '2026-03-18': { ratio: 0.68, color: INSIGHT_GREEN },
  '2026-03-19': { ratio: 0.58, color: INSIGHT_GREEN },
  '2026-03-21': { ratio: 0.7, color: INSIGHT_GREEN },
  '2026-03-24': { ratio: 0.66, color: INSIGHT_GREEN },
  '2026-03-25': { ratio: 0.52, color: INSIGHT_GREEN },
  '2026-03-26': { ratio: 0.38, color: INSIGHT_RED },
  '2026-03-27': { ratio: 0.76, color: INSIGHT_GREEN },
  '2026-03-28': { ratio: 0.82, color: INSIGHT_GREEN },
  '2026-03-29': { ratio: 0.71, color: INSIGHT_GREEN },
  '2026-03-30': { ratio: 0.88, color: INSIGHT_GREEN },
};

export const InsightsScreen = () => {
  const today = new Date();
  const [selectedMetric, setSelectedMetric] = useState<(typeof STAT_CARDS)[number] | null>(null);
  const monthlyMonth = startOfMonth(today);
  const monthStart = useMemo(() => startOfMonth(monthlyMonth), [monthlyMonth]);
  const monthEnd = useMemo(() => endOfMonth(monthlyMonth), [monthlyMonth]);
  const monthGridStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart]);
  const monthGridEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 1 }), [monthEnd]);
  const monthDays = useMemo(() => {
    const days: Date[] = [];
    let current = monthGridStart;
    while (current <= monthGridEnd) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [monthGridStart, monthGridEnd]);
  const monthRadius = (MONTH_CELL_SIZE - MONTH_STROKE_WIDTH) / 2;
  const monthCircumference = 2 * Math.PI * monthRadius;
  const monthDashLength = (Math.PI * (MONTH_CELL_SIZE - MONTH_STROKE_WIDTH)) / (MONTH_DASH_COUNT * 2);
  const monthDashArray = `${monthDashLength} ${monthDashLength}`;

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader centerIcon="lightbulb-outline" hideCalendar={true} hideCenterIcon={true} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Stats</Text>
        </View>

        <View style={styles.metricsGrid}>
          {STAT_CARDS.map(metric => {
            return (
              <TouchableOpacity
                key={metric.key}
                style={styles.metricCard}
                activeOpacity={0.85}
                onPress={() => setSelectedMetric(metric)}
              >
                <View style={styles.metricTopRow}>
                  <View style={styles.metricTrack}>
                    <View style={[styles.metricTrackFill, { width: `${metric.progress * 100}%` }]} />
                  </View>
                  <Text style={styles.metricProgressText}>{`${Math.round(metric.progress * 100)}/100`}</Text>
                </View>
                <View style={styles.metricContent}>
                  <View style={styles.metricIconWrap}>
                    <SvgUri uri={metric.icon} width={24} height={24} />
                  </View>
                  <View style={styles.metricText}>
                    <Text style={styles.metricLabel} numberOfLines={1}>
                      {metric.label.toUpperCase()}
                    </Text>
                    <Text style={styles.metricLevel}>Lvl 1</Text>
                  </View>
                </View>
                <View style={styles.metricDots}>
                  <View style={styles.metricDotSmall} />
                  <View style={styles.metricDotSmall} />
                  <View style={styles.metricDotSmall} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.monthlySection}>
          <View style={styles.monthlyCard}>
            <Text style={styles.monthTitle}>{format(monthlyMonth, 'MMM yyyy')}</Text>
            <View style={styles.monthDayLabelsRow}>
              {monthDayLabels.map((label, index) => (
                <Text key={`${label}-${index}`} style={styles.monthDayLabel}>
                  {label}
                </Text>
              ))}
            </View>
            <View style={styles.monthGrid}>
              {monthDays.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const entry = monthlyInsightMap[key];
                const isInMonth = isSameMonth(day, monthlyMonth);
                const isFuture = isAfter(day, today);
                const isToday = isSameDay(day, today);
                const hasEntry = Boolean(entry);
                const dashed = !isToday && (!hasEntry || isFuture);
                const ratio = hasEntry && !isFuture ? entry.ratio : 0;
                const ringColor = entry?.color ?? INSIGHT_GREEN;
                const numberColor = isToday ? '#FFFFFF' : isInMonth ? COLORS.white : '#5C5C5C';

                return (
                  <View key={key} style={styles.monthDayCell}>
                    <View style={styles.monthRingWrapper}>
                      <Svg width={MONTH_CELL_SIZE} height={MONTH_CELL_SIZE}>
                        <Circle
                          cx={MONTH_CELL_SIZE / 2}
                          cy={MONTH_CELL_SIZE / 2}
                          r={monthRadius}
                          stroke={dashed ? MONTH_DASH_COLOR : MONTH_TRACK_COLOR}
                          strokeWidth={MONTH_STROKE_WIDTH}
                          fill="transparent"
                          strokeDasharray={dashed ? monthDashArray : undefined}
                          strokeLinecap={dashed ? 'round' : 'butt'}
                        />
                        {ratio > 0 ? (
                          <Circle
                            cx={MONTH_CELL_SIZE / 2}
                            cy={MONTH_CELL_SIZE / 2}
                            r={monthRadius}
                            stroke={ringColor}
                            strokeWidth={MONTH_STROKE_WIDTH}
                            fill="transparent"
                            strokeDasharray={`${monthCircumference} ${monthCircumference}`}
                            strokeDashoffset={monthCircumference * (1 - Math.min(1, ratio))}
                            strokeLinecap="round"
                            rotation={-90}
                            originX={MONTH_CELL_SIZE / 2}
                            originY={MONTH_CELL_SIZE / 2}
                          />
                        ) : null}
                      </Svg>
                      <View style={[styles.monthNumberWrap, isToday && styles.monthNumberWrapToday]}>
                        <Text style={[styles.monthDayNumber, { color: numberColor }]}>
                          {format(day, 'd')}
                        </Text>
                      </View>
                    </View>
                    {isToday ? <Text style={styles.monthTodayLabel}>Today</Text> : null}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
      <Modal transparent={true} visible={Boolean(selectedMetric)} animationType="fade" statusBarTranslucent={true}>
        <View style={styles.modalRoot}>
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMetric(null)} />
          {selectedMetric ? (
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrap}>
                  <SvgUri uri={selectedMetric.icon} width={34} height={34} />
                </View>
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalTitle}>{selectedMetric.label.toUpperCase()}</Text>
                  <Text style={styles.modalLevel}>Lvl 1</Text>
                </View>
              </View>
              <Text style={styles.modalDescription}>{selectedMetric.description}</Text>
              <View style={styles.modalDetailList}>
                {selectedMetric.details.map(detail => (
                  <View key={`${selectedMetric.key}-${detail.label}`} style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>{detail.label}:</Text>
                    <Text style={styles.modalDetailValue}>{detail.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    marginTop: 12,
    paddingHorizontal: GRID_SIDE_PADDING,
  },
  headerBlock: {
    marginTop: 10,
    marginBottom: 18,
  },
  title: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 24,
  },
  metricCard: {
    width: CARD_WIDTH,
    minHeight: 70,
    backgroundColor: '#0B0B0B',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    justifyContent: 'space-between',
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  metricProgressText: {
    marginLeft: 8,
    color: '#C9C9C9',
    fontSize: 10,
    fontWeight: '700',
  },
  metricTrack: {
    flex: 1,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#4D4D4D',
    overflow: 'hidden',
  },
  metricTrackFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#6FB38C',
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -6,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricText: {
    flex: 1,
    gap: 2,
    paddingRight: 10,
  },
  metricLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  metricLevel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  metricDots: {
    flexDirection: 'row',
    gap: 4,
    position: 'absolute',
    right: 12,
    bottom: 10,
  },
  metricDotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    width: '86%',
    backgroundColor: '#0B0B0B',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleWrap: {
    gap: 2,
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalLevel: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  modalDescription: {
    color: '#F1F1F1',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  modalDetailList: {
    gap: 6,
  },
  modalDetailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalDetailLabel: {
    color: '#9B9B9B',
    fontSize: 12,
    fontWeight: '600',
  },
  modalDetailValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  monthlySection: {
    marginTop: 8,
  },
  monthlyCard: {
    backgroundColor: '#0B0B0B',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  monthTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  monthDayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  monthDayLabel: {
    color: '#5C5C5C',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    width: '14.28%',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,
  },
  monthDayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 34,
  },
  monthRingWrapper: {
    width: MONTH_CELL_SIZE,
    height: MONTH_CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNumberWrap: {
    position: 'absolute',
    width: MONTH_CELL_SIZE,
    height: MONTH_CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNumberWrapToday: {
    backgroundColor: INSIGHT_GREEN,
    borderRadius: MONTH_CELL_SIZE / 2,
  },
  monthDayNumber: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  monthTodayLabel: {
    color: INSIGHT_GREEN,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
});

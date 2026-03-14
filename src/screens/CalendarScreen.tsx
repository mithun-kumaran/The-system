import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '../components/HomeHeader';
import { SPACING } from '../constants/theme';

type GoalDomain = {
  label: string;
  count: number;
  color: string;
  textColor: string;
};

type GoalHeatmap = number[][];

type GoalItem = {
  id: string;
  rank: number;
  rankColor: string;
  title: string;
  target: string;
  emoji: string;
  streak: number;
  progress: number;
  structure: number;
  realistic: number;
  domains: GoalDomain[];
  heatmap: GoalHeatmap;
};

type SimpleItem = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  subtitleIcon: 'calendar-blank-outline' | 'clock-time-four-outline' | 'map-marker-outline';
};

type RoutineItem = {
  id: string;
  title: string;
  duration: string;
  emoji: string;
  color: string;
  steps: Array<{ id: string; title: string; duration: string; emoji: string; color: string }>;
};

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const HEATMAP_COLORS = ['#1A1A1A', '#5F4C72', '#8B6EB0', '#C7B5EA'];

const buildHeatmap = (seed: number): GoalHeatmap =>
  Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: 12 }, (_, col) => (row + col + seed) % 4)
  );

const DOMAIN_SET: GoalDomain[] = [
  { label: 'ROUTINES', count: 8, color: '#F28B82', textColor: '#2B1513' },
  { label: 'HABITS', count: 4, color: '#B69CFF', textColor: '#1E1430' },
  { label: 'CONSTRAINTS', count: 1, color: '#F7D37A', textColor: '#2F240D' },
  { label: 'DEADLINES', count: 2, color: '#9FB4FF', textColor: '#1A2040' },
  { label: 'DECISIONS', count: 3, color: '#F4A46A', textColor: '#2C1A10' },
  { label: 'STATES', count: 4, color: '#78D28D', textColor: '#122A1B' },
  { label: 'TASKS', count: 4, color: '#F2F2F2', textColor: '#1A1A1A' },
  { label: 'COMMITMENTS', count: 1, color: '#9EE2E8', textColor: '#0E2224' },
];

const MOCK_GOALS: GoalItem[] = [
  {
    id: '1',
    rank: 1,
    rankColor: '#D9F8C7',
    title: 'Reach 10% Body Fat',
    target: 'Target: 1st June',
    emoji: '🎯',
    streak: 45,
    progress: 96,
    structure: 89,
    realistic: 73,
    domains: DOMAIN_SET,
    heatmap: buildHeatmap(1),
  },
  {
    id: '2',
    rank: 2,
    rankColor: '#CFCFCF',
    title: 'Achieve 120kg Bench Press',
    target: 'Target: 1st June',
    emoji: '🏋️',
    streak: 45,
    progress: 96,
    structure: 89,
    realistic: 73,
    domains: DOMAIN_SET,
    heatmap: buildHeatmap(2),
  },
  {
    id: '3',
    rank: 3,
    rankColor: '#F1C45A',
    title: 'Secure Summer Internship',
    target: 'Target: 1st June',
    emoji: '💼',
    streak: 45,
    progress: 96,
    structure: 89,
    realistic: 73,
    domains: DOMAIN_SET,
    heatmap: buildHeatmap(3),
  },
  {
    id: '4',
    rank: 4,
    rankColor: '#B79CFF',
    title: 'Improve Skin Clarity',
    target: 'Target: 1st June',
    emoji: '✨',
    streak: 45,
    progress: 96,
    structure: 89,
    realistic: 73,
    domains: DOMAIN_SET,
    heatmap: buildHeatmap(4),
  },
  {
    id: '5',
    rank: 5,
    rankColor: '#CDE9A6',
    title: 'Save £3,000',
    target: 'Target: 1st June',
    emoji: '💰',
    streak: 45,
    progress: 96,
    structure: 89,
    realistic: 73,
    domains: DOMAIN_SET,
    heatmap: buildHeatmap(5),
  },
];

const MOCK_HABITS: SimpleItem[] = [
  { id: 'habit-1', title: 'Cold shower', subtitle: '5 min', emoji: '🧊', color: '#7CD6FF', subtitleIcon: 'clock-time-four-outline' },
  { id: 'habit-2', title: 'Read 20 pages', subtitle: '20 min', emoji: '📘', color: '#B6A1FF', subtitleIcon: 'clock-time-four-outline' },
  { id: 'habit-3', title: 'Morning mobility', subtitle: '12 min', emoji: '🧘‍♂️', color: '#8EE6B2', subtitleIcon: 'clock-time-four-outline' },
  { id: 'habit-4', title: 'Protein shake', subtitle: 'Daily', emoji: '🥤', color: '#FFD37A', subtitleIcon: 'clock-time-four-outline' },
  { id: 'habit-5', title: 'Journal', subtitle: '10 min', emoji: '📝', color: '#FFB47D', subtitleIcon: 'clock-time-four-outline' },
];

const MOCK_ACHIEVEMENTS: SimpleItem[] = [
  { id: 'ach-1', title: '4-week streak', subtitle: 'Unlocked 2 days ago', emoji: '🔥', color: '#FFC169', subtitleIcon: 'calendar-blank-outline' },
  { id: 'ach-2', title: 'Consistency 80%', subtitle: 'Unlocked 1 week ago', emoji: '🏅', color: '#9FE6B7', subtitleIcon: 'calendar-blank-outline' },
  { id: 'ach-3', title: 'PR Bench 110kg', subtitle: 'Unlocked 3 days ago', emoji: '🏋️', color: '#9FB4FF', subtitleIcon: 'calendar-blank-outline' },
  { id: 'ach-4', title: 'Sleep 8h avg', subtitle: 'Unlocked today', emoji: '😴', color: '#B69CFF', subtitleIcon: 'calendar-blank-outline' },
  { id: 'ach-5', title: 'Inbox zero week', subtitle: 'Unlocked 5 days ago', emoji: '📬', color: '#F7D37A', subtitleIcon: 'calendar-blank-outline' },
];

const MOCK_CONSTRAINTS: SimpleItem[] = [
  { id: 'con-1', title: 'No sugar weekdays', subtitle: 'Active', emoji: '🚫🍬', color: '#F28B82', subtitleIcon: 'calendar-blank-outline' },
  { id: 'con-2', title: 'No phone after 10pm', subtitle: 'Active', emoji: '📵', color: '#9EE2E8', subtitleIcon: 'calendar-blank-outline' },
  { id: 'con-3', title: 'Gym before 9am', subtitle: 'Active', emoji: '⏰', color: '#9FB4FF', subtitleIcon: 'calendar-blank-outline' },
  { id: 'con-4', title: '2L water daily', subtitle: 'Active', emoji: '💧', color: '#7CD6FF', subtitleIcon: 'calendar-blank-outline' },
  { id: 'con-5', title: 'No caffeine after 3pm', subtitle: 'Active', emoji: '☕️', color: '#FFB47D', subtitleIcon: 'calendar-blank-outline' },
];

const MOCK_COMMITMENTS: SimpleItem[] = [
  { id: 'com-1', title: 'Work placement', subtitle: 'Mon–Thu 9:00', emoji: '💼', color: '#CFCFCF', subtitleIcon: 'calendar-blank-outline' },
  { id: 'com-2', title: 'Basketball practice', subtitle: 'Tue 18:00', emoji: '🏀', color: '#9FE6B7', subtitleIcon: 'calendar-blank-outline' },
  { id: 'com-3', title: 'Study group', subtitle: 'Wed 17:00', emoji: '📚', color: '#B69CFF', subtitleIcon: 'calendar-blank-outline' },
  { id: 'com-4', title: 'Family dinner', subtitle: 'Fri 19:00', emoji: '🍽️', color: '#F7D37A', subtitleIcon: 'calendar-blank-outline' },
  { id: 'com-5', title: 'Sunday service', subtitle: 'Sun 10:00', emoji: '⛪️', color: '#9EE2E8', subtitleIcon: 'calendar-blank-outline' },
];

const MOCK_ROUTINES: RoutineItem[] = [
  {
    id: 'routine-1',
    title: 'Morning routine',
    duration: '45m',
    emoji: '🌅',
    color: '#FFD37A',
    steps: [
      { id: 'r1-1', title: 'Brush teeth', duration: '5m', emoji: '🪥', color: '#F7B2B7' },
      { id: 'r1-2', title: 'Skincare', duration: '8m', emoji: '🧴', color: '#F4A46A' },
      { id: 'r1-3', title: 'Breakfast', duration: '20m', emoji: '🥣', color: '#9EE2E8' },
      { id: 'r1-4', title: 'Plan day', duration: '12m', emoji: '🗓️', color: '#B69CFF' },
      { id: 'r1-5', title: 'Walk outside', duration: '10m', emoji: '🚶‍♂️', color: '#9FE6B7' },
    ],
  },
  {
    id: 'routine-2',
    title: 'Gym warm-up',
    duration: '20m',
    emoji: '🏋️',
    color: '#9FB4FF',
    steps: [
      { id: 'r2-1', title: 'Dynamic stretch', duration: '6m', emoji: '🤸', color: '#9EE2E8' },
      { id: 'r2-2', title: 'Band work', duration: '4m', emoji: '🧵', color: '#F7D37A' },
      { id: 'r2-3', title: 'Light sets', duration: '10m', emoji: '🏋️', color: '#CFCFCF' },
      { id: 'r2-4', title: 'Breathing', duration: '2m', emoji: '😮‍💨', color: '#B69CFF' },
      { id: 'r2-5', title: 'Water', duration: '1m', emoji: '💧', color: '#7CD6FF' },
    ],
  },
  {
    id: 'routine-3',
    title: 'Evening wind-down',
    duration: '30m',
    emoji: '🌙',
    color: '#B69CFF',
    steps: [
      { id: 'r3-1', title: 'Tidy room', duration: '8m', emoji: '🧹', color: '#9FE6B7' },
      { id: 'r3-2', title: 'Read fiction', duration: '12m', emoji: '📖', color: '#FFD37A' },
      { id: 'r3-3', title: 'Stretch', duration: '6m', emoji: '🧘', color: '#9EE2E8' },
      { id: 'r3-4', title: 'Set alarm', duration: '2m', emoji: '⏰', color: '#F7D37A' },
      { id: 'r3-5', title: 'Lights out', duration: '2m', emoji: '💡', color: '#CFCFCF' },
    ],
  },
  {
    id: 'routine-4',
    title: 'Study prep',
    duration: '25m',
    emoji: '📚',
    color: '#9EE2E8',
    steps: [
      { id: 'r4-1', title: 'Clear desk', duration: '4m', emoji: '🧽', color: '#9FE6B7' },
      { id: 'r4-2', title: 'Open resources', duration: '3m', emoji: '🗂️', color: '#B69CFF' },
      { id: 'r4-3', title: 'Pomodoro setup', duration: '2m', emoji: '⏲️', color: '#F7D37A' },
      { id: 'r4-4', title: 'Warm-up quiz', duration: '10m', emoji: '❓', color: '#FFD37A' },
      { id: 'r4-5', title: 'Plan topics', duration: '6m', emoji: '📌', color: '#9FB4FF' },
    ],
  },
  {
    id: 'routine-5',
    title: 'Sunday reset',
    duration: '60m',
    emoji: '🧼',
    color: '#F7D37A',
    steps: [
      { id: 'r5-1', title: 'Laundry', duration: '20m', emoji: '🧺', color: '#9EE2E8' },
      { id: 'r5-2', title: 'Grocery list', duration: '10m', emoji: '🛒', color: '#9FE6B7' },
      { id: 'r5-3', title: 'Clean space', duration: '15m', emoji: '🧽', color: '#B69CFF' },
      { id: 'r5-4', title: 'Plan week', duration: '10m', emoji: '🗓️', color: '#9FB4FF' },
      { id: 'r5-5', title: 'Reset inbox', duration: '5m', emoji: '📥', color: '#CFCFCF' },
    ],
  },
];

const OBJECTIVE_TABS = [
  { id: 'goals', label: 'GOALS', count: MOCK_GOALS.length },
  { id: 'habits', label: 'HABITS', count: MOCK_HABITS.length },
  { id: 'routines', label: 'ROUTINES', count: MOCK_ROUTINES.length },
  { id: 'achievements', label: 'ACHIEVEMENTS', count: MOCK_ACHIEVEMENTS.length },
  { id: 'constraints', label: 'CONSTRAINTS', count: MOCK_CONSTRAINTS.length },
  { id: 'commitments', label: 'COMMITMENTS', count: MOCK_COMMITMENTS.length },
];

const GoalBar = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.goalBarRow}>
    <View style={styles.goalBarLabelRow}>
      <Text style={styles.goalBarLabel}>{label}:</Text>
      <Text style={styles.goalBarValue}>{value}%</Text>
    </View>
    <View style={styles.goalBarTrack}>
      <View style={[styles.goalBarFill, { width: `${value}%` }]} />
    </View>
  </View>
);

export const CalendarScreen = () => {
  const [activeTab, setActiveTab] = useState<'goals' | 'habits' | 'routines' | 'achievements' | 'constraints' | 'commitments'>('goals');
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);
  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Record<string, boolean>>({});

  const visibleGoals = useMemo(() => MOCK_GOALS, []);

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader centerIcon="target" hideCalendar={true} hideCenterIcon={true} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Objectives</Text>

        <View style={styles.tabsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {OBJECTIVE_TABS.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabPill, activeTab === tab.id && styles.tabPillActive]}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.id as typeof activeTab)}
              >
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.listContent}>
          {activeTab === 'goals'
            ? visibleGoals.map(goal => (
                <View key={goal.id} style={styles.goalRow}>
                  <View style={[styles.rankBadge, { backgroundColor: goal.rankColor }]}>
                    <Text style={styles.rankText}>{goal.rank}</Text>
                  </View>
                  <View style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <View style={styles.goalIconWrap}>
                        <Text style={styles.goalIconText}>{goal.emoji}</Text>
                      </View>
                      <View style={styles.goalHeaderText}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        <View style={styles.goalTargetRow}>
                          <MaterialCommunityIcons name="calendar-blank-outline" size={12} color="#A0A0A3" />
                          <Text style={styles.goalTargetText}>{goal.target}</Text>
                        </View>
                      </View>
                      <View style={styles.goalHeaderRight}>
                        <View style={styles.streakPill}>
                          <MaterialCommunityIcons name="fire" size={12} color="#F4B740" />
                          <Text style={styles.streakText}>{goal.streak}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.goalMenuButton}
                          activeOpacity={0.8}
                          onPress={() => setSelectedGoal(goal)}
                        >
                          <MaterialCommunityIcons name="dots-horizontal" size={18} color="#EDEDED" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.goalBody}>
                      <View style={styles.goalBars}>
                        <GoalBar label="Progress" value={goal.progress} />
                        <GoalBar label="Structure" value={goal.structure} />
                        <GoalBar label="Realistic" value={goal.realistic} />
                      </View>
                      <View style={styles.goalHeatmap}>
                        {DAYS.map((day, rowIndex) => (
                          <View key={`${goal.id}-row-${rowIndex}`} style={styles.heatmapRow}>
                            <Text style={styles.heatmapDay}>{day}</Text>
                            <View style={styles.heatmapCellsRow}>
                              {goal.heatmap[rowIndex].map((value, colIndex) => (
                                <View
                                  key={`${goal.id}-cell-${rowIndex}-${colIndex}`}
                                  style={[
                                    styles.heatmapCell,
                                    { backgroundColor: HEATMAP_COLORS[value] },
                                  ]}
                                />
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={styles.domainRow}>
                      {goal.domains.map(domain => (
                        <View
                          key={`${goal.id}-${domain.label}`}
                          style={[styles.domainPill, { backgroundColor: domain.color }]}
                        >
                          <Text style={[styles.domainText, { color: domain.textColor }]}>
                            {domain.label} ({domain.count})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))
            : null}
          {activeTab === 'habits'
            ? MOCK_HABITS.map(item => (
                <View key={item.id} style={styles.simpleCard}>
                  <View style={[styles.simpleIconWrap, { backgroundColor: item.color }]}>
                    <Text style={styles.simpleIconText}>{item.emoji}</Text>
                  </View>
                  <View style={styles.simpleTextWrap}>
                    <Text style={styles.simpleTitle}>{item.title}</Text>
                    <View style={styles.simpleSubtitleRow}>
                      <MaterialCommunityIcons name={item.subtitleIcon} size={12} color="#A0A0A3" />
                      <Text style={styles.simpleSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.simpleEditButton} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="square-edit-outline" size={16} color="#EDEDED" />
                  </TouchableOpacity>
                </View>
              ))
            : null}
          {activeTab === 'achievements'
            ? MOCK_ACHIEVEMENTS.map(item => (
                <View key={item.id} style={styles.simpleCard}>
                  <View style={[styles.simpleIconWrap, { backgroundColor: item.color }]}>
                    <Text style={styles.simpleIconText}>{item.emoji}</Text>
                  </View>
                  <View style={styles.simpleTextWrap}>
                    <Text style={styles.simpleTitle}>{item.title}</Text>
                    <View style={styles.simpleSubtitleRow}>
                      <MaterialCommunityIcons name={item.subtitleIcon} size={12} color="#A0A0A3" />
                      <Text style={styles.simpleSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.simpleEditButton} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="square-edit-outline" size={16} color="#EDEDED" />
                  </TouchableOpacity>
                </View>
              ))
            : null}
          {activeTab === 'constraints'
            ? MOCK_CONSTRAINTS.map(item => (
                <View key={item.id} style={styles.simpleCard}>
                  <View style={[styles.simpleIconWrap, { backgroundColor: item.color }]}>
                    <Text style={styles.simpleIconText}>{item.emoji}</Text>
                  </View>
                  <View style={styles.simpleTextWrap}>
                    <Text style={styles.simpleTitle}>{item.title}</Text>
                    <View style={styles.simpleSubtitleRow}>
                      <MaterialCommunityIcons name={item.subtitleIcon} size={12} color="#A0A0A3" />
                      <Text style={styles.simpleSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.simpleEditButton} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="square-edit-outline" size={16} color="#EDEDED" />
                  </TouchableOpacity>
                </View>
              ))
            : null}
          {activeTab === 'commitments'
            ? MOCK_COMMITMENTS.map(item => (
                <View key={item.id} style={styles.simpleCard}>
                  <View style={[styles.simpleIconWrap, { backgroundColor: item.color }]}>
                    <Text style={styles.simpleIconText}>{item.emoji}</Text>
                  </View>
                  <View style={styles.simpleTextWrap}>
                    <Text style={styles.simpleTitle}>{item.title}</Text>
                    <View style={styles.simpleSubtitleRow}>
                      <MaterialCommunityIcons name={item.subtitleIcon} size={12} color="#A0A0A3" />
                      <Text style={styles.simpleSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.simpleEditButton} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="square-edit-outline" size={16} color="#EDEDED" />
                  </TouchableOpacity>
                </View>
              ))
            : null}
          {activeTab === 'routines'
            ? MOCK_ROUTINES.map(routine => {
                const isExpanded = !!expandedRoutineIds[routine.id];
                return (
                  <View key={routine.id} style={styles.routineCard}>
                    <TouchableOpacity
                      style={styles.routineHeader}
                      activeOpacity={0.85}
                      onPress={() =>
                        setExpandedRoutineIds(prev => ({ ...prev, [routine.id]: !prev[routine.id] }))
                      }
                    >
                      <View style={[styles.simpleIconWrap, { backgroundColor: routine.color }]}>
                        <Text style={styles.simpleIconText}>{routine.emoji}</Text>
                      </View>
                      <View style={styles.simpleTextWrap}>
                        <Text style={styles.simpleTitle}>{routine.title}</Text>
                        <View style={styles.simpleSubtitleRow}>
                          <MaterialCommunityIcons name="clock-time-four-outline" size={12} color="#A0A0A3" />
                          <Text style={styles.simpleSubtitle}>{routine.duration}</Text>
                        </View>
                      </View>
                      <View style={styles.routineRight}>
                        <TouchableOpacity style={styles.simpleEditButton} activeOpacity={0.85}>
                          <MaterialCommunityIcons name="square-edit-outline" size={16} color="#EDEDED" />
                        </TouchableOpacity>
                        <MaterialCommunityIcons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#EDEDED"
                        />
                      </View>
                    </TouchableOpacity>
                    {isExpanded ? (
                      <View style={styles.routineSteps}>
                        {routine.steps.map(step => (
                          <View key={step.id} style={styles.routineStepRow}>
                            <View style={[styles.routineStepIcon, { backgroundColor: step.color }]}>
                              <Text style={styles.routineStepIconText}>{step.emoji}</Text>
                            </View>
                            <View style={styles.routineStepText}>
                              <Text style={styles.routineStepTitle}>{step.title}</Text>
                              <Text style={styles.routineStepSubtitle}>{step.duration}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })
            : null}
        </View>
      </ScrollView>

      <Modal transparent visible={!!selectedGoal} animationType="fade" onRequestClose={() => setSelectedGoal(null)}>
        <View style={styles.detailOverlay}>
          <TouchableOpacity style={styles.detailBackdrop} activeOpacity={1} onPress={() => setSelectedGoal(null)} />
          {selectedGoal ? (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selectedGoal.title}</Text>
                <TouchableOpacity style={styles.detailClose} activeOpacity={0.85} onPress={() => setSelectedGoal(null)}>
                  <MaterialCommunityIcons name="close" size={18} color="#EDEDED" />
                </TouchableOpacity>
              </View>
              <Text style={styles.detailTarget}>{selectedGoal.target}</Text>
              <View style={styles.detailBars}>
                <GoalBar label="Progress" value={selectedGoal.progress} />
                <GoalBar label="Structure" value={selectedGoal.structure} />
                <GoalBar label="Realistic" value={selectedGoal.realistic} />
              </View>
              <View style={styles.detailDomainRow}>
                {selectedGoal.domains.map(domain => (
                  <View
                    key={`${selectedGoal.id}-detail-${domain.label}`}
                    style={[styles.domainPill, { backgroundColor: domain.color }]}
                  >
                    <Text style={[styles.domainText, { color: domain.textColor }]}>
                      {domain.label} ({domain.count})
                    </Text>
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
    paddingBottom: 140,
    marginTop: SPACING.s,
    paddingHorizontal: SPACING.l,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  tabsRow: {
    marginTop: 10,
    marginBottom: 12,
  },
  tabsContent: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
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
  },
  tabPillActive: {
    borderWidth: 1.5,
    borderColor: '#FEF8EF',
    backgroundColor: '#88C29A',
  },
  tabText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
    letterSpacing: 2,
  },
  tabTextActive: {
    color: '#000000',
  },
  listContent: {
    paddingBottom: 24,
    gap: 16,
  },
  simpleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0F0F0F',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  simpleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleIconText: {
    fontSize: 14,
  },
  simpleTextWrap: {
    flex: 1,
  },
  simpleTitle: {
    color: '#F2F2F2',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  simpleSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  simpleSubtitle: {
    color: '#9B9B9F',
    fontSize: 11,
    fontWeight: '700',
  },
  simpleEditButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1C',
  },
  routineCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  routineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routineSteps: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  routineStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routineStepIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineStepIconText: {
    fontSize: 12,
  },
  routineStepText: {
    flex: 1,
  },
  routineStepTitle: {
    color: '#EDEDED',
    fontSize: 12,
    fontWeight: '700',
  },
  routineStepSubtitle: {
    color: '#7D7D82',
    fontSize: 11,
    fontWeight: '600',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  rankText: {
    color: '#1A1A1A',
    fontSize: 11,
    fontWeight: '800',
  },
  goalCard: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  goalIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconText: {
    fontSize: 14,
  },
  goalHeaderText: {
    flex: 1,
  },
  goalTitle: {
    color: '#F2F2F2',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  goalTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalTargetText: {
    color: '#9B9B9F',
    fontSize: 11,
    fontWeight: '700',
  },
  goalHeaderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
  },
  streakText: {
    color: '#EDEDED',
    fontSize: 10,
    fontWeight: '800',
  },
  goalMenuButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1C',
  },
  goalBody: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  goalBars: {
    width: 110,
    gap: 6,
  },
  goalBarRow: {
    gap: 4,
  },
  goalBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalBarLabel: {
    color: '#EDEDED',
    fontSize: 11,
    fontWeight: '700',
  },
  goalBarValue: {
    color: '#EDEDED',
    fontSize: 11,
    fontWeight: '700',
  },
  goalBarTrack: {
    height: 5,
    borderRadius: 5,
    backgroundColor: '#202020',
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#9FE6B7',
  },
  goalHeatmap: {
    flex: 1,
    paddingTop: 2,
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  heatmapDay: {
    width: 12,
    color: '#6F6F74',
    fontSize: 9,
    fontWeight: '700',
    marginRight: 6,
  },
  heatmapCellsRow: {
    flexDirection: 'row',
    gap: 3,
    flexWrap: 'nowrap',
  },
  heatmapCell: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  domainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  domainPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  domainText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  detailOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  detailBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  detailCard: {
    backgroundColor: '#121212',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailTitle: {
    color: '#F2F2F2',
    fontSize: 16,
    fontWeight: '800',
  },
  detailClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1C',
  },
  detailTarget: {
    color: '#9B9B9F',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailBars: {
    gap: 8,
    marginBottom: 12,
  },
  detailDomainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});

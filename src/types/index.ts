export type BlockType = 'work' | 'break' | 'routine' | 'other';

export const TERM_DEFINITIONS = {
  task: 'one time thing',
  taskBlocks: 'all tasks, routines...',
  routines: 'only blocks that can expland to show sub tasks e.g. mornign routine',
  habit: 'repetitive task to achieve a goal',
  goals: 'saved outcome the user is trying to reach with',
  commitment: 'repetitive task not for a goal but an obligation',
  deadline: 'reminder task',
  roles: 'a position the user takes which leads to occasional tasks',
  priority: 'an important task',
} as const;

export const APP_TERMS = {
  appName: 'Neuromax System',
  tagline: 'The System has chosen you.',
  roles: {
    app: 'The System',
    user: 'Hunter',
    tasks: 'Quests',
    stressFatigueCognitiveLoad: 'Dungeon modifiers',
  },
  onboarding: {
    installAction: 'They awaken.',
    openingScreen: ['You have been selected as a Player.', 'The System will assist your growth.'],
  },
  nowPageName: 'STATUS WINDOW',
  rankScale: [
    { rank: 'E', meaning: 'beginner' },
    { rank: 'D', meaning: 'establishing habits' },
    { rank: 'C', meaning: 'consistent' },
    { rank: 'B', meaning: 'disciplined' },
    { rank: 'A', meaning: 'elite' },
    { rank: 'S', meaning: 'optimized' },
  ],
  baseStats: [
    { label: 'Strength', meaning: 'Physical training progress' },
    { label: 'Intelligence', meaning: 'Academic output' },
    { label: 'Endurance', meaning: 'Sleep, recovery, health' },
    { label: 'Focus', meaning: 'Deep work capacity' },
    { label: 'Discipline', meaning: 'Habit adherence' },
    { label: 'Charisma', meaning: 'Social interactions' },
    { label: 'Wealth', meaning: 'Financial progress' },
  ],
  statMappings: [
    { signal: 'Sleep + recovery', stat: 'Endurance' },
    { signal: 'Study output', stat: 'Intelligence' },
    { signal: 'Gym training', stat: 'Strength' },
  ],
  neurostateScoreLabel: 'Hunter Condition',
  hunterConditionStates: [
    { label: 'Stable Aura', color: 'Green', meaning: 'Capacity high' },
    { label: 'Normal State', color: 'Yellow', meaning: 'Standard execution' },
    { label: 'Fatigue Accumulation', color: 'Orange', meaning: 'Cognitive strain' },
    { label: 'Mana Depletion', color: 'Red', meaning: 'Overload' },
  ],
  taskRenames: {
    'Study session': 'Knowledge Quest',
    'Gym session': 'Strength Quest',
    Laundry: 'Maintenance Quest',
    Groceries: 'Supply Quest',
    'Admin tasks': 'Guild Duty',
  },
  scheduleName: 'Daily Quest Board',
  sampleBoardTitle: "TODAY'S QUESTS",
  sampleBoard: [
    { title: 'Knowledge Quest', detail: 'Study Neuroscience Lecture 4', reward: '120 XP' },
    { title: 'Strength Quest', detail: 'Push Workout', reward: '150 XP' },
    { title: 'Maintenance Quest', detail: 'Laundry', reward: '30 XP' },
    { title: 'Supply Quest', detail: 'Buy groceries', reward: '25 XP' },
  ],
  doThisNowMode: {
    name: 'SYSTEM DIRECTIVE',
    subtitle: 'Immediate Action Required',
    example: { title: 'Start Deep Work Block', duration: '45 minutes', reward: '80 XP' },
    layout: 'single-task-only',
  },
  aiSchedulerName: 'The System',
  aiMessageStyle: 'system prompts',
  aiMessageExamples: [
    'The System has analyzed your schedule.',
    'Optimal training window detected: 17:40',
    'Strength Quest scheduled.',
  ],
  goalRealismScoreName: 'QUEST VIABILITY ANALYSIS',
  goalRealismExample: {
    goal: 'Study 8 hours daily',
    viability: '42%',
    reasons: [
      'Required time exceeds available hours',
      'Violates recovery thresholds',
      'Burnout risk +35%',
    ],
    recommendation: 'The System recommends modifying the quest.',
  },
  antiBurnoutProtocolName: 'SYSTEM SAFETY PROTOCOL',
  antiBurnoutExample: {
    warning: 'Warning: Hunter Condition Critical',
    response: 'The System is initiating Recovery Protocol',
    actions: [
      'Cancel low priority quests',
      'Extend sleep window',
      'Replace strength quest with mobility quest',
      'Insert recovery block',
    ],
  },
  pressureIntelligenceName: 'Difficulty Scaling',
  difficultyScalingExample: {
    trigger: 'Missed 3 study sessions.',
    message: 'Hunter Performance Declining',
    change: 'Study block increases from: 45 minutes → 60 minutes.',
  },
  dynamicSchedulingName: 'Quest Reallocation',
  dynamicSchedulingExample: 'The System has reassigned the quest.',
  voiceDumpName: 'Mental Dungeon Scan',
  voiceDumpResponse: 'Dungeon Analysis Complete',
  voiceDumpOutputs: ['Critical quests', 'Hidden objectives', 'Stress sources', 'Optional quests'],
  weeklyReviewName: 'Weekly Hunter Debrief',
  weeklyReviewTitle: 'Hunter Performance Report',
  weeklyReviewItems: [
    'Highest XP gain activities',
    'Energy drain sources',
    'Failed quests',
    'Unrealistic quests',
    'Time leakage',
  ],
  lifeDomainsName: 'Skill Trees',
  skillTrees: ['Scholar Tree', 'Warrior Tree', 'Merchant Tree', 'Social Tree', 'Mind Tree'],
  contextMicroMissionsName: 'Field Quests',
  fieldQuestExample: {
    title: 'Field Quest Available',
    location: 'Tesco',
    timeWindow: '18 minutes',
    energy: 'Low',
    objective: 'Buy protein + dishwasher tablets',
    reward: '20 XP',
  },
  habitSystemName: 'Passive Skills',
  habitExample: {
    habit: 'Morning reading',
    passiveSkill: 'Passive Skill: Knowledge Absorption',
  },
  levelingSystem: {
    xpSources: ['completing quests', 'streaks', 'weekly consistency', 'maintaining hunter condition'],
    unlocks: ['deeper analytics', 'new system features', 'cosmetic themes'],
    loop: 'Quest → XP → Level → Stat growth → Harder quests.',
  },
  cognitiveStateSchedulingNarrative: [
    'The System does not manage time.',
    'The System manages your power.',
  ],
  todayTasksLabel: 'Daily Quest Board',
  todayTasksAltLabel: 'Active Quests',
  laterTasksLabels: ['Pending Quests', 'Future Quests'],
  personalSystems: {
    goals: 'Main Quests',
    habits: 'Passive Skills',
    routines: 'Daily Protocol',
    commitments: 'Guild Obligations',
    deadlines: 'Quest Expiration',
    deadlinesAlt: 'Time Limit',
    deadlinesExample: 'Quest Time Limit: 3 Days Remain',
  },
} as const;

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // HH:mm format (24h)
  endTime: string;   // HH:mm format (24h)
  type: BlockType;
  isCompleted?: boolean;
  isInProgress?: boolean;
  isCommute?: boolean;
  
  // Routine Fields
  isRoutine?: boolean;
  steps?: Array<{
    id: string;
    label: string;
    isDone: boolean;
    time?: string;
  }>;
  
  // specific date (YYYY-MM-DD), if null/undefined, it applies to every day (legacy/template)
  // OR we enforce date for everything now.
  date?: string; 
  source?: 'calendar' | 'app';
  externalId?: string;
  isLater?: boolean;

  // Habit Fields
  isHabit?: boolean;
  habitType?: 'maintenance' | 'growth' | 'quit';
  xp?: number;
  location?: string;
  tagId?: string;
  tagColor?: string;
  reminderEnabled?: boolean;
  notes?: string;
  priority?: 'low' | 'med' | 'high';
  tags?: string[];
  confidence?: number;
  status?: 'draft' | 'ready';
  
  // Soft delete for habit instances to prevent virtual recreation
  isDeleted?: boolean;

  // Goal Fields
  goalCategory?: string;
  goalFocus?: string;
  goalTimeHorizon?: 'short' | 'medium' | 'long';
  goalPriority?: 'low' | 'medium' | 'high';
  goalMeasurability?: 'clear' | 'vague';

  // Workout Fields
  workoutType?: 'strength' | 'cardio' | 'sport' | 'mobility';
  workoutExercises?: Array<{
    id: string;
    name: string;
    sets?: number;
    reps?: number;
    durationMinutes?: number;
  }>;
  workoutDurationMin?: number;
  workoutDurationMax?: number;

  // Deadline Fields
  deadlineDate?: string; // ISO

  // Commitment Fields
  commitmentType?: 'work' | 'school' | 'religious' | 'family' | 'other';
  externalInputs?: Array<{
    id: string;
    type: string;
    url: string;
  }>;

  commuteFrom?: string;
  commuteTo?: string;
  commuteDurationMinutes?: number;
  commuteDistanceText?: string;
  commuteSummary?: string;
  commuteUrl?: string;
  commuteUpdatedAt?: number;
  commuteBufferMinutes?: number;
  commuteMode?: 'transit' | 'driving' | 'walking' | 'bicycling';
}

export type NowStatus = 'active' | 'break' | 'free';

export interface NowState {
  status: NowStatus;
  currentBlock: TimeBlock | null;
  nextBlock: TimeBlock | null;
  secondsRemaining: number;
  totalDuration: number;
}

export interface LogEntry {
  id: string;
  type: 'water' | 'weight' | 'food' | 'training';
  value: string;
  timestamp: number;
}

export interface OnboardingQuizSummary {
  metrics: {
    discipline: number;
    consistency: number;
    timeManagement: number;
    focus: number;
    stressRegulation: number;
    physicalMomentum: number;
    mentalClarity: number;
    confidence: number;
    direction: number;
    recovery: number;
  };
  averageScore: number;
  potentialScore: number;
  diagnosis: string;
  projection: string;
  hoursPerYear: number;
  daysPerYear: number;
}

export interface OnboardingQuizAnswers {
  q1LifeFeel: string[];
  q2PlanFrequency: string;
  q3BehindAreas: string[];
  q4Stability: string;
  q5Stress: string;
  q6Pressure: string[];
  q7Enough: string;
  q8Drains: string[];
  q9Distractions: number;
  q10Distractions: string[];
  q12Aspirations: string[];
  q13Goals: string[];
  q14Routines: string;
  q15Commitment: string;
  q16Willing: string[];
}

export interface OnboardingQuizResult {
  answers: OnboardingQuizAnswers;
  summary: OnboardingQuizSummary;
  completedAt: string;
}

export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | 'other';
  dob: string; // ISO string
  notificationsEnabled: boolean;
  calendarEnabled: boolean;
  locationEnabled: boolean;
  isOnboardingCompleted: boolean;
  wakeTime?: string;  // HH:mm
  sleepTime?: string; // HH:mm
  onboardingQuiz?: OnboardingQuizResult;
  homeAddress?: string;
  homePostcode?: string;
  homeHouseNumber?: string;
  homePlaceId?: string;
  homeLatitude?: number;
  homeLongitude?: number;
  homeVerifiedAt?: string;
  lastKnownLatitude?: number;
  lastKnownLongitude?: number;
  lastKnownAt?: string;
  commuteBufferMinutes?: number;
  backgroundLocationEnabled?: boolean;
  
  // Gamification
  xp: number;
  rank: string;
  streak: number;
}

export type MetricKey =
  | 'discipline'
  | 'consistency'
  | 'timeManagement'
  | 'focus'
  | 'stressRegulation'
  | 'physicalMomentum'
  | 'mentalClarity'
  | 'confidence'
  | 'direction'
  | 'recovery'
  | 'burntOut'
  | 'attention';

export type MetricMap = Record<MetricKey, number>;

export interface DailyMetricsEntry {
  date: string;
  metrics: MetricMap;
  createdAt: string;
}

export interface DailyCompletionEntry {
  date: string;
  completed: number;
  total: number;
}

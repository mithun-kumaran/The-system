import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';
import * as Calendar from 'expo-calendar';
import * as Location from 'expo-location';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { StorageService } from '../services/storage';
import { TimeBlock, UserProfile } from '../types';
import { TimePickerModal } from '../components/TimePickerModal';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

interface Props {
  onComplete: () => void;
}

const Q1_OPTIONS = [
  'Structured and under control',
  'Busy but manageable',
  'Chaotic',
  'Draining',
  'Overwhelming',
  'Directionless',
];

const Q2_OPTIONS = ['Almost always', 'Often', 'Sometimes', 'Rarely', 'Never'];

const Q3_OPTIONS = [
  'Health & fitness',
  'Money / career',
  'Discipline & consistency',
  'Mental clarity & focus',
  'Confidence',
  'Relationships',
  'Purpose / direction',
];

const Q4_OPTIONS = ['Very stable', 'Mostly stable', 'Unpredictable', 'Constantly changing'];

const Q5_OPTIONS = ['Calm', 'Slightly stressed', 'Regularly stressed', 'Overloaded'];

const Q6_OPTIONS = [
  'Paying bills',
  'Academic/work performance',
  'Responsibility to others',
  'Fear of falling behind',
  'Uncertainty about future',
  'None',
];

const Q7_OPTIONS = ['Yes, consistently', 'Sometimes', 'Rarely', 'Almost never'];

const Q8_OPTIONS = [
  'Poor sleep',
  'Mental overload',
  'Screen time / scrolling',
  'Junk food',
  'Overthinking',
  'Lack of structure',
  'Bad habits',
];

const Q10_OPTIONS = [
  'Endless scrolling',
  'Gaming',
  'Compulsive habits',
  'Late nights',
  'Comfort eating',
  'None',
];

const Q12_OPTIONS = [
  'Strong, fit, confident',
  'Clear-minded and focused',
  'Highly disciplined',
  'Financially stable / successful',
  'Meaningful relationships',
  'Purposeful, fulfilled',
];

const Q13_OPTIONS = [
  'Master new skills',
  'Build a strong body',
  'Grow a serious career/business',
  'Build a family',
  'Live with clarity and control',
];

const Q14_OPTIONS = ['Yes, consistently', 'Sometimes', 'Tried but failed', 'No structure'];

const Q15_OPTIONS = ['Curious', 'Somewhat serious', 'Very serious', 'This is non-negotiable'];

const Q16_OPTIONS = [
  'Follow a daily plan',
  'Reduce distractions',
  'Be uncomfortable at times',
  'Let AI make decisions',
  'Track honestly',
];

export const OnboardingScreen = ({ onComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);
  const [dob, setDob] = useState(new Date(2000, 0, 1));
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'wake' | 'sleep'>('wake');

  const [q1LifeFeel, setQ1LifeFeel] = useState<string[]>([]);
  const [q2PlanFrequency, setQ2PlanFrequency] = useState('');
  const [q3BehindAreas, setQ3BehindAreas] = useState<string[]>([]);
  const [q4Stability, setQ4Stability] = useState('');
  const [q5Stress, setQ5Stress] = useState('');
  const [q6Pressure, setQ6Pressure] = useState<string[]>([]);
  const [q7Enough, setQ7Enough] = useState('');
  const [q8Drains, setQ8Drains] = useState<string[]>([]);
  const [q9Distractions, setQ9Distractions] = useState(4);
  const [q10Distractions, setQ10Distractions] = useState<string[]>([]);
  const [q12Aspirations, setQ12Aspirations] = useState<string[]>([]);
  const [q13Goals, setQ13Goals] = useState<string[]>([]);
  const [q14Routines, setQ14Routines] = useState('');
  const [q15Commitment, setQ15Commitment] = useState('');
  const [q16Willing, setQ16Willing] = useState<string[]>([]);
  const [summaryProgress, setSummaryProgress] = useState(0);

  const setupSteps = 7;
  const calendarStep = 4;
  const remindersStep = 5;
  const locationStep = 6;
  const quizStartStep = setupSteps;
  const q1Step = setupSteps + 1;
  const q2Step = setupSteps + 2;
  const q3Step = setupSteps + 3;
  const q4Step = setupSteps + 4;
  const q5Step = setupSteps + 5;
  const q6Step = setupSteps + 6;
  const q7Step = setupSteps + 7;
  const q8Step = setupSteps + 8;
  const q9Step = setupSteps + 9;
  const q10Step = setupSteps + 10;
  const impactStep = setupSteps + 11;
  const q12Step = setupSteps + 12;
  const q13Step = setupSteps + 13;
  const q14Step = setupSteps + 14;
  const q15Step = setupSteps + 15;
  const q16Step = setupSteps + 16;
  const summaryLoadingStep = setupSteps + 17;
  const summaryStep = setupSteps + 18;
  const totalSteps = summaryStep + 1;

  const toggleSelect = (current: string[], value: string, max?: number) => {
    const exists = current.includes(value);
    if (exists) {
      return current.filter(v => v !== value);
    }
    if (max && current.length >= max) {
      return current;
    }
    return [...current, value];
  };

  const sliderMin = 1;
  const sliderMax = 16;
  const sliderRange = sliderMax - sliderMin;
  const [sliderWidth, setSliderWidth] = useState(0);

  const handleSliderInput = (x: number) => {
    if (!sliderWidth) return;
    const clamped = Math.max(0, Math.min(x, sliderWidth));
    const ratio = clamped / sliderWidth;
    const value = Math.round(sliderMin + ratio * sliderRange);
    setQ9Distractions(value);
  };

  const sliderPosition = sliderWidth
    ? ((q9Distractions - sliderMin) / sliderRange) * sliderWidth
    : 0;

  const clampScore = (value: number) => Math.max(0, Math.min(10, Math.round(value * 10) / 10));

  const comparisonLabel = (score: number) => {
    if (score >= 8) return 'significantly above average';
    if (score >= 6.5) return 'above average';
    if (score >= 4.5) return 'average';
    return 'below average';
  };

  const metricColor = (value: number) => {
    if (value >= 7.5) return COLORS.break;
    if (value >= 6) return '#FFD60A';
    return '#FF9F0A';
  };

  const metricDelta = (value: number) => {
    const delta = Math.round(((value - 6) / 30) * 100) / 100;
    return {
      value: delta,
      label: `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`,
    };
  };

  const bigCalendarUri = Image.resolveAssetSource(require('../../assets/icons/big calender.svg')).uri;
  const bigBellUri = Image.resolveAssetSource(require('../../assets/icons/big bell.svg')).uri;
  const bigMapUri = Image.resolveAssetSource(require('../../assets/icons/big map.svg')).uri;

  const requestCalendarPermission = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      const granted = status === 'granted';
      setCalendarEnabled(granted);
      if (!granted) {
        Alert.alert('Calendar access', 'Allow calendar access to sync your events.');
      }
    } catch (e) {
      Alert.alert('Calendar access', 'Enable calendar access in system settings.');
    }
  };

  const requestReminderPermission = async () => {
    try {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      const finalStatus = status === 'granted' ? status : (await Notifications.requestPermissionsAsync()).status;
      const granted = finalStatus === 'granted';
      setNotificationsEnabled(granted);
      await StorageService.syncTaskReminders(undefined, granted);
      if (!granted) {
        Alert.alert('Reminders', 'Enable notifications in system settings.');
      }
    } catch (e) {
      Alert.alert('Reminders', 'Enable notifications in system settings.');
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationEnabled(granted);
      if (!granted) {
        Alert.alert('Location access', 'Allow location access to improve scheduling.');
      }
    } catch (e) {
      Alert.alert('Location access', 'Enable location access in system settings.');
    }
  };

  const summaryData = useMemo(() => {
    const base = {
      discipline: 5,
      consistency: 5,
      timeManagement: 5,
      focus: 5,
      stressRegulation: 5,
      physicalMomentum: 5,
      mentalClarity: 5,
      confidence: 5,
      direction: 5,
      recovery: 5,
      potential: 5,
    };

    const adjust = (key: keyof typeof base, delta: number) => {
      base[key] += delta;
    };

    if (q1LifeFeel.includes('Structured and under control')) {
      adjust('discipline', 1);
      adjust('timeManagement', 1);
      adjust('direction', 0.5);
    }
    if (q1LifeFeel.includes('Busy but manageable')) {
      adjust('consistency', 0.5);
      adjust('stressRegulation', 0.5);
    }
    if (q1LifeFeel.includes('Chaotic')) {
      adjust('discipline', -1);
      adjust('timeManagement', -1);
    }
    if (q1LifeFeel.includes('Draining')) {
      adjust('recovery', -1);
      adjust('physicalMomentum', -0.5);
    }
    if (q1LifeFeel.includes('Overwhelming')) {
      adjust('stressRegulation', -1.5);
    }
    if (q1LifeFeel.includes('Directionless')) {
      adjust('direction', -1.5);
    }

    const planMap: Record<string, number> = {
      'Almost always': 2,
      Often: 1,
      Sometimes: 0,
      Rarely: -1,
      Never: -2,
    };
    if (q2PlanFrequency) {
      adjust('consistency', planMap[q2PlanFrequency] || 0);
      adjust('timeManagement', planMap[q2PlanFrequency] || 0);
    }

    if (q3BehindAreas.includes('Health & fitness')) adjust('physicalMomentum', -1);
    if (q3BehindAreas.includes('Money / career')) adjust('direction', -1);
    if (q3BehindAreas.includes('Discipline & consistency')) adjust('discipline', -1);
    if (q3BehindAreas.includes('Mental clarity & focus')) adjust('mentalClarity', -1);
    if (q3BehindAreas.includes('Confidence')) adjust('confidence', -1);
    if (q3BehindAreas.includes('Relationships')) adjust('direction', -0.5);
    if (q3BehindAreas.includes('Purpose / direction')) adjust('direction', -1.5);

    const stabilityMap: Record<string, number> = {
      'Very stable': 1,
      'Mostly stable': 0.5,
      Unpredictable: -0.5,
      'Constantly changing': -1,
    };
    if (q4Stability) adjust('consistency', stabilityMap[q4Stability] || 0);

    const stressMap: Record<string, number> = {
      Calm: 1,
      'Slightly stressed': 0,
      'Regularly stressed': -1,
      Overloaded: -2,
    };
    if (q5Stress) adjust('stressRegulation', stressMap[q5Stress] || 0);

    if (q6Pressure.includes('None')) {
      adjust('stressRegulation', 1);
    } else {
      adjust('stressRegulation', -0.4 * q6Pressure.length);
    }

    const enoughMap: Record<string, number> = {
      'Yes, consistently': 1,
      Sometimes: 0,
      Rarely: -1,
      'Almost never': -2,
    };
    if (q7Enough) {
      adjust('discipline', enoughMap[q7Enough] || 0);
      adjust('consistency', enoughMap[q7Enough] || 0);
    }

    if (q8Drains.includes('Poor sleep')) adjust('recovery', -1);
    if (q8Drains.includes('Mental overload')) adjust('mentalClarity', -1);
    if (q8Drains.includes('Screen time / scrolling')) adjust('focus', -1);
    if (q8Drains.includes('Junk food')) adjust('physicalMomentum', -1);
    if (q8Drains.includes('Overthinking')) adjust('mentalClarity', -1);
    if (q8Drains.includes('Lack of structure')) adjust('timeManagement', -1);
    if (q8Drains.includes('Bad habits')) adjust('discipline', -1);

    if (q9Distractions <= 3) {
      adjust('focus', 1);
      adjust('discipline', 0.5);
    } else if (q9Distractions >= 8 && q9Distractions <= 12) {
      adjust('focus', -1);
      adjust('timeManagement', -0.5);
    } else if (q9Distractions >= 13) {
      adjust('focus', -2);
      adjust('timeManagement', -1);
      adjust('discipline', -1);
    }

    if (q10Distractions.includes('None')) {
      adjust('focus', 1);
    } else {
      adjust('focus', -0.3 * q10Distractions.length);
    }

    q12Aspirations.forEach(() => {
      adjust('direction', 0.4);
      adjust('confidence', 0.2);
      adjust('potential', 0.4);
    });

    q13Goals.forEach(() => {
      adjust('direction', 0.4);
      adjust('potential', 0.4);
    });

    const routineMap: Record<string, number> = {
      'Yes, consistently': 1,
      Sometimes: 0,
      'Tried but failed': -1,
      'No structure': -2,
    };
    if (q14Routines) {
      adjust('discipline', routineMap[q14Routines] || 0);
      adjust('consistency', routineMap[q14Routines] || 0);
    }

    const commitmentMap: Record<string, number> = {
      Curious: 0,
      'Somewhat serious': 0.5,
      'Very serious': 1,
      'This is non-negotiable': 2,
    };
    if (q15Commitment) {
      adjust('discipline', commitmentMap[q15Commitment] || 0);
      adjust('direction', commitmentMap[q15Commitment] || 0);
      adjust('potential', commitmentMap[q15Commitment] || 0);
    }

    q16Willing.forEach(() => {
      adjust('discipline', 0.3);
      adjust('timeManagement', 0.2);
      adjust('potential', 0.2);
    });

    const metrics = {
      discipline: clampScore(base.discipline),
      consistency: clampScore(base.consistency),
      timeManagement: clampScore(base.timeManagement),
      focus: clampScore(base.focus),
      stressRegulation: clampScore(base.stressRegulation),
      physicalMomentum: clampScore(base.physicalMomentum),
      mentalClarity: clampScore(base.mentalClarity),
      confidence: clampScore(base.confidence),
      direction: clampScore(base.direction),
      recovery: clampScore(base.recovery),
    };

    const averageScore = Object.values(metrics).reduce((sum, v) => sum + v, 0) / Object.values(metrics).length;
    const potentialScore = clampScore(base.potential + (averageScore - 5) * 0.4);

    const hoursPerYear = Math.round(q9Distractions * 365);
    const daysPerYear = Math.round(hoursPerYear / 24);

    const lowStructure = metrics.discipline < 5 || metrics.timeManagement < 5;
    const highLoad = metrics.stressRegulation < 5 || metrics.recovery < 5;
    const highDistraction = q9Distractions >= 8 || q10Distractions.length >= 2;

    let diagnosis = 'You’re capable, but your system is loose. The main leaks are distraction and inconsistent structure, not ambition.';
    if (!lowStructure && !highLoad) {
      diagnosis = 'You have solid foundations, but momentum is uneven. Tightening consistency and focus will compound quickly.';
    } else if (lowStructure && highLoad) {
      diagnosis = 'You’re ambitious, but currently running on low structure and high mental load. The biggest leaks are distraction and inconsistency, not ability.';
    } else if (highDistraction && lowStructure) {
      diagnosis = 'You have strong intent, but attention leaks are killing momentum. Fixing structure will unlock fast wins.';
    }

    let projection = 'At your current trajectory: slow progress, high frustration. With structure + AI planning: measurable gains in 30 days.';
    if (averageScore >= 7) {
      projection = 'At your current trajectory: steady progress with occasional stalls. With structure + AI planning: visible gains in 30 days.';
    } else if (averageScore <= 4) {
      projection = 'At your current trajectory: stalled progress and high friction. With structure + AI planning: clear momentum in 30 days.';
    }

    return {
      metrics,
      averageScore,
      potentialScore,
      diagnosis,
      projection,
      hoursPerYear,
      daysPerYear,
    };
  }, [
    q1LifeFeel,
    q2PlanFrequency,
    q3BehindAreas,
    q4Stability,
    q5Stress,
    q6Pressure,
    q7Enough,
    q8Drains,
    q9Distractions,
    q10Distractions,
    q12Aspirations,
    q13Goals,
    q14Routines,
    q15Commitment,
    q16Willing,
  ]);

  useEffect(() => {
    if (step !== summaryLoadingStep) return;
    setSummaryProgress(0);
    const duration = 2600;
    const start = Date.now();
    const progressTimer = setInterval(() => {
      const next = Math.min(1, (Date.now() - start) / duration);
      setSummaryProgress(next);
    }, 50);
    const advanceTimer = setTimeout(() => {
      setStep(summaryStep);
    }, duration + 200);
    return () => {
      clearInterval(progressTimer);
      clearTimeout(advanceTimer);
    };
  }, [step, summaryLoadingStep, summaryStep]);

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const toTime = (minutes: number) => {
    const total = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const createPlanSchedule = (): TimeBlock[] => {
    const wake = wakeTime || '07:00';
    const sleep = sleepTime || '22:00';
    let startMin = toMinutes(wake);
    let sleepStart = toMinutes(sleep);
    if (sleepStart <= startMin) sleepStart += 1440;
    const sleepEnd = sleepStart + 60;
    const wakeEnd = startMin + 30;
    return [
      {
        id: uuidv4(),
        title: 'Wake Up',
        startTime: toTime(startMin),
        endTime: toTime(wakeEnd),
        type: 'routine',
        isRoutine: true,
        isCompleted: false,
      },
      {
        id: uuidv4(),
        title: 'Sleep Time',
        startTime: toTime(sleepStart),
        endTime: toTime(sleepEnd),
        type: 'routine',
        isRoutine: true,
        isCompleted: false,
      },
    ];
  };

  const handleFinish = async () => {
    const onboardingQuiz = {
      answers: {
        q1LifeFeel,
        q2PlanFrequency,
        q3BehindAreas,
        q4Stability,
        q5Stress,
        q6Pressure,
        q7Enough,
        q8Drains,
        q9Distractions,
        q10Distractions,
        q12Aspirations,
        q13Goals,
        q14Routines,
        q15Commitment,
        q16Willing,
      },
      summary: summaryData,
      completedAt: new Date().toISOString(),
    };
    const profile: UserProfile = {
      name: name.trim(),
      gender: gender || 'other',
      dob: dob.toISOString(),
      notificationsEnabled,
      calendarEnabled,
      locationEnabled,
      isOnboardingCompleted: true,
      wakeTime,
      sleepTime,
      onboardingQuiz,
      xp: 0,
      rank: 'Iron I',
      streak: 0,
    };
    await StorageService.saveUserProfile(profile);
    const routines = await StorageService.getRoutines();
    const templateId = 'template-morning-routine';
    if (!routines.some(routine => routine.id === templateId)) {
      const startMin = toMinutes(wakeTime || '07:00') + 30;
      const endMin = startMin + 90;
      const template = {
        id: templateId,
        title: 'Morning Routine',
        isTemplate: true,
        steps: [
          { id: uuidv4(), label: 'Immediate light exposure (within 10 min)' },
          { id: uuidv4(), label: '750 ml cold water immediately' },
          { id: uuidv4(), label: 'Zero phone input (within 30 min)' },
          { id: uuidv4(), label: 'Mobility Stretches (10 min)' },
          { id: uuidv4(), label: 'Cold shower 30–90 seconds' },
          { id: uuidv4(), label: 'Delay caffeine 60 min post–wake' },
        ],
        configs: Array.from({ length: 7 }).map((_, dayIndex) => ({
          dayIndex,
          startTime: toTime(startMin),
          endTime: toTime(endMin),
        })),
      };
      await StorageService.saveRoutines([...routines, template]);
    }
    const generatedSchedule = createPlanSchedule();
    if (generatedSchedule.length) {
      await StorageService.saveSchedule(generatedSchedule);
    }
    onComplete();
  };

  const handleNext = async () => {
    if (step === 0 && !name.trim()) {
      Alert.alert('Required', 'Please enter your username');
      return;
    }
    if (step === 1 && !gender) {
      Alert.alert('Required', 'Please select your gender');
      return;
    }
    if (step === q1Step && q1LifeFeel.length === 0) {
      Alert.alert('Required', 'Select at least one option');
      return;
    }
    if (step === q2Step && !q2PlanFrequency) {
      Alert.alert('Required', 'Select one option');
      return;
    }
    if (step === q3Step && q3BehindAreas.length === 0) {
      Alert.alert('Required', 'Select at least one option');
      return;
    }
    if (step === q4Step && !q4Stability) {
      Alert.alert('Required', 'Select one option');
      return;
    }
    if (step === q5Step && !q5Stress) {
      Alert.alert('Required', 'Select one option');
      return;
    }
    if (step === q6Step && q6Pressure.length === 0) {
      Alert.alert('Required', 'Select at least one option');
      return;
    }
    if (step === q7Step && !q7Enough) {
      Alert.alert('Required', 'Select one option');
      return;
    }
    if (step === q8Step && q8Drains.length === 0) {
      Alert.alert('Required', 'Select up to 3 options');
      return;
    }
    if (step === q9Step && (!q9Distractions || q9Distractions < 1)) {
      Alert.alert('Required', 'Select a value between 1 and 16');
      return;
    }
    if (step === q12Step && q12Aspirations.length === 0) {
      Alert.alert('Required', 'Select up to 3 options');
      return;
    }
    if (step === q13Step && q13Goals.length === 0) {
      Alert.alert('Required', 'Select at least one option');
      return;
    }
    if (step === q14Step && !q14Routines) {
      Alert.alert('Required', 'Select one option');
      return;
    }
    if (step === q15Step && !q15Commitment) {
      Alert.alert('Required', 'Select one option');
      return;
    }
    if (step === q16Step && q16Willing.length === 0) {
      Alert.alert('Required', 'Select at least one option');
      return;
    }
    if (step < totalSteps - 1) {
      if (step === q16Step) {
        setStep(summaryLoadingStep);
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{step < quizStartStep ? 'Setup' : 'Quiz'}</Text>
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What is your username?</Text>
            <Text style={styles.subtext}>Helps personalize your experience.</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={24} color={COLORS.textDim} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor={COLORS.textDim}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                />
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What is your gender?</Text>
            <Text style={styles.subtext}>Helps personalize your experience.</Text>
            <TouchableOpacity 
                style={[styles.optionButton, gender === 'male' && styles.optionButtonActive]} 
                onPress={() => setGender('male')}
            >
                <Text style={styles.optionText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.optionButton, gender === 'female' && styles.optionButtonActive]} 
                onPress={() => setGender('female')}
            >
                <Text style={styles.optionText}>Female</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>When were you born?</Text>
            <Text style={styles.subtext}>Helps personalize your experience.</Text>
            <View style={styles.datePickerContainer}>
                <DateTimePicker
                    value={dob}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                        const currentDate = selectedDate || dob;
                        setDob(currentDate);
                    }}
                    textColor="#FEF8EF"
                    themeVariant="dark"
                />
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Set your daily rhythm</Text>
            <Text style={styles.subtext}>We’ll shape your plan around this.</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity 
                style={[styles.timeButton, styles.timeButtonHalf]} 
                onPress={() => { setActiveTimeField('wake'); setIsTimePickerVisible(true); }}
              >
                <Text style={styles.timeLabel}>Wake</Text>
                <Text style={styles.timeText}>{wakeTime}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.timeButton, styles.timeButtonHalf]} 
                onPress={() => { setActiveTimeField('sleep'); setIsTimePickerVisible(true); }}
              >
                <Text style={styles.timeLabel}>Sleep</Text>
                <Text style={styles.timeText}>{sleepTime}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case calendarStep:
        return (
          <View style={styles.permissionContainer}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionTitle}>Import your calendar</Text>
              <Text style={styles.permissionSubtitle}>
                Sync your calendar to your timetable instantly with one tap.
              </Text>
            </View>
            <View style={styles.permissionIconWrap}>
              <SvgUri uri={bigCalendarUri} width={160} height={160} />
            </View>
            <TouchableOpacity style={styles.permissionButton} onPress={requestCalendarPermission}>
              <Text style={styles.permissionButtonText}>Import calendar</Text>
            </TouchableOpacity>
          </View>
        );
      case remindersStep:
        return (
          <View style={styles.permissionContainer}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionTitle}>Enable Reminders</Text>
              <Text style={styles.permissionSubtitle}>
                Get notified about important updates in real time.
              </Text>
            </View>
            <View style={styles.permissionIconWrap}>
              <SvgUri uri={bigBellUri} width={160} height={160} />
            </View>
            <TouchableOpacity style={styles.permissionButton} onPress={requestReminderPermission}>
              <Text style={styles.permissionButtonText}>Enable Reminders</Text>
            </TouchableOpacity>
          </View>
        );
      case locationStep:
        return (
          <View style={styles.permissionContainer}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionTitle}>Track your Location</Text>
              <Text style={styles.permissionSubtitle}>
                Plan smarter with real-time commute data built into your schedule.
              </Text>
            </View>
            <View style={styles.permissionIconWrap}>
              <SvgUri uri={bigMapUri} width={160} height={160} />
            </View>
            <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
              <Text style={styles.permissionButtonText}>Track Location</Text>
            </TouchableOpacity>
          </View>
        );
      case quizStartStep:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Let AI plan your day</Text>
            <Text style={styles.subtext}>Quick quiz. Tap-based. One idea per screen.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Start Quiz</Text>
            </TouchableOpacity>
          </View>
        );
      case q1Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.phaseText}>Phase 1 — Reality check</Text>
            <Text style={styles.question}>How does your life feel right now?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            {Q1_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q1LifeFeel.includes(option) && styles.optionButtonActive]}
                onPress={() => setQ1LifeFeel(toggleSelect(q1LifeFeel, option))}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case q2Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>How often do your days go as planned?</Text>
            {Q2_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q2PlanFrequency === option && styles.optionButtonActive]}
                onPress={() => setQ2PlanFrequency(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case q3Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Right now, where do you feel most behind?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            {Q3_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q3BehindAreas.includes(option) && styles.optionButtonActive]}
                onPress={() => setQ3BehindAreas(toggleSelect(q3BehindAreas, option))}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case q4Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.phaseText}>Phase 2 — Stability & load</Text>
            <Text style={styles.question}>How stable is your life week-to-week?</Text>
            {Q4_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q4Stability === option && styles.optionButtonActive]}
                onPress={() => setQ4Stability(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case q5Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>How stressed are you most days?</Text>
            {Q5_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q5Stress === option && styles.optionButtonActive]}
                onPress={() => setQ5Stress(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case q6Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What creates pressure in your life right now?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            {Q6_OPTIONS.map(option => {
              const selected = q6Pressure.includes(option);
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, selected && styles.optionButtonActive]}
                  onPress={() => {
                    if (option === 'None') {
                      setQ6Pressure(selected ? [] : ['None']);
                      return;
                    }
                    const next = toggleSelect(q6Pressure.filter(item => item !== 'None'), option);
                    setQ6Pressure(next);
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case q7Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.phaseText}>Phase 3 — Energy & drain</Text>
            <Text style={styles.question}>By the end of most days, do you feel like you did enough?</Text>
            {Q7_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q7Enough === option && styles.optionButtonActive]}
                onPress={() => setQ7Enough(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case q8Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What drains your energy the most?</Text>
            <Text style={styles.subtext}>Choose top 3</Text>
            {Q8_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q8Drains.includes(option) && styles.optionButtonActive]}
                onPress={() => setQ8Drains(toggleSelect(q8Drains, option, 3))}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.selectionCount}>{q8Drains.length}/3 selected</Text>
          </View>
        );
      case q9Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Roughly how many hours per day go to distractions?</Text>
            <Text style={styles.subtext}>Drag the slider</Text>
            <View style={styles.sliderValueRow}>
              <Text style={styles.sliderValueText}>{q9Distractions} hours</Text>
            </View>
            <View
              style={styles.sliderTrackContainer}
              onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(event) => handleSliderInput(event.nativeEvent.locationX)}
              onResponderMove={(event) => handleSliderInput(event.nativeEvent.locationX)}
            >
              <View style={styles.sliderTrack} />
              <View style={[styles.sliderFill, { width: sliderPosition }]} />
              <View style={[styles.sliderThumb, { left: sliderPosition - 14 }]} />
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>1h</Text>
              <Text style={styles.sliderLabelText}>16h</Text>
            </View>
          </View>
        );
      case q10Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.phaseText}>Phase 4 — Confrontation</Text>
            <Text style={styles.question}>Which distractions apply to you?</Text>
            <Text style={styles.subtext}>Multi-select, optional</Text>
            {Q10_OPTIONS.map(option => {
              const selected = q10Distractions.includes(option);
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, selected && styles.optionButtonActive]}
                  onPress={() => {
                    if (option === 'None') {
                      setQ10Distractions(selected ? [] : ['None']);
                      return;
                    }
                    const next = toggleSelect(q10Distractions.filter(item => item !== 'None'), option);
                    setQ10Distractions(next);
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.textButton} onPress={handleNext}>
              <Text style={styles.textButtonLabel}>Skip</Text>
            </TouchableOpacity>
          </View>
        );
      case impactStep:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Impact</Text>
            <Text style={styles.impactText}>
              At your current distraction level, this costs you ~{summaryData.hoursPerYear} hours per year.
              {'\n'}That’s ~{summaryData.daysPerYear} full days.
              {'\n'}Enough time to master a skill, transform your body, or change your career.
            </Text>
            <Text style={styles.subtext}>No scolding. Just math.</Text>
          </View>
        );
      case q12Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.phaseText}>Phase 5 — Identity & goals</Text>
            <Text style={styles.question}>What do you actually want your life to become?</Text>
            <Text style={styles.subtext}>Choose up to 3</Text>
            {Q12_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q12Aspirations.includes(option) && styles.optionButtonActive]}
                onPress={() => setQ12Aspirations(toggleSelect(q12Aspirations, option, 3))}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.selectionCount}>{q12Aspirations.length}/3 selected</Text>
          </View>
        );
      case q13Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Your biggest long-term goals?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            {Q13_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q13Goals.includes(option) && styles.optionButtonActive]}
                onPress={() => setQ13Goals(toggleSelect(q13Goals, option))}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case q14Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Do you currently follow routines?</Text>
            {Q14_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q14Routines === option && styles.optionButtonActive]}
                onPress={() => setQ14Routines(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case q15Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.phaseText}>Phase 6 — Commitment filter</Text>
            <Text style={styles.question}>How committed are you to changing your life?</Text>
            {Q15_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q15Commitment === option && styles.optionButtonActive]}
                onPress={() => setQ15Commitment(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case q16Step:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>What are you willing to do?</Text>
            <Text style={styles.subtext}>Select all that apply</Text>
            {Q16_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, q16Willing.includes(option) && styles.optionButtonActive]}
                onPress={() => setQ16Willing(toggleSelect(q16Willing, option))}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case summaryLoadingStep:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.question}>Generating your AI Summary</Text>
            <Text style={styles.subtext}>We’re building a plan tuned to your answers.</Text>
            <View style={styles.loadingCard}>
              <View style={styles.loadingBarTrack}>
                <View style={[styles.loadingBarFill, { width: `${summaryProgress * 100}%` }]} />
              </View>
              <Text style={styles.loadingPercent}>{Math.round(summaryProgress * 100)}%</Text>
              <View style={styles.loadingInfo}>
                <Text style={styles.loadingInfoTitle}>What this includes</Text>
                <Text style={styles.loadingInfoItem}>Behavior patterns and friction points</Text>
                <Text style={styles.loadingInfoItem}>12 core performance metrics</Text>
                <Text style={styles.loadingInfoItem}>30-day projection with AI structure</Text>
              </View>
            </View>
          </View>
        );
      case summaryStep: {
        const attentionScore = clampScore((summaryData.metrics.focus + summaryData.metrics.timeManagement) / 2);
        const burntOutScore = clampScore(10 - (summaryData.metrics.recovery + summaryData.metrics.stressRegulation) / 2);
        const metricCards = [
          { key: 'discipline', label: 'Discipline', value: summaryData.metrics.discipline },
          { key: 'consistency', label: 'Consistency', value: summaryData.metrics.consistency },
          { key: 'timeManagement', label: 'Time management', value: summaryData.metrics.timeManagement },
          { key: 'focus', label: 'Focus', value: summaryData.metrics.focus },
          { key: 'stressRegulation', label: 'Stress regulation', value: summaryData.metrics.stressRegulation },
          { key: 'physicalMomentum', label: 'Physical momentum', value: summaryData.metrics.physicalMomentum },
          { key: 'mentalClarity', label: 'Mental clarity', value: summaryData.metrics.mentalClarity },
          { key: 'confidence', label: 'Confidence', value: summaryData.metrics.confidence },
          { key: 'direction', label: 'Direction', value: summaryData.metrics.direction },
          { key: 'recovery', label: 'Recovery', value: summaryData.metrics.recovery },
          { key: 'burntOut', label: 'Burnt Out', value: burntOutScore },
          { key: 'attention', label: 'Attention', value: attentionScore },
        ];

        return (
          <ScrollView style={styles.summaryScroll} contentContainerStyle={styles.summaryContent}>
            <Text style={styles.question}>AI Summary</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Life Diagnosis</Text>
              <Text style={styles.summaryBody}>
                You’re ambitious, but currently operating with low structure and high mental load. Your biggest leaks are distraction and inconsistency, not ability.
              </Text>

              <Text style={styles.summaryTitle}>Comparison to Average Person</Text>
              <Text style={styles.summaryBody}>Compared to people your age:</Text>
              <Text style={styles.summaryBody}>Discipline: {comparisonLabel(summaryData.metrics.discipline)}</Text>
              <Text style={styles.summaryBody}>Clarity: {comparisonLabel(summaryData.metrics.mentalClarity)}</Text>
              <Text style={styles.summaryBody}>Potential: {comparisonLabel(summaryData.potentialScore)}</Text>

            <Text style={styles.summaryTitle}>Core Metrics</Text>
              <View style={styles.metricsGrid}>
              {metricCards.map(metric => {
                const delta = metricDelta(metric.value);
                return (
                  <View key={metric.key} style={styles.metricCard}>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <View style={styles.metricValueRow}>
                      <Text style={styles.metricValue}>{metric.value.toFixed(1)}</Text>
                      <Text
                        style={[
                          styles.metricDelta,
                          { color: delta.value >= 0 ? COLORS.break : '#FF9F0A' },
                        ]}
                      >
                        {delta.label}
                      </Text>
                    </View>
                    <View style={styles.metricBarTrack}>
                      <View
                        style={[
                          styles.metricBarFill,
                          {
                            width: `${(metric.value / 10) * 100}%`,
                            backgroundColor: metricColor(metric.value),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.metricMenu}>•••</Text>
                  </View>
                );
              })}
              </View>

              <Text style={styles.summaryTitle}>Potential Projection</Text>
              <Text style={styles.summaryBody}>
                At your current trajectory: slow progress, high frustration. With structure + AI planning: measurable gains in 30 days.
              </Text>

              <Text style={styles.summaryTitle}>Call to Action</Text>
              <Text style={styles.summaryBody}>Let me take over planning your days.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={handleFinish}>
                <Text style={styles.primaryButtonText}>Generate My Plan</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
      }
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {step > 0 && (
            <TouchableOpacity onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
             {renderProgressBar()}
        </View>
      </View>

      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {step < summaryLoadingStep && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Ionicons name="arrow-forward" size={32} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      )}

      <TimePickerModal
        visible={isTimePickerVisible}
        onClose={() => setIsTimePickerVisible(false)}
        onSave={(t) => activeTimeField === 'wake' ? setWakeTime(t) : setSleepTime(t)}
        initialTime={activeTimeField === 'wake' ? wakeTime : sleepTime}
        title={activeTimeField === 'wake' ? 'Wake Time' : 'Sleep Time'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.l,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  progressContainer: {
    marginLeft: SPACING.m,
    flex: 1,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.break, // Green
  },
  progressText: {
    color: COLORS.textDim,
    fontSize: 10,
    marginTop: 4,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center', // Center vertically? Image shows top aligned mostly
    // alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  question: {
    color: COLORS.text,
    fontSize: FONTS.h2, // 24
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  subtext: {
    color: COLORS.textDim,
    fontSize: FONTS.caption,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  permissionContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionHeader: {
    width: '100%',
  },
  permissionTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.s,
  },
  permissionSubtitle: {
    color: COLORS.textDim,
    fontSize: FONTS.caption,
  },
  permissionIconWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButton: {
    width: '100%',
    height: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.l,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  permissionButtonText: {
    color: '#16202A',
    fontSize: FONTS.body,
    fontWeight: 'bold',
  },
  phaseText: {
      color: COLORS.textDim,
      fontSize: FONTS.caption,
      fontWeight: '600',
      marginBottom: SPACING.s,
  },
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      paddingHorizontal: SPACING.m,
      width: '100%',
      height: 60,
  },
  inputIcon: {
      marginRight: SPACING.s,
  },
  input: {
      flex: 1,
      color: COLORS.text,
      fontSize: FONTS.body,
  },
  timeButton: {
      width: '100%',
      padding: SPACING.l,
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      alignItems: 'center',
  },
  timeRow: {
      width: '100%',
      flexDirection: 'row',
      gap: SPACING.m,
  },
  timeButtonHalf: {
      flex: 1,
  },
  timeLabel: {
      color: COLORS.textDim,
      fontSize: FONTS.caption,
      marginBottom: 6,
  },
  timeText: {
      color: COLORS.text,
      fontSize: FONTS.h2,
      fontWeight: 'bold',
  },
  optionButton: {
      width: '100%',
      padding: SPACING.l,
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      marginBottom: SPACING.m,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
  },
  optionButtonActive: {
      borderColor: COLORS.textDim, // Or break color? Image shows subtle border or highlight
      backgroundColor: '#2C2C2E', // Slightly lighter
  },
  optionText: {
      color: COLORS.text,
      fontWeight: 'bold',
  },
  selectionCount: {
      color: COLORS.textDim,
      marginTop: SPACING.s,
  },
  impactText: {
      color: COLORS.text,
      textAlign: 'center',
      marginBottom: SPACING.m,
      lineHeight: 22,
  },
  sliderValueRow: {
      marginTop: SPACING.m,
      marginBottom: SPACING.m,
  },
  sliderValueText: {
      color: COLORS.text,
      fontSize: FONTS.h2,
      fontWeight: 'bold',
  },
  sliderTrackContainer: {
      width: '100%',
      height: 44,
      justifyContent: 'center',
  },
  sliderTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.surface,
  },
  sliderFill: {
      position: 'absolute',
      left: 0,
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.break,
  },
  sliderThumb: {
      position: 'absolute',
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: COLORS.break,
      top: 8,
  },
  sliderLabels: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: SPACING.s,
  },
  sliderLabelText: {
      color: COLORS.textDim,
      fontSize: FONTS.caption,
  },
  textButton: {
      marginTop: SPACING.m,
  },
  textButtonLabel: {
      color: COLORS.textDim,
      fontSize: FONTS.caption,
  },
  datePickerContainer: {
      width: '100%',
      alignItems: 'center',
  },
  summaryScroll: {
      width: '100%',
      flex: 1,
  },
  summaryContent: {
      alignItems: 'stretch',
      paddingBottom: SPACING.xl,
  },
  summaryCard: {
      width: '100%',
      backgroundColor: 'transparent',
      borderRadius: 16,
      padding: SPACING.l,
  },
  summaryTitle: {
      color: COLORS.text,
      fontSize: FONTS.body,
      fontWeight: 'bold',
      marginTop: SPACING.m,
      marginBottom: SPACING.s,
  },
  summaryBody: {
      color: COLORS.textDim,
      fontSize: FONTS.body,
      lineHeight: 20,
      marginBottom: SPACING.s,
  },
  metricsGrid: {
      width: '100%',
      marginTop: SPACING.s,
      marginBottom: SPACING.m,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
  },
  metricCard: {
      width: '48%',
      minHeight: 90,
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      padding: SPACING.m,
      marginBottom: SPACING.m,
      borderWidth: 1,
      borderColor: '#2C2C2E',
      justifyContent: 'space-between',
  },
  metricLabel: {
      color: COLORS.textDim,
      fontSize: 12,
      fontWeight: '600',
  },
  metricValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
  },
  metricValue: {
      color: COLORS.text,
      fontWeight: 'bold',
      fontSize: 18,
  },
  metricDelta: {
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 6,
  },
  metricBarTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: '#2C2C2E',
      marginTop: 10,
  },
  metricBarFill: {
      height: '100%',
      borderRadius: 2,
  },
  metricMenu: {
      color: COLORS.textDim,
      fontSize: 12,
      alignSelf: 'flex-end',
      marginTop: 6,
  },
  loadingCard: {
      width: '100%',
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      padding: SPACING.l,
      alignItems: 'center',
  },
  loadingBarTrack: {
      width: '100%',
      height: 8,
      backgroundColor: '#2C2C2E',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: SPACING.s,
  },
  loadingBarFill: {
      height: '100%',
      backgroundColor: COLORS.break,
  },
  loadingPercent: {
      color: COLORS.text,
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: SPACING.m,
  },
  loadingInfo: {
      width: '100%',
      backgroundColor: '#111111',
      borderRadius: 12,
      padding: SPACING.m,
  },
  loadingInfoTitle: {
      color: COLORS.text,
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: SPACING.s,
  },
  loadingInfoItem: {
      color: COLORS.textDim,
      fontSize: 13,
      marginBottom: 6,
  },
  primaryButton: {
      width: '100%',
      padding: SPACING.m,
      backgroundColor: COLORS.break,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: SPACING.m,
  },
  primaryButtonText: {
      color: COLORS.background,
      fontWeight: 'bold',
      fontSize: FONTS.body,
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: SPACING.l,
      paddingRight: SPACING.s,
  },
  nextButton: {
      backgroundColor: COLORS.break, // Green circle
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: SPACING.m,
  },
});

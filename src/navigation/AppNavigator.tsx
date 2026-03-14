import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Circle, Svg, SvgUri, SvgXml } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { Animated, Alert, Dimensions, Easing, FlatList, Image, Keyboard, Modal, PanResponder, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { addDays, endOfDay, format, parseISO, startOfDay } from 'date-fns';
import { NowScreen } from '../screens/NowScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { HealthScreen } from '../screens/HealthScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { COLORS } from '../constants/theme';
import { StorageService } from '../services/storage';
import { TimeBlock } from '../types';
import { supabase } from '../lib/supabase';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const INTRO_GREEN = '#3CAD74';
const INTRO_ARROW_GREEN = '#72AD8D';
const INTRO_ARROW_WHITE = '#FEF8EF';
const INTRO_ARROW_ORANGE = '#FDB29E';
const INTRO_LOGO = require('../../assets/logos/playstore.png');
const MOCKUP_PHONE_IMAGE = require('../../assets/icons/[Mockup] iPhone 13.png');
const MOCKUP_IMPORT_IMAGE = require('../../assets/[Mockup] iPhone 13 2.png');
const INTRO_BELL_URI = Image.resolveAssetSource(require('../../assets/icons/big bell.svg')).uri;
const INTRO_MAP_URI = Image.resolveAssetSource(require('../../assets/icons/big map.svg')).uri;
const INTRO1_BACKGROUND_IMAGE = require('../../assets/Intro1bg.png');
const INTRO2_BACKGROUND_IMAGE = require('../../assets/intro2bg.png');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const speechModule = (() => {
  try {
    return require('expo-speech-recognition');
  } catch {
    return null;
  }
})();

type LongPressScaleProps = {
  style?: any;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  activeOpacity?: number;
  pressInScale?: number;
  children: React.ReactNode;
};

const LongPressScale = ({
  style,
  onPress,
  onLongPress,
  delayLongPress,
  activeOpacity = 0.85,
  pressInScale = 1.02,
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
    >
      {children}
    </AnimatedTouchable>
  );
};

const dashboardIconSvg = `<svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.3333 0H6.66667C2.98667 0 0 2.86222 0 6.38889V16.6111C0 20.1378 2.98667 23 6.66667 23H17.3333C21.0133 23 24 20.1378 24 16.6111V6.38889C24 2.86222 21.0133 0 17.3333 0ZM6.66667 2.55556H13.3333V14.0556H2.66667V6.38889C2.66667 4.28056 4.46667 2.55556 6.66667 2.55556ZM2.66667 16.6111H13.3333V20.4444H6.66667C4.46667 20.4444 2.66667 18.7194 2.66667 16.6111ZM21.3333 16.6111C21.3333 18.7194 19.5333 20.4444 17.3333 20.4444H16V8.94444H21.3333V16.6111ZM21.3333 6.38889H16V2.55556H17.3333C19.5333 2.55556 21.3333 4.28056 21.3333 6.38889Z" fill="#FEF8EF"/></svg>`;
const insightIconSvg = `<svg width="18" height="23" viewBox="0 0 18 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 9.00695C18 4.04391 13.9592 0 9 0C4.04081 0 0 4.04391 0 9.00695C0 12.2122 1.7334 15.1533 4.46555 16.7617L4.4426 18.485C4.4426 20.978 6.463 23 8.95407 23C11.4451 23 13.4656 20.978 13.4656 18.485V16.8077C16.2322 15.2108 18 12.2467 18 9.00695ZM11.1697 18.485C11.1697 19.7027 10.1709 20.7023 8.95407 20.7023C7.73723 20.7023 6.73852 19.7027 6.73852 18.485V17.2902H11.1697V18.485ZM12.0306 14.9925H10.148V9.2138C10.148 8.58193 9.63138 8.06495 9 8.06495C8.36862 8.06495 7.85204 8.58193 7.85204 9.2138V14.9925H5.96937C3.73085 13.8551 2.29592 11.5344 2.29592 9.00695C2.29592 5.30765 5.30357 2.2977 9 2.2977C12.6964 2.2977 15.7041 5.30765 15.7041 9.00695C15.7041 11.5344 14.2692 13.8551 12.0306 14.9925Z" fill="#FEF8EF"/></svg>`;
const calendarIconSvg = `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.6667 2.63158V1.31579C18.6667 0.592105 18.0667 0 17.3333 0C16.6 0 16 0.592105 16 1.31579V2.63158H8V1.31579C8 0.592105 7.4 0 6.66667 0C5.93333 0 5.33333 0.592105 5.33333 1.31579V2.63158C2.38667 2.63158 0 4.98684 0 7.89474V19.7368C0 22.6447 2.38667 25 5.33333 25H18.6667C21.6133 25 24 22.6447 24 19.7368V7.89474C24 4.98684 21.6133 2.63158 18.6667 2.63158ZM21.3333 19.7368C21.3333 21.1842 20.1333 22.3684 18.6667 22.3684H5.33333C3.86667 22.3684 2.66667 21.1842 2.66667 19.7368V7.89474C2.66667 6.44737 3.86667 5.26316 5.33333 5.26316V6.57895C5.33333 7.30263 5.93333 7.89474 6.66667 7.89474C7.4 7.89474 8 7.30263 8 6.57895V5.26316H16V6.57895C16 7.30263 16.6 7.89474 17.3333 7.89474C18.0667 7.89474 18.6667 7.30263 18.6667 6.57895V5.26316C20.1333 5.26316 21.3333 6.44737 21.3333 7.89474V19.7368Z" fill="#FEF8EF"/></svg>`;
const goalsIconSvg = `<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.8116 9.63589H18.6472M14.8116 9.63589V5.78536M14.8116 9.63589L12.0992 12.3592M14.8116 9.63589L14.8112 6.41715M14.8116 9.63589L18.0177 9.63582M18.6472 9.63589L23.25 5.01526M18.6472 9.63589L21.4455 6.82636M18.6472 9.63589L18.0177 9.63582M23.25 5.01526H19.4143L19.3293 1.25006M23.25 5.01526L21.4455 6.82636M19.3293 1.25006L14.8116 5.78536M19.3293 1.25006L17.6097 2.97594M14.8116 5.78536L17.6097 2.97594M14.8116 5.78536L14.8112 6.41715M17.6097 2.97594C15.9946 2.01793 14.1107 1.46819 12.0989 1.46819C6.1072 1.46819 1.25 6.34422 1.25 12.3591C1.25 18.374 6.1072 23.2501 12.0989 23.2501C18.0905 23.2501 22.9477 18.374 22.9477 12.3591C22.9477 10.3393 22.4 8.44784 21.4455 6.82636M14.8112 6.41715C13.9855 6.03668 13.0669 5.82456 12.0989 5.82456C8.50387 5.82456 5.58955 8.75018 5.58955 12.3591C5.58955 15.9681 8.50387 18.8937 12.0989 18.8937C15.6939 18.8937 18.6082 15.9681 18.6082 12.3591C18.6082 11.3872 18.3968 10.4648 18.0177 9.63582" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const leaderboardIconSvg = `<svg width="27" height="22" viewBox="0 0 27 22" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="13.5127" cy="5.5" r="4.15" stroke="#F2F2F7" stroke-width="2.7" stroke-linecap="round"/><path d="M17.9845 5.4875C18.3525 4.85013 18.9586 4.38504 19.6695 4.19456C20.3804 4.00408 21.1378 4.1038 21.7752 4.47178C22.4126 4.83977 22.8777 5.44588 23.0681 6.15678C23.2586 6.86768 23.1589 7.62513 22.7909 8.2625C22.4229 8.89988 21.8168 9.36496 21.1059 9.55545C20.395 9.74593 19.6376 9.64621 19.0002 9.27822C18.3628 8.91024 17.8977 8.30412 17.7073 7.59323C17.5168 6.88233 17.6165 6.12488 17.9845 5.4875L17.9845 5.4875Z" stroke="#F2F2F7" stroke-width="2.7"/><path d="M4.23447 5.4875C4.60246 4.85013 5.20857 4.38504 5.91947 4.19456C6.63037 4.00408 7.38782 4.1038 8.0252 4.47178C8.66257 4.83977 9.12765 5.44588 9.31814 6.15678C9.50862 6.86768 9.4089 7.62513 9.04092 8.2625C8.67293 8.89988 8.06682 9.36496 7.35592 9.55545C6.64502 9.74593 5.88757 9.64621 5.2502 9.27822C4.61282 8.91024 4.14774 8.30412 3.95725 7.59323C3.76677 6.88233 3.86649 6.12488 4.23447 5.4875L4.23447 5.4875Z" stroke="#F2F2F7" stroke-width="2.7"/><path d="M20.248 13.75V12.4H20.2479L20.248 13.75ZM25.2432 17.8994L26.5334 17.5021L26.5334 17.502L25.2432 17.8994ZM24.3662 19V20.35L24.3668 20.35L24.3662 19ZM20.0928 19L18.7693 19.2666L18.9876 20.35H20.0928V19ZM17.3369 14.6826L16.5205 13.6074L14.959 14.7931L16.6237 15.8289L17.3369 14.6826ZM20.248 13.75V15.1C22.5324 15.1 23.5157 16.8772 23.953 18.2968L25.2432 17.8994L26.5334 17.502C26.0223 15.8426 24.4416 12.4 20.248 12.4V13.75ZM25.2432 17.8994L23.9529 18.2967C23.9019 18.131 23.9457 17.9398 24.0514 17.8106C24.1466 17.6941 24.2697 17.65 24.3656 17.65L24.3662 19L24.3668 20.35C25.7233 20.3494 27.021 19.0856 26.5334 17.5021L25.2432 17.8994ZM24.3662 19V17.65H20.0928V19V20.35H24.3662V19ZM20.0928 19L21.4162 18.7335C21.1294 17.3097 20.3311 14.9556 18.0501 13.5364L17.3369 14.6826L16.6237 15.8289C17.974 16.6689 18.5414 18.1349 18.7693 19.2666L20.0928 19ZM17.3369 14.6826L18.1533 15.7578C18.6518 15.3793 19.3151 15.1001 20.2482 15.1L20.248 13.75L20.2479 12.4C18.7148 12.4001 17.4802 12.8788 16.5205 13.6074L17.3369 14.6826Z" fill="#F2F2F7"/><path d="M6.1377 13.75L6.13773 12.4H6.1377V13.75ZM9.31348 14.9834L10.1161 16.0689L11.4008 15.1189L10.2498 14.0108L9.31348 14.9834ZM6.91797 18.75V20.1H7.96032L8.22404 19.0916L6.91797 18.75ZM1.39648 17.6504L0.108981 17.2444L0.108767 17.2451L1.39648 17.6504ZM6.1377 13.75L6.13766 15.1C7.1796 15.1 7.87353 15.4711 8.37719 15.956L9.31348 14.9834L10.2498 14.0108C9.28078 13.078 7.92867 12.4001 6.13773 12.4L6.1377 13.75ZM9.31348 14.9834L8.51083 13.8979C6.74928 15.2005 5.96616 17.0538 5.61189 18.4084L6.91797 18.75L8.22404 19.0916C8.49679 18.0486 9.04394 16.8617 10.1161 16.0689L9.31348 14.9834ZM6.91797 18.75V17.4H2.27051V18.75V20.1H6.91797V18.75ZM2.27051 18.75V17.4C2.36648 17.4 2.49009 17.4439 2.58607 17.5615C2.69294 17.6924 2.7373 17.887 2.6842 18.0557L1.39648 17.6504L0.108767 17.2451C-0.391865 18.8356 0.917539 20.1 2.27051 20.1V18.75ZM1.39648 17.6504L2.68399 18.0564C3.10756 16.7132 4.03179 15.1 6.1377 15.1V13.75V12.4C2.14625 12.4 0.613826 15.6434 0.108981 17.2444L1.39648 17.6504Z" fill="#F2F2F7"/><path d="M13.5127 13.75C18.7429 13.75 19.9942 17.7289 20.2935 19.6327C20.3793 20.1783 19.94 20.625 19.3877 20.625H7.6377C7.08541 20.625 6.64606 20.1783 6.73184 19.6327C7.03122 17.7289 8.28253 13.75 13.5127 13.75Z" stroke="#F2F2F7" stroke-width="2.7" stroke-linecap="round"/></svg>`;

const getTabIconSvg = (routeName: string) => {
  if (routeName === 'Now') return dashboardIconSvg;
  if (routeName === 'Framework') return insightIconSvg;
  if (routeName === 'Goal page') return goalsIconSvg;
  return leaderboardIconSvg;
};

const BRAIN_LOGO_GREEN = '#3CAD74';

const BrainOverlayScreen = ({ navigation }: { navigation: any }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([]);
  const [parsedTasks, setParsedTasks] = useState<
    Array<{
      id: string;
      title: string;
      category: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      notes?: string;
      priority?: 'low' | 'med' | 'high';
      tags?: string[];
      confidence?: number;
      status?: 'draft' | 'ready';
    }>
  >([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Record<string, boolean>>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const committedTranscript = useRef('');
  const editIconUri = Image.resolveAssetSource(require('../../assets/icons/EDIT ICON.svg')).uri;
  const tickIconUri = Image.resolveAssetSource(require('../../assets/icons/TICKICON.svg')).uri;
  const timetableIconUri = Image.resolveAssetSource(require('../../assets/icons/TIMETABLE ICON.svg')).uri;
  const repeatIconUri = Image.resolveAssetSource(require('../../assets/icons/REPEAT ICON.svg')).uri;
  const dashboardIconUri = Image.resolveAssetSource(require('../../assets/icons/dashboard icon.svg')).uri;
  const insightIconUri = Image.resolveAssetSource(require('../../assets/icons/insight icon.svg')).uri;
  const calendarIconUri = Image.resolveAssetSource(require('../../assets/icons/calander icon.svg')).uri;
  const leaderboardIconUri = Image.resolveAssetSource(require('../../assets/icons/Leaderboard icon.svg')).uri;
  const micIconUri = Image.resolveAssetSource(require('../../assets/icons/microphoneicon.svg')).uri;
  const menuIconUri = Image.resolveAssetSource(require('../../assets/icons/menu icon.svg')).uri;
  const ellipsisIconUri = Image.resolveAssetSource(require('../../assets/icons/elipsis icon.svg')).uri;
  const searchIconUri = Image.resolveAssetSource(require('../../assets/icons/search icon.svg')).uri;
  const imagesIconUri = Image.resolveAssetSource(require('../../assets/icons/images icon.svg')).uri;
  const pinFillIconUri = Image.resolveAssetSource(require('../../assets/icons/pin fill icon.svg')).uri;
  const plusIconUri = Image.resolveAssetSource(require('../../assets/icons/plus icon.svg')).uri;
  const audioIconUri = Image.resolveAssetSource(require('../../assets/icons/audio icon.svg')).uri;
  const upArrowIconUri = Image.resolveAssetSource(require('../../assets/icons/up arrow.svg')).uri;
  const cameraIconUri = Image.resolveAssetSource(require('../../assets/icons/camera icon.svg')).uri;
  const attachPhotoIconUri = Image.resolveAssetSource(require('../../assets/icons/attach photo icon.svg')).uri;
  const attachFileIconUri = Image.resolveAssetSource(require('../../assets/icons/attach file icon.svg')).uri;
  const showIntro = !hasSent;
  const showSend = inputText.trim().length > 0;
  const speechRecognition = speechModule?.ExpoSpeechRecognitionModule;
  const addSpeechListener = speechModule?.addSpeechRecognitionListener;
  const keyboardShift = useRef(new Animated.Value(0)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMounted, setSidebarMounted] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'images'>('chats');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [chatSessions, setChatSessions] = useState<Array<{ id: string; title: string; updatedAt: number; isPinned?: boolean; isArchived?: boolean; isTitleManual?: boolean }>>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [attachmentSheetVisible, setAttachmentSheetVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetMounted, setActionSheetMounted] = useState(false);
  const [actionSession, setActionSession] = useState<{ id: string; title: string; isPinned?: boolean } | null>(null);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const actionSheetAnim = useRef(new Animated.Value(0)).current;
  const SIDEBAR_HIDE_OFFSET = 320;
  const sidebarTranslate = useRef(new Animated.Value(-SIDEBAR_HIDE_OFFSET)).current;
  const sidebarBackdropOpacity = useRef(new Animated.Value(0)).current;
  const sidebarDragStart = useRef(-SIDEBAR_HIDE_OFFSET);
  const statusSteps = [
    'Sorting your inputs...',
    'Organising your thoughts...',
    'Structuring your life...',
    'Processing entries...',
    'Building your plan...',
  ];

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

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const toTime = (minutes: number) => {
    const normalized = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60).toString().padStart(2, '0');
    const m = Math.floor(normalized % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const parseTimeRange = (value?: string) => {
    if (!value) return { startTime: undefined, endTime: undefined };
    const raw = value.trim();
    if (!raw) return { startTime: undefined, endTime: undefined };
    const parts = raw.split(/\s*(?:–|-|to)\s*/i).map(part => part.trim()).filter(Boolean);
    const normalize = (part: string) => {
      const lower = part.toLowerCase().replace(/\s+/g, '');
      const match24 = lower.match(/^(\d{1,2}):(\d{2})$/);
      if (match24) {
        const h = Number(match24[1]);
        const m = Number(match24[2]);
        if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) return null;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
      const match12 = lower.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
      if (!match12) return null;
      const hRaw = Number(match12[1]);
      const mRaw = match12[2] ? Number(match12[2]) : 0;
      if (Number.isNaN(hRaw) || Number.isNaN(mRaw) || hRaw < 1 || hRaw > 12 || mRaw > 59) return null;
      const isPm = match12[3] === 'pm';
      const h24 = hRaw % 12 + (isPm ? 12 : 0);
      return `${h24.toString().padStart(2, '0')}:${mRaw.toString().padStart(2, '0')}`;
    };
    const start = normalize(parts[0]);
    if (!start) return { startTime: undefined, endTime: undefined };
    if (parts.length > 1) {
      const end = normalize(parts[1]);
      return { startTime: start, endTime: end ?? undefined };
    }
    return { startTime: start, endTime: undefined };
  };

  const parseDurationFromText = (value: string) => {
    const match = value.match(/(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)/i);
    if (!match) return null;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (Number.isNaN(amount)) return null;
    if (unit.startsWith('h')) return amount * 60;
    return amount;
  };

  const estimateDurationMinutes = (title: string, notes?: string) => {
    const text = `${title} ${notes ?? ''}`.toLowerCase();
    const explicit = parseDurationFromText(text);
    if (explicit) return Math.max(10, Math.min(240, explicit));
    if (/(lecture|class|seminar|lab|tutorial)/.test(text)) return 120;
    if (/(meeting|call|interview|appointment)/.test(text)) return 45;
    if (/(workout|gym|run|training|practice)/.test(text)) return 60;
    if (/(study|revision|assignment|reading)/.test(text)) return 90;
    if (/(meal|cook|lunch|dinner|breakfast|grocery)/.test(text)) return 45;
    if (/(shower|nap|meditate|journal)/.test(text)) return 20;
    return 30;
  };

  const parsePriority = (value?: string) => {
    const next = value?.trim().toLowerCase();
    if (next === 'high') return 'high';
    if (next === 'med' || next === 'medium') return 'med';
    return 'low';
  };

  const getCategory = (value: string) => {
    const next = value.trim().toLowerCase();
    if (next.includes('deadline')) return 'deadline';
    if (next.includes('routine')) return 'routine';
    if (next.includes('goal')) return 'goal';
    if (next.includes('habit')) return 'habit';
    if (next.includes('decision')) return 'decision';
    if (next.includes('commitment')) return 'commitment';
    if (next.includes('constraint')) return 'constraint';
    if (next.includes('state')) return 'state';
    if (next.includes('achievement')) return 'achievement';
    if (next.includes('task')) return 'task';
    return 'task';
  };

  const normalizeTitle = (value: string) => {
    let text = value.trim().replace(/\s+/g, ' ');
    if (!text) return '';
    text = text.replace(/\bincoporate\b/gi, 'incorporate');
    text = text.replace(/\bcalory\b/gi, 'calorie');
    text = text.replace(/\bskincare\b/gi, 'skincare');
    text = text.replace(/\bskin care\b/gi, 'skincare');
    text = text.replace(/\bthrusday\b/gi, 'thursday');
    text = text.replace(/\bwirh\b/gi, 'with');
    text = text.replace(/\bfrnd\b/gi, 'friend');
    text = text.replace(/\bexm\b/gi, 'exam');
    text = text.replace(/\bwrk\b/gi, 'work');
    text = text.replace(/^(i|im)\s+(want|wanna|need|have|should|got)\s+to\s+/i, '');
    text = text.replace(/^(please|kindly)\s+/i, '');
    text = text.replace(/\b(please|just|really|actually|basically|kind of|sort of)\b/gi, '');
    text = text.replace(/\s+/g, ' ').trim();
    const words = text.split(' ');
    if (words.length > 8) {
      text = words.slice(0, 8).join(' ');
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const inferCategoryFromTitle = (title: string, baseCategory: string) => {
    const text = title.toLowerCase();
    if (/(completed|achieved|scored|finished|won|hit\s+\d+)/.test(text)) return 'achievement';
    if (/(feeling|burned out|burnt out|tired|anxious|stressed|overwhelmed|low energy|sleep deprived|exhausted|down|depressed|panic|anxiety)/.test(text)) {
      return 'state';
    }
    if (/(should i|choose|decide|pick between|which one|option)/.test(text)) return 'decision';
    if (/(work shift|budget|limit|limited|no internet|travel days|traveling|availability|time limit|money limit|cap|restriction)/.test(text)) {
      return 'constraint';
    }
    if (/(with friend|with friends|tutor|tutoring|volunteer|date night|meet|session with|team|client|student)/.test(text)) {
      return 'commitment';
    }
    if (/(deadline|due|submit|submission|expires|by\s+\d{1,2}\/\d{1,2}|by\s+\d{1,2}(am|pm)|by\s+[a-z]+|before\s+\d{1,2}(am|pm)|by end)/.test(text)) {
      return 'deadline';
    }
    const hasRecurring = /(daily|every day|each day|weekly|every week|monthly|every month|weekday|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday|nightly|morning|evening|after\s+\d{1,2}(am|pm)|before\s+\d{1,2}(am|pm))/;
    if (
      /(no phone|avoid|stop|quit|cut out|reduce|limit|journal|meditate|track calories|track macros|drink|hydrate|sleep by|bed by|wake up|wake at|stretch|walk|read|practice|cold shower)/.test(text) &&
      hasRecurring.test(text)
    ) {
      return 'habit';
    }
    if (
      /(routine|session|run|grocery|shopping|skincare|meal prep|planning|study session|cleaning|laundry|review|revision)/.test(text) &&
      hasRecurring.test(text)
    ) {
      return 'routine';
    }
    if (/(improve|increase|reduce|lose|gain|reach|hit|save|secure|get|build|master|learn|achieve|earn|grow|clarity|quality|strength|endurance|stamina|body fat|bench|internship)/.test(text)) {
      return 'goal';
    }
    return baseCategory;
  };

  const getCategoryColor = (category: string) => {
    if (category === 'deadline') return COLORS.deadline;
    if (category === 'routine') return COLORS.routines;
    if (category === 'goal') return COLORS.goals;
    if (category === 'habit') return COLORS.habit;
    if (category === 'decision') return COLORS.decisions;
    if (category === 'commitment') return COLORS.commitments;
    if (category === 'constraint') return COLORS.constraints;
    if (category === 'state') return COLORS.states;
    if (category === 'achievement') return COLORS.achievements;
    return COLORS.tasks;
  };

  const getCategoryLabel = (category: string) => {
    if (category === 'deadline') return 'DEADLINE';
    if (category === 'routine') return 'ROUTINE';
    if (category === 'goal') return 'GOAL';
    if (category === 'habit') return 'HABIT';
    if (category === 'decision') return 'DECISION';
    if (category === 'commitment') return 'COMMITMENT';
    if (category === 'constraint') return 'CONSTRAINT';
    if (category === 'state') return 'STATE';
    if (category === 'achievement') return 'ACHIEVEMENT';
    return 'TASK';
  };

  const formatGoalTarget = (date?: string, time?: string) => {
    if (!date) return '';
    const parsed = parseISO(date);
    const dateLabel = Number.isNaN(parsed.getTime()) ? date : format(parsed, 'do MMM yyyy');
    if (time) return `Target: ${dateLabel} at ${time}`;
    return `Target: ${dateLabel}`;
  };

  const getSubtitle = (task: { date?: string; startTime?: string; endTime?: string; category: string }) => {
    if (task.category === 'goal') {
      return formatGoalTarget(task.date, task.startTime) || 'Target: No date set';
    }
    if (task.category === 'deadline' && task.date) {
      return `Due: ${task.date}`;
    }
    if (task.startTime && task.endTime) {
      return `${task.startTime} – ${task.endTime}`;
    }
    if (task.date) {
      return `On: ${task.date}`;
    }
    return 'No time set';
  };

  const getSessionTitle = (list: Array<{ role: 'user' | 'assistant'; text: string }>) => {
    const firstUser = list.find(item => item.role === 'user')?.text;
    const base = (firstUser || list[0]?.text || 'New chat').trim();
    return base.length > 42 ? `${base.slice(0, 42).trim()}…` : base;
  };

  const ensureSessionId = async () => {
    if (currentSessionId) return currentSessionId;
    const nextId = `session-${Date.now()}`;
    setCurrentSessionId(nextId);
    await StorageService.saveActiveChatSessionId(nextId);
    return nextId;
  };

  const orderSessions = (
    sessions: Array<{ id: string; title: string; updatedAt: number; isPinned?: boolean; isArchived?: boolean; isTitleManual?: boolean }>
  ) =>
    [...sessions].sort((a, b) => {
      const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
      if (pinDiff !== 0) return pinDiff;
      return b.updatedAt - a.updatedAt;
    });

  const startFreshSession = async () => {
    const nextId = `session-${Date.now()}`;
    setCurrentSessionId(nextId);
    await StorageService.saveActiveChatSessionId(nextId);
    setMessages([]);
    setParsedTasks([]);
    setSelectedTaskIds({});
    setEditingTaskId(null);
    setHasSent(false);
  };

  const commitSessions = async (
    sessions: Array<{ id: string; title: string; updatedAt: number; isPinned?: boolean; isArchived?: boolean; isTitleManual?: boolean }>
  ) => {
    setChatSessions(sessions);
    await StorageService.saveChatSessions(sessions);
  };

  const upsertSession = async (
    sessionId: string,
    updater: (session: { id: string; title: string; updatedAt: number; isPinned?: boolean; isArchived?: boolean; isTitleManual?: boolean }) => {
      id: string;
      title: string;
      updatedAt: number;
      isPinned?: boolean;
      isArchived?: boolean;
      isTitleManual?: boolean;
    }
  ) => {
    const existing = chatSessions.find(session => session.id === sessionId);
    const baseTitle =
      existing?.title ??
      (sessionId === currentSessionId && messages.length > 0 ? getSessionTitle(messages) : 'New chat');
    const base = existing ?? { id: sessionId, title: baseTitle, updatedAt: Date.now() };
    const nextSession = updater(base);
    const nextSessions = orderSessions([nextSession, ...chatSessions.filter(session => session.id !== sessionId)]);
    await commitSessions(nextSessions);
  };

  const persistCurrentSession = async (nextMessages: Array<{ id: string; role: 'user' | 'assistant'; text: string }>) => {
    const sessionId = await ensureSessionId();
    await StorageService.saveActiveChatSessionId(sessionId);
    const existing = chatSessions.find(session => session.id === sessionId);
    const title = existing?.isTitleManual ? existing.title : getSessionTitle(nextMessages);
    const nextSession = { ...existing, id: sessionId, title, updatedAt: Date.now() };
    const nextSessions = orderSessions([nextSession, ...chatSessions.filter(session => session.id !== sessionId)]);
    setChatSessions(nextSessions);
    await StorageService.saveChatSessions(nextSessions);
    await StorageService.saveChatSessionMessages(sessionId, nextMessages);
  };

  const getEmoji = (title: string, category: string) => {
    const text = title.toLowerCase();
    if (/(deadline|due|submit|submission)/.test(text)) return '⏰';
    if (/(exam|study|revision|homework|assignment|test)/.test(text)) return '📚';
    if (/(sleep|nap|rest|bed)/.test(text)) return '😴';
    if (/(phone|screen|no phone|social media)/.test(text)) return '📵';
    if (/(calories|macro|nutrition|diet|cut|bulk)/.test(text)) return '📊';
    if (/(bench|press|strength|lift|deadlift|squat)/.test(text)) return '🏋️';
    if (/(calisthenics|push[-\s]?up|pull[-\s]?up|dip)/.test(text)) return '🤸';
    if (/(workout|gym|run|jog|yoga|exercise|fitness)/.test(text)) return '🏋️';
    if (/(meal|cook|lunch|dinner|breakfast|grocery|food|snack)/.test(text)) return '🥗';
    if (/(meeting|call|zoom|interview)/.test(text)) return '📞';
    if (/(internship|job|application|apply|resume|cv)/.test(text)) return '💼';
    if (/(tutor|tutoring|mentor|student)/.test(text)) return '🧑‍🏫';
    if (/(date night|relationship|partner|family|friend)/.test(text)) return '❤️';
    if (/(plan|planning|schedule|organise|organize)/.test(text)) return '🗓️';
    if (/(email|inbox|reply|message)/.test(text)) return '✉️';
    if (/(pay|bill|invoice|rent|bank|tax)/.test(text)) return '💸';
    if (/(clean|laundry|tidy|vacuum|dishes)/.test(text)) return '🧽';
    if (/(meditate|journal|plan|reflect)/.test(text)) return '🧘';
    if (/(skincare|shower|bath|hair|spa)/.test(text)) return '🧴';
    if (/(travel|commute|drive|flight)/.test(text)) return '✈️';
    if (/(doctor|dentist|appointment|health)/.test(text)) return '🩺';
    if (category === 'deadline') return '⏰';
    if (category === 'routine') return '🔁';
    if (category === 'goal') return '🎯';
    if (category === 'habit') return '💪';
    if (category === 'decision') return '🧠';
    if (category === 'commitment') return '🤝';
    if (category === 'constraint') return '⛔';
    if (category === 'state') return '😟';
    if (category === 'achievement') return '🏆';
    return '📌';
  };

  const getBadgeTextColor = (category: string) => {
    if (category === 'task' || category === 'goal' || category === 'constraint') {
      return '#0B0B0B';
    }
    return '#FFFFFF';
  };

  const getTimeIconUri = (task: { title: string; category: string }) => {
    const text = task.title.toLowerCase();
    const isRepeat =
      task.category === 'routine' ||
      task.category === 'habit' ||
      /(daily|weekly|monthly|repeat|every|weekday)/.test(text);
    return isRepeat ? repeatIconUri : timetableIconUri;
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleIntegrate = async () => {
    const selected = parsedTasks.filter(task => selectedTaskIds[task.id]);
    if (selected.length === 0) return;
    const schedule = await StorageService.getSchedule();
    const nextBlocks: TimeBlock[] = selected.map((task, index) => {
      const startMinutes = task.startTime ? toMinutes(task.startTime) : null;
      const estimatedDuration = estimateDurationMinutes(task.title, task.notes);
      const startTime = task.startTime ?? '00:00';
      const endTime =
        task.endTime ??
        toTime((startMinutes ?? 0) + estimatedDuration);
      const isLater = !task.startTime;
      const type =
        task.category === 'routine'
          ? 'routine'
          : task.category === 'task' ||
              task.category === 'deadline' ||
              task.category === 'goal' ||
              task.category === 'commitment' ||
              task.category === 'decision'
            ? 'work'
            : 'other';
      return {
        id: `${Date.now()}-sel-${index}`,
        title: task.title,
        startTime,
        endTime,
        type,
        date: task.date,
        isCompleted: false,
        notes: task.notes,
        priority: task.priority,
        tags: task.tags,
        confidence: task.confidence,
        status: task.status,
        goalPriority: task.priority === 'high' ? 'high' : task.priority === 'med' ? 'medium' : 'low',
        source: 'app',
        isLater,
      };
    });
    await StorageService.saveSchedule([...schedule, ...nextBlocks]);
    setSelectedTaskIds(prev =>
      nextBlocks.reduce(
        (acc, block) => {
          const match = selected.find(task => task.title === block.title && task.date === block.date);
          if (match) acc[match.id] = false;
          return acc;
        },
        { ...prev }
      )
    );
    setEditingTaskId(null);
    setMessages(prev => [
      ...prev,
      { id: `${Date.now()}-assistant`, role: 'assistant', text: `Added ${nextBlocks.length} tasks.` },
    ]);
    setTimeout(() => {
      navigation.goBack();
      navigation.navigate('Main', { screen: 'Now' });
    }, 500);
  };

  const combineTranscript = (base: string, addition: string) => {
    if (!base.trim()) return addition;
    if (!addition.trim()) return base;
    if (base.endsWith(' ') || addition.startsWith(' ')) return `${base}${addition}`;
    return `${base} ${addition}`;
  };

  const startRecording = async () => {
    if (isRecording) return;
    if (!speechRecognition) {
      Alert.alert('Speech recognition', 'This feature requires a development build with speech recognition enabled.');
      return;
    }
    const permission = await speechRecognition.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone access', 'Allow microphone access to use transcription.');
      return;
    }
    committedTranscript.current = inputText;
    setHasRecording(true);
    setIsRecording(true);
    speechRecognition.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
    });
  };

  const stopRecording = () => {
    if (!isRecording) return;
    if (speechRecognition?.stop) {
      speechRecognition.stop();
      setIsRecording(false);
      return;
    }
    setIsRecording(false);
  };

  const closeAndNavigate = async (tab: 'Now' | 'Framework' | 'Goal page' | 'Community') => {
    stopRecording();
    if (messages.length > 0) {
      await persistCurrentSession(messages);
    } else if (currentSessionId) {
      await StorageService.saveActiveChatSessionId(currentSessionId);
    }
    navigation.goBack();
    setTimeout(() => {
      navigation.navigate('Main', { screen: tab });
    }, 0);
  };

  const runParse = async (
    text: string,
    userDisplayText: string,
    attachments?: Array<{
      type: 'image' | 'text' | 'file';
      name?: string;
      mime?: string;
      content?: string;
      data?: string;
    }>
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isParsing) return;
    Keyboard.dismiss();
    setIsParsing(true);
    setHasSent(true);
    const baseId = Date.now();
    const userId = `${baseId}-user`;
    const assistantId = `${baseId}-assistant`;
    const nextMessages: Array<{ id: string; role: 'user' | 'assistant'; text: string }> = [
      ...messages,
      { id: userId, role: 'user', text: userDisplayText },
      { id: assistantId, role: 'assistant', text: statusSteps[0] },
    ];
    setMessages(nextMessages);
    persistCurrentSession(nextMessages);
    setEditingTaskId(null);
    setInputText('');
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    statusTimerRef.current = setInterval(() => {
      setMessages(prev => {
        const currentMessage = prev.find(message => message.id === assistantId);
        const currentText = currentMessage?.text ?? statusSteps[0];
        const index = statusSteps.indexOf(currentText);
        const nextIndex = index >= 0 ? Math.min(index + 1, statusSteps.length - 1) : 0;
        return prev.map(message =>
          message.id === assistantId ? { ...message, text: statusSteps[nextIndex] } : message
        );
      });
    }, 1200);
    const timezone = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone ?? 'UTC';
    const today = format(new Date(), 'yyyy-MM-dd');
    const history = messages.map(message => ({ role: message.role, text: message.text })).slice(-12);
    const { data, error } = await supabase.functions.invoke('parse-tasks', {
      body: { text: trimmed, timezone, today, history, attachments },
    });
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    const errorMessage = error?.message || data?.error || 'Could not generate tasks. Try again.';
    const errorStatus = (error as any)?.status;
    const isAuthError = errorStatus === 401 || errorStatus === 403 || /jwt/i.test(errorMessage);
    if (error || !data?.tasks || !Array.isArray(data.tasks)) {
      const message = isAuthError
        ? 'Function auth failed. Redeploy with --no-verify-jwt.'
        : errorMessage;
      setMessages(prev =>
        prev.map(item => (item.id === assistantId ? { ...item, text: message } : item))
      );
      setIsParsing(false);
      return;
    }
    const assistantReply = typeof data?.reply === 'string' ? data.reply.trim() : '';
    const parsed = data.tasks
      .map((item: any, index: number) => {
        const rawTitle = typeof item?.title === 'string' ? item.title.trim() : '';
        const rawNotes = typeof item?.notes === 'string' ? item.notes.trim() : '';
        const title = normalizeTitle(rawTitle || rawNotes);
        if (!title) return null;
        const notes = rawNotes && rawNotes !== title ? rawNotes : '';
        const date = typeof item?.due === 'string' && item.due.trim() ? item.due.trim() : today;
        const timeValue = typeof item?.time === 'string' ? item.time.trim() : '';
        const { startTime, endTime: parsedEnd } = parseTimeRange(timeValue);
        const startMinutes = startTime ? toMinutes(startTime) : null;
        const estimatedDuration = estimateDurationMinutes(title, notes);
        const endTime = parsedEnd
          ? parsedEnd
          : startMinutes === null
            ? undefined
            : toTime(startMinutes + estimatedDuration);
        const priority = parsePriority(typeof item?.priority === 'string' ? item.priority : undefined);
        const tags = Array.isArray(item?.tags)
          ? item.tags.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0).map((tag: string) => tag.trim())
          : undefined;
        const confidenceRaw = typeof item?.confidence === 'number' ? item.confidence : undefined;
        const confidence =
          typeof confidenceRaw === 'number' ? Math.max(0, Math.min(1, confidenceRaw)) : undefined;
        const status = item?.status === 'draft' ? 'draft' : 'ready';
        const category = getCategory(
          typeof item?.category === 'string' ? item.category : typeof item?.type === 'string' ? item.type : 'task'
        );
        const inferredCategory = inferCategoryFromTitle(title, category);
        return {
          id: `${Date.now()}-${index}`,
          title,
          date,
          startTime: startTime ?? undefined,
          endTime: endTime ?? undefined,
          category: inferredCategory,
          notes,
          priority,
          tags,
          confidence,
          status,
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        title: string;
        category: string;
        date?: string;
        startTime?: string;
        endTime?: string;
        notes?: string;
        priority?: 'low' | 'med' | 'high';
        tags?: string[];
        confidence?: number;
        status?: 'draft' | 'ready';
      }>;
    if (parsed.length === 0) {
      setMessages(prev => {
        const updated = prev.map(item =>
          item.id === assistantId
            ? { ...item, text: assistantReply || 'I want to make sure I get this right. Want to add a bit more detail?' }
            : item
        );
        persistCurrentSession(updated);
        return updated;
      });
      setIsParsing(false);
      return;
    }
    const buildLooseKey = (task: { title: string; category?: string }) =>
      `${normalizeTitle(task.title).toLowerCase()}|${task.category ?? ''}`;
    const buildGoalKey = (task: { title: string; category?: string }) => {
      if (task.category !== 'goal') return '';
      let text = normalizeTitle(task.title).toLowerCase();
      text = text.replace(/\d+(\.\d+)?/g, '');
      text = text.replace(/\b(kg|kgs|kilogram|kilograms|lb|lbs|pound|pounds|cm|mm|m|km|mile|miles)\b/g, '');
      text = text.replace(/[^a-z\s]/g, ' ');
      text = text.replace(/\s+/g, ' ').trim();
      return text ? `goal|${text}` : '';
    };
    const mergeTask = (current: typeof parsed[number], incoming: typeof parsed[number]) => ({
      ...current,
      title: incoming.title || current.title,
      category: incoming.category || current.category,
      date: incoming.date || current.date,
      startTime: incoming.startTime ?? current.startTime,
      endTime: incoming.endTime ?? current.endTime,
      notes: incoming.notes || current.notes,
      priority: incoming.priority || current.priority,
      tags: incoming.tags ?? current.tags,
      confidence: incoming.confidence ?? current.confidence,
      status: incoming.status || current.status,
    });
    const mergeResult = (() => {
      const next = [...parsedTasks];
      const indexByLoose = new Map<string, number>();
      const indexByGoal = new Map<string, number>();
      parsedTasks.forEach((task, idx) => {
        const looseKey = buildLooseKey(task);
        indexByLoose.set(looseKey, idx);
        const goalKey = buildGoalKey(task);
        if (goalKey) indexByGoal.set(goalKey, idx);
      });
      const seenKey = new Set<string>();
      const selected: Record<string, boolean> = {};
      let addedCount = 0;
      let updatedCount = 0;
      parsed.forEach(task => {
        const looseKey = buildLooseKey(task);
        const goalKey = buildGoalKey(task);
        const dedupeKey = goalKey || looseKey;
        if (seenKey.has(dedupeKey)) return;
        seenKey.add(dedupeKey);
        let existingIndex = goalKey ? indexByGoal.get(goalKey) : undefined;
        if (existingIndex === undefined) {
          existingIndex = indexByLoose.get(looseKey);
        }
        if (existingIndex !== undefined) {
          const updated = mergeTask(next[existingIndex], task);
          next[existingIndex] = updated;
          selected[updated.id] = true;
          updatedCount += 1;
        } else {
          next.push(task);
          selected[task.id] = true;
          addedCount += 1;
        }
      });
      return { next, selected, addedCount, updatedCount };
    })();
    if (mergeResult.addedCount === 0 && mergeResult.updatedCount === 0) {
      setMessages(prev => {
        const updated = prev.map(item =>
          item.id === assistantId ? { ...item, text: assistantReply || 'Got it. That’s already on your list.' } : item
        );
        persistCurrentSession(updated);
        return updated;
      });
      setIsParsing(false);
      return;
    }
    setParsedTasks(mergeResult.next);
    setSelectedTaskIds(prev => ({ ...prev, ...mergeResult.selected }));
    const missingTimeCount = mergeResult.next.filter(task => !task.startTime).length;
    const timePrompt =
      missingTimeCount > 0
        ? ` Add a time for ${missingTimeCount} task${missingTimeCount > 1 ? 's' : ''} or they will go to Later.`
        : '';
    setMessages(prev => {
      const updated = prev.map(item =>
        item.id === assistantId
          ? { ...item, text: `${assistantReply || 'Got it. I pulled out the key tasks below.'}${timePrompt}` }
          : item
      );
      persistCurrentSession(updated);
      return updated;
    });
    setIsParsing(false);
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    await runParse(trimmed, trimmed);
  };

  const analyzeAttachment = async (
    label: string,
    attachments: Array<{
      type: 'image' | 'text' | 'file';
      name?: string;
      mime?: string;
      content?: string;
      data?: string;
    }>
  ) => {
    setAttachmentSheetVisible(false);
    await runParse(
      'Analyze the attachment and extract any dates, goals, tasks, constraints, achievements, states, habits, routines, decisions, commitments, and follow-up questions.',
      `Attachment: ${label}`,
      attachments
    );
  };

  const handlePickCamera = async () => {
    setAttachmentSheetVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Could not read photo');
      return;
    }
    await analyzeAttachment('Camera', [
      {
        type: 'image',
        name: asset.fileName ?? 'camera.jpg',
        mime: asset.mimeType ?? 'image/jpeg',
        data: asset.base64,
      },
    ]);
  };

  const handlePickPhoto = async () => {
    setAttachmentSheetVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Could not read photo');
      return;
    }
    await analyzeAttachment('Photos', [
      {
        type: 'image',
        name: asset.fileName ?? 'photo.jpg',
        mime: asset.mimeType ?? 'image/jpeg',
        data: asset.base64,
      },
    ]);
  };

  const handlePickFile = async () => {
    setAttachmentSheetVisible(false);
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    const size = (fileInfo as any)?.size && typeof (fileInfo as any).size === 'number' ? (fileInfo as any).size : 0;
    if (size > 2 * 1024 * 1024) {
      Alert.alert('File too large', 'Please choose a smaller file.');
      return;
    }
    const mime = asset.mimeType ?? 'application/octet-stream';
    if (mime.startsWith('image/')) {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      await analyzeAttachment('Files', [
        { type: 'image', name: asset.name, mime, data: base64 },
      ]);
      return;
    }
    const isText =
      mime.startsWith('text/') ||
      /json|xml|csv|markdown|yaml|yml|plain/i.test(mime) ||
      /\.(txt|md|csv|json|xml|yml|yaml)$/i.test(asset.name ?? '');
    if (isText) {
      const content = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      await analyzeAttachment('Files', [
        { type: 'text', name: asset.name, mime, content },
      ]);
      return;
    }
    const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
    await analyzeAttachment('Files', [
      { type: 'file', name: asset.name, mime, content: base64 },
    ]);
  };

  const handleSaveChatHistory = async () => {
    if (messages.length === 0) {
      Alert.alert('No chat history yet.');
      return;
    }
    await persistCurrentSession(messages);
    Alert.alert('Chat history saved.');
  };

  const openSidebar = () => {
    const open = () => {
      setSidebarMounted(true);
      setSidebarOpen(true);
      Animated.parallel([
        Animated.timing(sidebarTranslate, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sidebarBackdropOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    };
    if (keyboardVisible) {
      Keyboard.dismiss();
      setTimeout(open, 160);
      return;
    }
    open();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarTranslate, {
        toValue: -SIDEBAR_HIDE_OFFSET,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sidebarBackdropOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSidebarOpen(false);
      setSidebarMounted(false);
    });
  };

  const syncSidebarDrag = (value: number) => {
    const clamped = Math.min(0, Math.max(-SIDEBAR_HIDE_OFFSET, value));
    sidebarTranslate.setValue(clamped);
    const progress = 1 - Math.abs(clamped) / SIDEBAR_HIDE_OFFSET;
    sidebarBackdropOpacity.setValue(Math.max(0, Math.min(1, progress)));
  };

  const sidebarPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => sidebarOpen && Math.abs(gesture.dx) > 8 && Math.abs(gesture.dy) < 18,
        onPanResponderGrant: () => {
          sidebarTranslate.stopAnimation(value => {
            sidebarDragStart.current = value;
          });
          sidebarBackdropOpacity.stopAnimation();
        },
        onPanResponderMove: (_, gesture) => {
          syncSidebarDrag(sidebarDragStart.current + gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          const projected = sidebarDragStart.current + gesture.dx;
          const shouldClose = projected < -SIDEBAR_HIDE_OFFSET / 2 || gesture.vx < -0.4;
          if (shouldClose) {
            closeSidebar();
            return;
          }
          openSidebar();
        },
        onPanResponderTerminate: () => {
          openSidebar();
        },
      }),
    [sidebarOpen, openSidebar, closeSidebar, SIDEBAR_HIDE_OFFSET]
  );
  const openSidebarPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => !sidebarOpen && gesture.dx > 10 && Math.abs(gesture.dy) < 18,
        onPanResponderGrant: () => {
          setSidebarMounted(true);
          setSidebarOpen(true);
          sidebarTranslate.stopAnimation(value => {
            sidebarDragStart.current = value;
          });
          sidebarBackdropOpacity.stopAnimation();
        },
        onPanResponderMove: (_, gesture) => {
          syncSidebarDrag(sidebarDragStart.current + gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          const projected = sidebarDragStart.current + gesture.dx;
          const shouldOpen = projected > -SIDEBAR_HIDE_OFFSET / 2 || gesture.vx > 0.4;
          if (shouldOpen) {
            openSidebar();
            return;
          }
          closeSidebar();
        },
        onPanResponderTerminate: () => {
          closeSidebar();
        },
      }),
    [sidebarOpen, openSidebar, closeSidebar, SIDEBAR_HIDE_OFFSET]
  );

  const handleSelectSession = async (sessionId: string) => {
    const sessionMessages = await StorageService.getChatSessionMessages(sessionId);
    setCurrentSessionId(sessionId);
    await StorageService.saveActiveChatSessionId(sessionId);
    setMessages(sessionMessages);
    setParsedTasks([]);
    setSelectedTaskIds({});
    setEditingTaskId(null);
    setHasSent(sessionMessages.length > 0);
    setSidebarTab('chats');
    closeSidebar();
  };

  const handleShareSession = async (sessionId: string) => {
    const sessionMessages =
      sessionId === currentSessionId ? messages : await StorageService.getChatSessionMessages(sessionId);
    if (sessionMessages.length === 0) {
      Alert.alert('No chat history yet.');
      return;
    }
    const sessionTitle = chatSessions.find(session => session.id === sessionId)?.title ?? getSessionTitle(sessionMessages);
    const shareBody = [sessionTitle, '', ...sessionMessages.map(message => {
      const label = message.role === 'user' ? 'You' : 'Now AI';
      return `${label}: ${message.text}`;
    })].join('\n');
    await Share.share({ message: shareBody });
  };

  const handleRenameSessionSave = async () => {
    if (!renameSessionId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      Alert.alert('Enter a name.');
      return;
    }
    await upsertSession(renameSessionId, session => ({
      ...session,
      title: trimmed,
      isTitleManual: true,
      isArchived: false,
      updatedAt: Date.now(),
    }));
    setRenameVisible(false);
    setRenameSessionId(null);
    setRenameValue('');
  };

  const handleTogglePinSession = async (sessionId: string, nextPinned: boolean) => {
    await upsertSession(sessionId, session => ({
      ...session,
      isPinned: nextPinned,
      isArchived: false,
      updatedAt: Date.now(),
    }));
  };

  const handleArchiveSession = async (sessionId: string) => {
    await upsertSession(sessionId, session => ({
      ...session,
      isArchived: true,
      isPinned: false,
      updatedAt: Date.now(),
    }));
    if (sessionId === currentSessionId) {
      await startFreshSession();
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const nextSessions = chatSessions.filter(session => session.id !== sessionId);
    await commitSessions(nextSessions);
    await StorageService.deleteChatSessionMessages(sessionId);
    if (sessionId === currentSessionId) {
      await startFreshSession();
    }
  };

  const closeActionSheet = () => {
    setActionSheetVisible(false);
    setActionSession(null);
  };

  const handleSessionLongPress = (session: { id: string; title: string; isPinned?: boolean }) => {
    setActionSession(session);
    setActionSheetVisible(true);
  };

  const handleNewChat = async () => {
    if (messages.length > 0) {
      await persistCurrentSession(messages);
    }
    const nextId = `session-${Date.now()}`;
    setCurrentSessionId(nextId);
    await StorageService.saveActiveChatSessionId(nextId);
    setMessages([]);
    setParsedTasks([]);
    setSelectedTaskIds({});
    setEditingTaskId(null);
    setHasSent(false);
    setSidebarTab('chats');
    closeSidebar();
  };

  useEffect(() => {
    return () => {
      speechRecognition?.stop?.();
      if (statusTimerRef.current) {
        clearInterval(statusTimerRef.current);
        statusTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!speechRecognition || !addSpeechListener) return;
    const startSub = addSpeechListener('start', () => setIsRecording(true));
    const endSub = addSpeechListener('end', () => setIsRecording(false));
    const resultSub = addSpeechListener('result', (event: any) => {
      const nextTranscript = event.results?.[0]?.transcript ?? '';
      if (event.isFinal) {
        committedTranscript.current = combineTranscript(committedTranscript.current, nextTranscript);
        setInputText(committedTranscript.current);
      } else {
        setInputText(combineTranscript(committedTranscript.current, nextTranscript));
      }
      if (nextTranscript.trim().length > 0) {
        setHasRecording(true);
      }
    });
    const errorSub = addSpeechListener('error', () => {
      setIsRecording(false);
    });
    return () => {
      startSub?.remove?.();
      endSub?.remove?.();
      resultSub?.remove?.();
      errorSub?.remove?.();
    };
  }, [addSpeechListener, speechRecognition]);

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      const sessions = await StorageService.getChatSessions();
      if (!active) return;
      let orderedSessions = orderSessions([...sessions]);
      if (sessions.length === 0) {
        const legacyHistory = await StorageService.getChatHistory();
        if (!active) return;
        if (legacyHistory.length > 0) {
          const legacyId = `session-${Date.now()}`;
          const title = getSessionTitle(legacyHistory);
          const nextSessions = [{ id: legacyId, title, updatedAt: Date.now() }];
          orderedSessions = orderSessions(nextSessions);
          await StorageService.saveChatSessions(nextSessions);
          await StorageService.saveChatSessionMessages(legacyId, legacyHistory);
        }
      }
      if (!active) return;
      setChatSessions(orderedSessions);
      await startFreshSession();
    };
    loadHistory();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, event => {
      const keyboardHeight = event?.endCoordinates?.height ?? 0;
      setKeyboardVisible(true);
      Animated.timing(keyboardShift, {
        toValue: -Math.max(0, keyboardHeight - 110) - 16,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      Animated.timing(keyboardShift, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardShift]);

  const currentSession = currentSessionId ? chatSessions.find(session => session.id === currentSessionId) : null;
  const currentTitle = currentSession?.isTitleManual
    ? currentSession.title
    : messages.length > 0
      ? getSessionTitle(messages)
      : currentSession?.title ?? 'New chat';
  const baseSessions = orderSessions(chatSessions.filter(session => !session.isArchived));
  const visibleSessions = baseSessions.map(session =>
    session.id === currentSessionId
      ? {
          ...session,
          title: currentTitle,
        }
      : session
  );

  return (
    <View style={styles.brainOverlayRoot} {...openSidebarPanResponder.panHandlers}>
      <BlurView intensity={Platform.OS === 'ios' ? 65 : 35} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={styles.brainOverlayTint} />
      <View style={styles.brainOverlayTopBar}>
        {!sidebarOpen ? (
          <View style={styles.brainOverlayTopLeftGroup}>
            <TouchableOpacity style={styles.brainOverlayTopIconPlain} activeOpacity={0.85} onPress={openSidebar}>
              <SvgUri uri={menuIconUri} width={20} height={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.brainOverlayTopTitleWrap} activeOpacity={0.85} onPress={openSidebar}>
              <Text style={styles.brainOverlayTopTitle}>Now AI</Text>
              <Text style={styles.brainOverlayTopChevron}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.brainOverlayTopRight}>
          <TouchableOpacity style={styles.brainOverlayTopIconPlain} activeOpacity={0.85} onPress={handleNewChat}>
            <SvgUri uri={editIconUri} width={18} height={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.brainOverlayTopIconPlain}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert('Chat options', '', [
                { text: 'Save chat history', onPress: handleSaveChatHistory },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          >
            <SvgUri uri={ellipsisIconUri} width={18} height={18} />
          </TouchableOpacity>
        </View>
      </View>
      {sidebarMounted ? (
        <Animated.View style={[styles.sidebarBackdrop, { opacity: sidebarBackdropOpacity }]}>
          <TouchableOpacity style={styles.sidebarBackdropTouch} activeOpacity={1} onPress={closeSidebar} />
        </Animated.View>
      ) : null}
      {sidebarMounted ? (
        <Animated.View
          style={[styles.sidebarPanel, { transform: [{ translateX: sidebarTranslate }] }]}
          {...sidebarPanResponder.panHandlers}
        >
        <View style={styles.sidebarHeaderRow}>
          <View style={styles.sidebarSearchWrap}>
            <SvgUri uri={searchIconUri} width={18} height={18} />
            <TextInput
              style={styles.sidebarSearchInput}
              placeholder="Search"
              placeholderTextColor="#7A7A7D"
              value={sidebarSearch}
              onChangeText={setSidebarSearch}
            />
          </View>
          <TouchableOpacity style={styles.sidebarNewChatIcon} activeOpacity={0.85} onPress={handleNewChat}>
            <SvgUri uri={editIconUri} width={18} height={18} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.sidebarTabRow, sidebarTab === 'images' ? styles.sidebarTabRowActive : null]}
          activeOpacity={0.85}
          onPress={() => setSidebarTab(prev => (prev === 'images' ? 'chats' : 'images'))}
        >
          <SvgUri uri={imagesIconUri} width={20} height={20} />
          <Text style={styles.sidebarTabText}>Images</Text>
        </TouchableOpacity>
        {sidebarTab === 'chats' ? (
          <ScrollView style={styles.sidebarList} showsVerticalScrollIndicator={false}>
            {visibleSessions
              .filter(session => session.title.toLowerCase().includes(sidebarSearch.trim().toLowerCase()))
              .map(session => (
                <LongPressScale
                  key={session.id}
                  style={[
                    styles.sidebarListItem,
                    session.id === currentSessionId ? styles.sidebarListItemActive : null,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => (session.id === currentSessionId ? closeSidebar() : handleSelectSession(session.id))}
                  onLongPress={() => handleSessionLongPress(session)}
                >
                  <View style={styles.sidebarListItemRow}>
                    <Text style={styles.sidebarListItemText}>{session.title}</Text>
                    {session.isPinned ? (
                      <SvgUri uri={pinFillIconUri} width={14} height={14} />
                    ) : null}
                  </View>
                </LongPressScale>
              ))}
          </ScrollView>
        ) : (
          <View style={styles.sidebarImagesWrap}>
            <Text style={styles.sidebarImagesText}>No images yet</Text>
          </View>
        )}
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.brainOverlayContent, { transform: [{ translateY: keyboardShift }] }]}>
        {showIntro ? (
          <View style={styles.brainOverlayIntro}>
            <MaterialCommunityIcons name="brain" size={54} color={BRAIN_LOGO_GREEN} />
            <Text style={styles.brainOverlayTitle}>
              Hold and say what’s on your <Text style={styles.brainOverlayAccent}>mind</Text>
            </Text>
            <Text style={styles.brainOverlaySubtitle}>
              Tasks, worries, half-formed <Text style={styles.brainOverlayAccent}>ideas</Text>.
            </Text>
            <Text style={styles.brainOverlaySubtitle}>
              Don’t <Text style={styles.brainOverlayAccent}>filter</Text>.
            </Text>
          </View>
        ) : null}
        <View style={styles.brainOverlayThread}>
          <ScrollView
            style={styles.brainOverlayThreadScroll}
            contentContainerStyle={styles.brainOverlayThreadContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
          >
            {messages.map(message => {
              const isUser = message.role === 'user';
              return (
                <View
                  key={message.id}
                  style={[
                    styles.brainOverlayMessageWrap,
                    isUser ? styles.brainOverlayMessageRight : null,
                  ]}
                >
                  <View
                    style={[
                      styles.brainOverlayMessageBubble,
                      isUser ? styles.brainOverlayMessageBubbleRight : styles.brainOverlayMessageBubbleLeft,
                    ]}
                  >
                    <Text style={styles.brainOverlayMessageText}>{message.text}</Text>
                  </View>
                </View>
              );
            })}
            {parsedTasks.length > 0 ? (
              <View style={styles.brainOverlayTaskList}>
                {parsedTasks.map(task => {
                  const isEditing = editingTaskId === task.id;
                  const timeValue = task.startTime
                    ? task.endTime
                      ? `${task.startTime}-${task.endTime}`
                      : task.startTime
                    : '';
                  const handleTimeChange = (text: string) => {
                    const parsed = parseTimeRange(text);
                    setParsedTasks(prev =>
                      prev.map(item =>
                        item.id === task.id ? { ...item, startTime: parsed.startTime, endTime: parsed.endTime } : item
                      )
                    );
                  };
                  return (
                    <View key={task.id} style={styles.brainOverlayTaskCard}>
                      <View style={styles.brainOverlayTaskMain}>
                        {isEditing ? (
                          <View style={styles.brainOverlayTaskEditStack}>
                            <TextInput
                              style={styles.brainOverlayTaskTitleInput}
                              value={task.title}
                              onChangeText={text => {
                                setParsedTasks(prev =>
                                  prev.map(item => (item.id === task.id ? { ...item, title: text } : item))
                                );
                              }}
                              autoFocus
                            />
                            {task.category === 'goal' ? (
                              <View style={styles.brainOverlayTaskMetaRow}>
                                <TextInput
                                  style={[styles.brainOverlayTaskMetaInput, styles.brainOverlayTaskMetaInputWide]}
                                  placeholder="Target date (YYYY-MM-DD)"
                                  placeholderTextColor="#6F6F73"
                                  value={task.date ?? ''}
                                  onChangeText={text => {
                                    setParsedTasks(prev =>
                                      prev.map(item => (item.id === task.id ? { ...item, date: text } : item))
                                    );
                                  }}
                                />
                                <TextInput
                                  style={[styles.brainOverlayTaskMetaInput, styles.brainOverlayTaskMetaInputShort]}
                                  placeholder="Time (HH:mm or HH:mm-HH:mm)"
                                  placeholderTextColor="#6F6F73"
                                  value={timeValue}
                                  onChangeText={handleTimeChange}
                                />
                              </View>
                            ) : (
                              <View style={styles.brainOverlayTaskMetaRow}>
                                <TextInput
                                  style={[styles.brainOverlayTaskMetaInput, styles.brainOverlayTaskMetaInputWide]}
                                  placeholder="Time (HH:mm or HH:mm-HH:mm)"
                                  placeholderTextColor="#6F6F73"
                                  value={timeValue}
                                  onChangeText={handleTimeChange}
                                />
                              </View>
                            )}
                          </View>
                        ) : (
                          <View style={styles.brainOverlayTaskTitleRow}>
                            <View style={[styles.brainOverlayTaskEmojiWrap, { backgroundColor: getCategoryColor(task.category) }]}>
                              <Text style={styles.brainOverlayTaskEmoji}>{getEmoji(task.title, task.category)}</Text>
                            </View>
                            <Text style={styles.brainOverlayTaskTitle}>{task.title}</Text>
                          </View>
                        )}
                        <View style={styles.brainOverlayTaskSubtitleRow}>
                          <SvgUri uri={getTimeIconUri(task)} width={12} height={12} />
                          <Text style={styles.brainOverlayTaskSubtitle}>{getSubtitle(task)}</Text>
                        </View>
                      </View>
                      <View style={[styles.brainOverlayTaskBadge, { backgroundColor: getCategoryColor(task.category) }]}>
                        <Text style={[styles.brainOverlayTaskBadgeText, { color: getBadgeTextColor(task.category) }]}>
                          {getCategoryLabel(task.category)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.brainOverlayTaskEdit}
                        activeOpacity={0.8}
                        onPress={() => setEditingTaskId(prev => (prev === task.id ? null : task.id))}
                      >
                        <SvgUri uri={editIconUri} width={22} height={22} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {parsedTasks.length > 0 ? (
                  <TouchableOpacity
                    style={[
                      styles.brainOverlayConfirmButton,
                      !Object.values(selectedTaskIds).some(Boolean) && styles.brainOverlayConfirmButtonDisabled,
                    ]}
                    activeOpacity={0.85}
                    onPress={handleIntegrate}
                    disabled={!Object.values(selectedTaskIds).some(Boolean)}
                  >
                    <SvgUri uri={tickIconUri} width={14} height={14} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
        <View style={styles.brainOverlayInputWrap}>
          {showIntro ? (
            <View style={styles.brainOverlayChipsRow}>
              {[
                'Create a painting in Renaissance-style',
                'Help me understand a technical document',
              ].map(text => (
                <TouchableOpacity
                  key={text}
                  style={styles.brainOverlayChip}
                  activeOpacity={0.85}
                  onPress={() => setInputText(text)}
                >
                  <Text style={styles.brainOverlayChipText}>{text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <View style={styles.brainOverlayInputRow}>
            <TouchableOpacity
              style={styles.brainOverlayInputPlus}
              activeOpacity={0.85}
              onPress={() => setAttachmentSheetVisible(true)}
            >
              <SvgUri uri={plusIconUri} width={22} height={22} />
            </TouchableOpacity>
            <View style={styles.brainOverlayInputGlass}>
              <BlurView intensity={Platform.OS === 'ios' ? 50 : 20} tint="dark" style={StyleSheet.absoluteFillObject} />
              <View style={styles.brainOverlayInputTint} pointerEvents="none" />
              <View style={styles.brainOverlayInputInner}>
                <TextInput
                  style={styles.brainOverlayInput}
                  placeholder="Ask anything"
                  placeholderTextColor="#9A9AA0"
                  value={inputText}
                  onChangeText={setInputText}
                  selectionColor={BRAIN_LOGO_GREEN}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.brainOverlayInputVoice}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (isParsing) {
                      setIsParsing(false);
                      return;
                    }
                    if (showSend) {
                      handleSend();
                      return;
                    }
                    startRecording();
                  }}
                >
                  {isParsing ? (
                    <View style={styles.brainOverlayStopSquare} />
                  ) : showSend ? (
                    <SvgUri uri={upArrowIconUri} width={18} height={18} />
                  ) : (
                    <SvgUri uri={audioIconUri} width={18} height={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
      <Modal visible={actionSheetMounted} transparent animationType="fade" onRequestClose={closeActionSheet}>
        <View style={styles.actionSheetOverlay}>
          <Animated.View style={[styles.actionSheetBackdrop, { opacity: actionSheetAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeActionSheet} />
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
            <TouchableOpacity
              style={styles.actionSheetItem}
              activeOpacity={0.85}
              onPress={() => {
                if (!actionSession) return;
                closeActionSheet();
                handleShareSession(actionSession.id);
              }}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionSheetLabel}>Share chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetItem}
              activeOpacity={0.85}
              onPress={() => {
                if (!actionSession) return;
                closeActionSheet();
                handleTogglePinSession(actionSession.id, !actionSession.isPinned);
              }}
            >
              <MaterialCommunityIcons name="pin-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionSheetLabel}>{actionSession?.isPinned ? 'Unpin' : 'Pin'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetItem}
              activeOpacity={0.85}
              onPress={() => {
                if (!actionSession) return;
                closeActionSheet();
                setRenameSessionId(actionSession.id);
                setRenameValue(actionSession.title);
                setRenameVisible(true);
              }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionSheetLabel}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetItem}
              activeOpacity={0.85}
              onPress={() => {
                if (!actionSession) return;
                closeActionSheet();
                handleArchiveSession(actionSession.id);
              }}
            >
              <MaterialCommunityIcons name="archive-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionSheetLabel}>Archive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetItem}
              activeOpacity={0.85}
              onPress={() => {
                if (!actionSession) return;
                closeActionSheet();
                handleDeleteSession(actionSession.id);
              }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF5A5F" />
              <Text style={styles.actionSheetLabelDanger}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      <Modal
        visible={renameVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameVisible(false)}
      >
        <View style={styles.renameOverlay}>
          <TouchableOpacity
            style={styles.renameBackdrop}
            activeOpacity={1}
            onPress={() => setRenameVisible(false)}
          />
          <View style={styles.renameCard}>
            <BlurView intensity={Platform.OS === 'ios' ? 60 : 28} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={styles.renameCardTint} />
            <Text style={styles.renameTitle}>Rename chat</Text>
            <TextInput
              style={styles.renameInput}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Chat name"
              placeholderTextColor="#7A7A7D"
              autoFocus
            />
            <View style={styles.renameActions}>
              <TouchableOpacity
                style={styles.renameButton}
                activeOpacity={0.85}
                onPress={() => {
                  setRenameVisible(false);
                  setRenameSessionId(null);
                }}
              >
                <Text style={styles.renameButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.renameButtonPrimary}
                activeOpacity={0.85}
                onPress={handleRenameSessionSave}
              >
                <Text style={styles.renameButtonPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={attachmentSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachmentSheetVisible(false)}
      >
        <View style={styles.attachmentOverlay}>
          <TouchableOpacity
            style={styles.attachmentBackdrop}
            activeOpacity={1}
            onPress={() => setAttachmentSheetVisible(false)}
          />
          <View style={styles.attachmentSheet}>
            <BlurView intensity={Platform.OS === 'ios' ? 60 : 28} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={styles.attachmentSheetTint} />
            <View style={styles.attachmentRow}>
              <TouchableOpacity style={styles.attachmentOption} activeOpacity={0.85} onPress={handlePickCamera}>
                <SvgUri uri={cameraIconUri} width={22} height={22} />
                <Text style={styles.attachmentLabel}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachmentOption} activeOpacity={0.85} onPress={handlePickPhoto}>
                <SvgUri uri={attachPhotoIconUri} width={22} height={22} />
                <Text style={styles.attachmentLabel}>Attach photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachmentOption} activeOpacity={0.85} onPress={handlePickFile}>
                <SvgUri uri={attachFileIconUri} width={22} height={22} />
                <Text style={styles.attachmentLabel}>Attach file</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.brainOverlayFooter}>
        <View style={styles.brainOverlayFooterGlass}>
          <BlurView intensity={Platform.OS === 'ios' ? 52 : 24} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.brainOverlayFooterTint} pointerEvents="none" />
          <View style={styles.brainOverlayFooterRow}>
            <TouchableOpacity
              style={styles.brainOverlayFooterIcon}
              activeOpacity={0.85}
              onPress={() => closeAndNavigate('Now')}
            >
              <SvgUri uri={dashboardIconUri} width={22} height={22} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.brainOverlayFooterIcon}
              activeOpacity={0.85}
              onPress={() => closeAndNavigate('Framework')}
            >
              <SvgUri uri={insightIconUri} width={22} height={22} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.brainOverlayTalkWrap}
              activeOpacity={0.9}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <View style={styles.brainOverlayTalkButton}>
                <SvgUri uri={micIconUri} width={22} height={22} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.brainOverlayFooterIcon}
              activeOpacity={0.85}
              onPress={() => closeAndNavigate('Goal page')}
            >
              <SvgUri uri={calendarIconUri} width={22} height={22} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.brainOverlayFooterIcon}
              activeOpacity={0.85}
              onPress={() => closeAndNavigate('Community')}
            >
              <SvgUri uri={leaderboardIconUri} width={22} height={22} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        <BlurView intensity={Platform.OS === 'ios' ? 36 : 14} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.tabBarTint} pointerEvents="none" />
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (event.defaultPrevented) {
                return;
              }

              if (route.name === 'Add') {
                navigation.navigate('BrainOverlay');
                return;
              }

              navigation.navigate(route.name);
            };

            if (route.name === 'Add') {
              return (
                <LongPressScale
                  key={route.key}
                  onPress={onPress}
                  activeOpacity={0.9}
                  pressInScale={0.94}
                  style={styles.addButtonWrap}
                >
                  <View style={styles.addButton}>
                    <Image source={require('../../assets/logos/playstore.png')} style={styles.addLogo} resizeMode="contain" />
                  </View>
                </LongPressScale>
              );
            }

            const iconXml = getTabIconSvg(route.name);
            return (
              <LongPressScale
                key={route.key}
                onPress={onPress}
                activeOpacity={0.9}
                pressInScale={0.96}
                style={styles.tabItem}
              >
                <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                  <SvgXml xml={iconXml} width={24} height={24} />
                </View>
              </LongPressScale>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <CustomTabBar {...props} />}>
      <Tab.Screen 
        name="Now" 
        component={NowScreen} 
      />
      <Tab.Screen 
        name="Framework" 
        component={InsightsScreen} 
      />
      
      <Tab.Screen
        name="Add"
        component={PlanScreen}
        listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('BrainOverlay');
            },
        })}
      />

      <Tab.Screen 
        name="Goal page" 
        component={CalendarScreen} 
      />
      <Tab.Screen 
        name="Community" 
        component={HealthScreen} 
      />
    </Tab.Navigator>
  );
};

const SplashScreen = () => {
  return (
    <View style={styles.splashContainer}>
      <Image source={INTRO_LOGO} style={styles.splashLogo} resizeMode="contain" />
    </View>
  );
};

const GetStartedScreen = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <View style={styles.getStartedContainer}>
      <View style={styles.getStartedLogoWrap}>
        <Image source={INTRO_LOGO} style={styles.getStartedLogo} resizeMode="contain" />
      </View>
      <TouchableOpacity style={styles.getStartedButton} activeOpacity={0.9} onPress={onComplete}>
        <Text style={styles.getStartedButtonText}>Get started</Text>
      </TouchableOpacity>
    </View>
  );
};

const INTRO_SIGNALS_TITLE_SEGMENTS = [
  { text: '12 signals.\n', color: '#F2F2F2' },
  { text: 'One system.', color: INTRO_GREEN },
];

const INTRO_SIGNALS_BODY_SEGMENTS = [
  { text: 'Neuromax ', color: INTRO_GREEN },
  { text: 'measures what affects execution.\n\n', color: '#F2F2F2' },
  { text: 'The ', color: '#F2F2F2' },
  { text: 'AI', color: INTRO_GREEN },
  { text: ' continuously tracks ', color: '#F2F2F2' },
  { text: '12', color: INTRO_GREEN },
  { text: ' mental and performance signals that determine how much ', color: '#F2F2F2' },
  { text: 'pressure', color: INTRO_GREEN },
  { text: ' or ', color: '#F2F2F2' },
  { text: 'recovery', color: INTRO_GREEN },
  { text: ' you can handle.\n\n', color: '#F2F2F2' },
  { text: 'These are not ', color: '#F2F2F2' },
  { text: 'vanity', color: INTRO_GREEN },
  { text: ' scores.\n', color: '#F2F2F2' },
  { text: 'They directly ', color: '#F2F2F2' },
  { text: 'control', color: INTRO_GREEN },
  { text: ' your ', color: '#F2F2F2' },
  { text: 'schedule', color: INTRO_GREEN },
  { text: ', task ', color: '#F2F2F2' },
  { text: 'difficulty', color: INTRO_GREEN },
  { text: ', and ', color: '#F2F2F2' },
  { text: 'pacing', color: INTRO_GREEN },
  { text: '.', color: '#F2F2F2' },
];

const INTRO_CONTROL_TITLE_SEGMENTS = [
  { text: 'The ', color: '#F2F2F2' },
  { text: 'Control', color: INTRO_GREEN },
  { text: ' Layer', color: '#F2F2F2' },
];

const INTRO_CONTROL_BODY_SEGMENTS = [
  { text: 'It uses:\n', color: '#F2F2F2' },
  { text: '• Your ', color: '#F2F2F2' },
  { text: 'goals', color: INTRO_GREEN },
  { text: ' and ', color: '#F2F2F2' },
  { text: 'commitments', color: INTRO_GREEN },
  { text: '\n', color: '#F2F2F2' },
  { text: '• Calendar ', color: '#F2F2F2' },
  { text: 'constraints', color: INTRO_GREEN },
  { text: '\n', color: '#F2F2F2' },
  { text: '• ', color: '#F2F2F2' },
  { text: 'Reflections', color: INTRO_GREEN },
  { text: ' and ', color: '#F2F2F2' },
  { text: 'stress', color: INTRO_GREEN },
  { text: ' signals\n', color: '#F2F2F2' },
  { text: '• Mental and performance ', color: '#F2F2F2' },
  { text: 'baselines', color: INTRO_GREEN },
  { text: '\n\nFrom this, it:\n', color: '#F2F2F2' },
  { text: '• Sets task ', color: '#F2F2F2' },
  { text: 'priority', color: INTRO_GREEN },
  { text: '\n', color: '#F2F2F2' },
  { text: '• Adjusts ', color: '#F2F2F2' },
  { text: 'difficulty', color: INTRO_GREEN },
  { text: '\n', color: '#F2F2F2' },
  { text: '• Applies ', color: '#F2F2F2' },
  { text: 'pressure', color: INTRO_GREEN },
  { text: ' or ', color: '#F2F2F2' },
  { text: 'recovery', color: INTRO_GREEN },
  { text: '\n', color: '#F2F2F2' },
  { text: '• ', color: '#F2F2F2' },
  { text: 'Rebuilds', color: INTRO_GREEN },
  { text: ' your ', color: '#F2F2F2' },
  { text: 'schedule', color: INTRO_GREEN },
  { text: ' when things slip\n\n', color: '#F2F2F2' },
  { text: 'Miss a task and the ', color: '#F2F2F2' },
  { text: 'AI reshapes', color: INTRO_GREEN },
  { text: ' the day.\n\n', color: '#F2F2F2' },
  { text: 'No ', color: '#F2F2F2' },
  { text: 'manual planning', color: INTRO_GREEN },
  { text: '.\n', color: '#F2F2F2' },
  { text: 'No ', color: '#F2F2F2' },
  { text: 'backlog', color: INTRO_GREEN },
  { text: '.\n\n', color: '#F2F2F2' },
  { text: 'You are not planning your life.\n', color: '#F2F2F2' },
  { text: 'Your AI is.', color: '#F2F2F2' },
];

const renderTypedSegments = (segments: { text: string; color: string }[], count: number, style: any) => {
  let remaining = count;
  return segments.map((segment, index) => {
    if (remaining <= 0) return null;
    const sliceCount = Math.min(segment.text.length, remaining);
    remaining -= sliceCount;
    return (
      <Text key={`${segment.text}-${index}`} style={[style, { color: segment.color }]}>
        {segment.text.slice(0, sliceCount)}
      </Text>
    );
  });
};

const IntroDots = ({ activeIndex, total = 3 }: { activeIndex: number; total?: number }) => {
  return (
    <View style={styles.introDots}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={`dot-${index}`} style={[styles.introDot, index === activeIndex && styles.introDotActive]} />
      ))}
    </View>
  );
};

const IntroArrowButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.introArrowButton} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.introArrowInner}>
        <Text style={styles.introArrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const useIntroSwipe = (onNext: () => void, onPrev?: () => void) => {
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);

  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
  }, [onNext, onPrev]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 18 && Math.abs(gesture.dy) < 16,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -40) {
          onNextRef.current();
          return;
        }
        if (gesture.dx > 40 && onPrevRef.current) {
          onPrevRef.current();
        }
      },
    })
  ).current;

  return panResponder.panHandlers;
};

const IntroWelcomeScreen = ({ onComplete, onBack }: { onComplete: () => void; onBack?: () => void }) => {
  const swipeHandlers = useIntroSwipe(onComplete, onBack);

  return (
    <View style={[styles.introWelcomeContainer, styles.introWelcomeContainerDark]} {...swipeHandlers}>
      <View style={styles.introWelcomeDots}>
        <IntroDots activeIndex={0} />
      </View>
      <View style={[styles.introWelcomeContent, styles.introWelcomeContentWelcome]}>
        <Text style={styles.introWelcomeTitle}>
          <Text style={styles.introWelcomeTitleMedium}>Welcome to</Text>
          {'\n'}
          <Text style={styles.introWelcomeTitleBold}>Neuromax.</Text>
        </Text>
      </View>
      <View style={styles.introWelcomeSpacer} />
      <View style={styles.introWelcomeFooter}>
        <IntroArrowButton onPress={onComplete} />
      </View>
    </View>
  );
};

const IntroSignalsScreen = ({ onComplete, onBack }: { onComplete: () => void; onBack?: () => void }) => {
  const mockupOpacity = useRef(new Animated.Value(0)).current;
  const mockupTranslate = useRef(new Animated.Value(18)).current;
  const mockupScale = useRef(new Animated.Value(0.98)).current;
  const swipeHandlers = useIntroSwipe(onComplete, onBack);
  useEffect(() => {
    Animated.parallel([
      Animated.timing(mockupOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(mockupTranslate, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(mockupScale, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [mockupOpacity, mockupScale, mockupTranslate]);

  return (
    <View style={[styles.introWelcomeContainer, styles.introWelcomeContainerDark]} {...swipeHandlers}>
      <View style={styles.introWelcomeDots}>
        <IntroDots activeIndex={1} />
      </View>
      <View style={styles.introSignalsContentWrap}>
        <Text style={styles.introWelcomeTitle}>12 Neurostates.</Text>
        <Text style={styles.introSignalsSubtitle}>
          Track and optimise the 12 core states that shape your focus, energy, clarity, and overall performance
        </Text>
      </View>
      <View style={styles.introMockupLayer}>
        <Animated.View style={{ opacity: mockupOpacity, transform: [{ translateY: mockupTranslate }, { scale: mockupScale }] }}>
          <Image source={MOCKUP_PHONE_IMAGE} style={styles.introMockupImage} resizeMode="contain" />
        </Animated.View>
      </View>
      <View style={styles.introWelcomeFooter}>
        <IntroArrowButton onPress={onComplete} />
      </View>
    </View>
  );
};

const IntroControlScreen = ({ onComplete, onBack }: { onComplete: () => void; onBack?: () => void }) => {
  const swipeHandlers = useIntroSwipe(onComplete, onBack);

  return (
    <View style={[styles.introWelcomeContainer, styles.introWelcomeContainerDark]} {...swipeHandlers}>
      <View style={styles.introWelcomeDots}>
        <IntroDots activeIndex={2} />
      </View>
      <View style={[styles.introWelcomeContent, styles.introWelcomeContentControl]}>
        <Text style={styles.introWelcomeTitle}>The Control Layer.</Text>
      </View>
      <View style={styles.introWelcomeSpacer} />
      <View style={styles.introWelcomeFooter}>
        <IntroArrowButton onPress={onComplete} />
      </View>
    </View>
  );
};

const IntroCalendarImportScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (isImporting) return;
    setIsImporting(true);
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Calendar access', 'Allow calendar access to import events.');
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      if (calendars.length === 0) {
        Alert.alert('No calendars', 'No calendars were found on this device.');
        return;
      }
      const rangeStart = startOfDay(new Date());
      const rangeEnd = endOfDay(addDays(rangeStart, 30));
      const formatEventTime = (date: Date, timeZone?: string) => {
        if (!timeZone) {
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        const parts = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
          timeZone,
        }).formatToParts(date);
        const hour = parts.find(part => part.type === 'hour')?.value ?? '00';
        const minute = parts.find(part => part.type === 'minute')?.value ?? '00';
        return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
      };
      const formatEventDate = (date: Date, timeZone?: string) => {
        if (!timeZone) return format(date, 'yyyy-MM-dd');
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).formatToParts(date);
        const year = parts.find(part => part.type === 'year')?.value ?? format(date, 'yyyy');
        const month = parts.find(part => part.type === 'month')?.value ?? format(date, 'MM');
        const day = parts.find(part => part.type === 'day')?.value ?? format(date, 'dd');
        return `${year}-${month}-${day}`;
      };
      const eventsPerCalendar = await Promise.all(
        calendars.map(calendar => Calendar.getEventsAsync([calendar.id], rangeStart, rangeEnd))
      );
      const events = eventsPerCalendar.flat();
      const blocks = events
        .map<TimeBlock | null>(event => {
          const startDate = event.startDate ? new Date(event.startDate) : null;
          if (!startDate) return null;
          const timeZone = event.timeZone ?? undefined;
          const isAllDay = Boolean(event.allDay);
          const rawEnd = event.endDate ? new Date(event.endDate) : null;
          const safeEnd = rawEnd && rawEnd.getTime() > startDate.getTime()
            ? rawEnd
            : new Date(startDate.getTime() + 30 * 60 * 1000);
          const startTime = isAllDay ? '00:00' : formatEventTime(startDate, timeZone);
          const endTime = isAllDay ? '23:59' : formatEventTime(safeEnd, timeZone);
          const dateKey = formatEventDate(startDate, timeZone);
          return {
            id: `cal-${event.id}-${startDate.toISOString()}`,
            title: event.title || 'Calendar event',
            startTime,
            endTime,
            type: 'other',
            isCompleted: false,
            date: dateKey,
            location: event.location || undefined,
            source: 'calendar',
            externalId: event.id,
          } as TimeBlock;
        })
        .filter((block): block is TimeBlock => block !== null);
      const existing = await StorageService.getSchedule();
      const retained = existing.filter(item => item.source !== 'calendar');
      const merged = [...retained, ...blocks];
      merged.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return a.startTime.localeCompare(b.startTime);
      });
      await StorageService.saveSchedule(merged);
      onComplete();
    } catch (e) {
      Alert.alert('Import failed', 'Unable to import calendar events right now.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <View style={styles.calendarImportContainer}>
      <View style={styles.calendarImportHeader}>
        <Text style={styles.calendarImportTitle}>Import your calendar</Text>
        <Text style={styles.calendarImportSubtitle}>
          Sync your calendar to your timetable instantly{'\n'}with one tap
        </Text>
      </View>
      <View style={styles.calendarImportMockupWrap}>
        <Image source={MOCKUP_IMPORT_IMAGE} style={styles.calendarImportMockup} resizeMode="contain" />
      </View>
      <TouchableOpacity style={styles.calendarImportButton} activeOpacity={0.9} onPress={handleImport} disabled={isImporting}>
        <Text style={styles.calendarImportButtonText}>Import calendar</Text>
      </TouchableOpacity>
    </View>
  );
};

const IntroRemindersScreen = ({ onComplete, onGranted }: { onComplete: () => void; onGranted: () => void }) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnable = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const finalStatus = status === 'granted' ? status : (await Notifications.requestPermissionsAsync()).status;
      if (finalStatus !== 'granted') {
        Alert.alert('Reminders', 'Enable notifications to get task reminders.');
        return;
      }
      onGranted();
      await StorageService.syncTaskReminders(undefined, true);
      onComplete();
    } catch (e) {
      Alert.alert('Reminders', 'Enable notifications in system settings.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={styles.calendarImportContainer}>
      <View style={styles.calendarImportHeader}>
        <Text style={styles.calendarImportTitle}>Enable reminders</Text>
        <Text style={styles.calendarImportSubtitle}>
          Get alerted 15 minutes before each task block{'\n'}so you stay on track
        </Text>
      </View>
      <View style={styles.calendarImportMockupWrap}>
        <SvgUri uri={INTRO_BELL_URI} width={240} height={240} />
      </View>
      <TouchableOpacity style={styles.calendarImportButton} activeOpacity={0.9} onPress={handleEnable} disabled={isRequesting}>
        <Text style={styles.calendarImportButtonText}>Enable reminders</Text>
      </TouchableOpacity>
    </View>
  );
};

const IntroLocationScreen = ({
  onComplete,
  onGranted,
}: {
  onComplete: (data: {
    address?: string;
    postcode?: string;
    houseNumber?: string;
    placeId?: string;
    latitude?: number;
    longitude?: number;
    backgroundEnabled: boolean;
  }) => void;
  onGranted: () => void;
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [addressOptions, setAddressOptions] = useState<Array<{ description: string; placeId: string }>>([]);
  const [selectedAddress, setSelectedAddress] = useState<{ description: string; placeId: string } | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);

  useEffect(() => {
    const trimmedPostcode = postcode.trim();
    const trimmedHouse = houseNumber.trim();
    setSelectedAddress(null);
    if (!GOOGLE_MAPS_API_KEY || trimmedPostcode.length < 3) {
      setAddressOptions([]);
      return;
    }
    const queryInput = trimmedHouse ? `${trimmedHouse} ${trimmedPostcode}` : trimmedPostcode;
    let isActive = true;
    const timeout = setTimeout(async () => {
      setIsFetching(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(queryInput)}&types=address&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (!isActive) return;
        const options = Array.isArray(data?.predictions)
          ? data.predictions.map((item: { description?: string; place_id?: string }) => ({
              description: item.description ?? '',
              placeId: item.place_id ?? '',
            }))
          : [];
        setAddressOptions(options.filter((item: { description: string; placeId: string }) => item.description && item.placeId));
      } catch (e) {
        if (isActive) {
          setAddressOptions([]);
        }
      } finally {
        if (isActive) {
          setIsFetching(false);
        }
      }
    }, 300);
    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [postcode, houseNumber]);

  const handleEnable = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location access', 'Allow location access to improve commute timing.');
        return;
      }
      let backgroundGranted = false;
      if (Platform.OS === 'android') {
        try {
          const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
          backgroundGranted = backgroundStatus.status === 'granted';
        } catch (e) {
          backgroundGranted = false;
        }
      }
      setBackgroundEnabled(backgroundGranted);
      let latitude: number | undefined;
      let longitude: number | undefined;
      const selectedPlace = selectedAddress;
      if (selectedPlace && GOOGLE_MAPS_API_KEY) {
        try {
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(selectedPlace.placeId)}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`;
          const detailResponse = await fetch(detailUrl);
          const detailData = await detailResponse.json();
          const location = detailData?.result?.geometry?.location;
          if (location?.lat && location?.lng) {
            latitude = Number(location.lat);
            longitude = Number(location.lng);
          }
        } catch (e) {
          latitude = undefined;
          longitude = undefined;
        }
      }
      onGranted();
      const addressText =
        selectedAddress?.description ||
        (houseNumber.trim() && postcode.trim() ? `${houseNumber.trim()} ${postcode.trim()}` : postcode.trim());
      const derivedHouse = selectedAddress?.description?.match(/^\s*([0-9A-Za-z-]+)/)?.[1] ?? houseNumber.trim();
      onComplete({
        address: addressText || undefined,
        postcode: postcode.trim() || undefined,
        houseNumber: derivedHouse || undefined,
        placeId: selectedAddress?.placeId,
        latitude,
        longitude,
        backgroundEnabled: backgroundGranted,
      });
    } catch (e) {
      Alert.alert('Location access', 'Enable location access in system settings.');
    } finally {
      setIsRequesting(false);
    }
  };

  const canContinue = postcode.trim().length > 0 && (!!selectedAddress || houseNumber.trim().length > 0);

  return (
    <View style={styles.calendarImportContainer}>
      <View style={styles.calendarImportHeader}>
        <Text style={styles.calendarImportTitle}>Track your location</Text>
        <Text style={styles.calendarImportSubtitle}>
          Enter your home to plan commutes and auto-block travel time
        </Text>
      </View>
      <View style={styles.calendarImportMockupWrap}>
        <SvgUri uri={INTRO_MAP_URI} width={180} height={180} />
        <View style={styles.locationFormWrap}>
          <Text style={styles.locationInputLabel}>Postcode</Text>
          <TextInput
            style={styles.locationInput}
            placeholder="Enter postcode"
            placeholderTextColor="#6E7685"
            value={postcode}
            onChangeText={setPostcode}
            autoCapitalize="characters"
          />
          <Text style={styles.locationInputLabel}>House number</Text>
          <TextInput
            style={styles.locationInput}
            placeholder="Enter house number"
            placeholderTextColor="#6E7685"
            value={houseNumber}
            onChangeText={setHouseNumber}
          />
          {GOOGLE_MAPS_API_KEY ? (
            <View style={styles.locationSelectList}>
              <Text style={styles.locationInputLabel}>Select address</Text>
              <FlatList
                data={addressOptions}
                keyExtractor={item => item.placeId}
                keyboardShouldPersistTaps="always"
                ListEmptyComponent={
                  postcode.trim().length >= 3 && !isFetching ? (
                    <Text style={styles.locationHelperText}>Type a house number to refine results.</Text>
                  ) : null
                }
                renderItem={({ item }) => {
                  const isSelected = selectedAddress?.placeId === item.placeId;
                  return (
                    <TouchableOpacity
                      style={[styles.locationSelectItem, isSelected && styles.locationSelectItemActive]}
                      onPress={() => {
                        setSelectedAddress(item);
                        const derivedHouse = item.description.match(/^\s*([0-9A-Za-z-]+)/)?.[1] ?? '';
                        if (derivedHouse) {
                          setHouseNumber(derivedHouse);
                        }
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.locationSelectText}>{item.description}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          ) : (
            <Text style={styles.locationHelperText}>Add a Google Maps key to enable house selection.</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.calendarImportButton, !canContinue && styles.calendarImportButtonDisabled]}
        activeOpacity={0.9}
        onPress={handleEnable}
        disabled={isRequesting || !canContinue}
      >
        <Text style={styles.calendarImportButtonText}>Enable location</Text>
      </TouchableOpacity>
    </View>
  );
};

const GOAL_OPTIONS = [
  { id: 'low-body-fat', label: 'Low body fat', emoji: '🧍' },
  { id: 'ffmi', label: 'High Lean Mass Index (FFMI)', emoji: '💪' },
  { id: 'narrow-waist', label: 'Narrow waist', emoji: '🧍' },
  { id: 'strength', label: 'High Strength (1RM numbers)', emoji: '🦍' },
  { id: 'digestion', label: 'Digestion quality', emoji: '🌀' },
  { id: 'v-taper', label: 'V-Taper', emoji: '🧍' },
  { id: 'recovery', label: 'Recovery rate', emoji: '⚡️' },
  { id: 'explosive', label: 'Explosive power', emoji: '💥' },
  { id: 'energy', label: 'Energy levels', emoji: '⚡️' },
  { id: 'shoulders', label: 'Broad Shoulders', emoji: '🧍' },
  { id: 'androgen', label: 'Optimal Androgen Sensitivity', emoji: '🧪' },
  { id: 'flexibility', label: 'Flexibility', emoji: '🧘‍♂️' },
  { id: 'symmetry', label: 'Calf-to-Bicep Symmetry', emoji: '🧬' },
  { id: 'microbiome', label: 'Gut Microbiome Diversity', emoji: '🦠' },
  { id: 'pelvic-tilt', label: 'Correcting Anterior Pelvic Tilt', emoji: '🦴' },
  { id: 'upright', label: 'Upright Posture', emoji: '🦴' },
  { id: 'hydration', label: 'Hydration level', emoji: '💧' },
  { id: 'protein', label: 'High Protein intake', emoji: '🥩' },
  { id: 'hypermobile', label: 'Joint Hypermobility/Stability', emoji: '🦴' },
  { id: 'vo2', label: 'High VO2 Max', emoji: '💗' },
  { id: 'sleep-latency', label: 'Deep Sleep Latency', emoji: '💤' },
  { id: 'pain-free', label: 'Pain-free movement', emoji: '🦿' },
  { id: 'lymphatic', label: 'Lymphatic Efficiency', emoji: '💧' },
  { id: 'proprioceptive', label: 'Proprioceptive Balance', emoji: '🦴' },
  { id: 'spine', label: 'Cervical Spine Neutrality', emoji: '🦴' },
  { id: 'wrist', label: 'Wrist-to-Forearm Ratio', emoji: '✊' },
  { id: 'resting-heart', label: 'Low Resting heart rate', emoji: '💗' },
  { id: 'blood-pressure', label: 'Optimal Blood pressure', emoji: '🩸' },
  { id: 'reaction', label: 'Fast Reaction times', emoji: '⚡️' },
  { id: 'cortisol', label: 'Low Cortisol', emoji: '💻' },
  { id: 'hrv', label: 'High HRV', emoji: '💗' },
  { id: 'insulin', label: 'Insulin Sensitivity', emoji: '🩸' },
  { id: 'grip', label: 'High Grip Strength', emoji: '✊' },
  { id: 'glucose', label: 'Blood Glucose Stability', emoji: '🩸' },
  { id: 'libido', label: 'High Libido', emoji: '🧠' },
  { id: 'cold', label: 'Cold Thermogenesis Tolerance', emoji: '🥶' },
  { id: 'upper-trap', label: 'Upper-Trap Density', emoji: '🏋️' },
  { id: 'breathing', label: 'Nasal Breathing Capacity', emoji: '👃' },
  { id: 'thoracic', label: 'Full Thoracic Mobility', emoji: '🧍' },
  { id: 'reactive', label: 'High Reactive Strength Index', emoji: '🦿' },
  { id: 'bmr', label: 'BMR Optimization', emoji: '🔥' },
  { id: 'add', label: '+', emoji: '' },
];

const GoalsSelectionScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const targetCount = 10;
  const maxSelection = 20;
  const progressValue = Math.min(selected.length / targetCount, 1);
  const horizontalPadding = 6;
  const columnGap = 10;
  const rowGap = 10;
  const showWarning = selected.length >= 15;
  const isOverLimit = selected.length >= maxSelection;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressValue,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, progressValue]);

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  const ringColor = isOverLimit
    ? '#E04A4A'
    : progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E04A4A', INTRO_GREEN],
      });
  const centerColor = isOverLimit
    ? '#E04A4A'
    : progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E04A4A', INTRO_GREEN],
      });

  const handleToggle = (id: string) => {
    if (id === 'add') {
      return;
    }
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(item => item !== id));
      return;
    }
    if (selected.length >= maxSelection) {
      return;
    }
    setSelected(prev => [...prev, id]);
  };

  const canContinue = selected.length >= targetCount;

  return (
    <View style={styles.goalsContainer}>
      <View style={styles.goalsDotsWrap}>
        <IntroDots activeIndex={0} total={5} />
      </View>
      <Text style={styles.goalsTitle}>GOALS</Text>
      <Text style={styles.goalsSubtitle}>
        Desired Outcomes achieved through <Text style={styles.goalsSubtitleAccent}>tasks, habits, and routines</Text>
      </Text>
      {isOverLimit ? (
        <Text style={[styles.goalsWarning, styles.goalsWarningStrong]}>Maximum 20 goals reached</Text>
      ) : showWarning ? (
        <Text style={styles.goalsWarning}>Try to keep it around 10–15 goals.</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.goalsProgressWrap, !canContinue && styles.goalsProgressDisabled]}
        activeOpacity={canContinue ? 0.9 : 1}
        onPress={canContinue ? onComplete : undefined}
      >
        <Svg width={90} height={90}>
          <Circle cx={45} cy={45} r={radius} stroke="#2B2B2B" strokeWidth={8} fill="none" />
          <AnimatedCircle
            cx={45}
            cy={45}
            r={radius}
            stroke={ringColor}
            strokeWidth={8}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </Svg>
        <Animated.View style={[styles.goalsProgressCenter, { backgroundColor: centerColor }]}>
          <Text style={styles.goalsProgressText}>{canContinue ? '→' : `${selected.length}/${targetCount}`}</Text>
        </Animated.View>
      </TouchableOpacity>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.goalsSectionTitle}>Body & Health</Text>
        <View style={[styles.goalsGrid, { paddingHorizontal: horizontalPadding }]}>
          {GOAL_OPTIONS.filter(o => o.id !== 'add').map(option => {
            const isSelected = selected.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.goalsCard,
                  { marginRight: columnGap, marginBottom: rowGap },
                  isSelected && styles.goalsCardActive,
                ]}
                activeOpacity={0.9}
                onPress={() => handleToggle(option.id)}
              >
                <Text style={[styles.goalsCardText, isSelected && styles.goalsCardTextActive]}>
                  {`${option.emoji} ${option.label}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 86,
    height: 86,
  },
  splashTypingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    height: 24,
    width: '100%',
  },
  splashTypingText: {
    color: '#F2F2F2',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  splashCursor: {
    width: 10,
    height: 2,
    marginLeft: 6,
    backgroundColor: '#F2F2F2',
  },
  getStartedContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 56,
  },
  getStartedLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  getStartedLogo: {
    width: 86,
    height: 86,
    marginBottom: 12,
  },
  getStartedLogoText: {
    color: '#E6E6E6',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  getStartedButton: {
    width: '100%',
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9CA4B1',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },
  getStartedButtonText: {
    color: '#16202A',
    fontSize: 16,
    fontWeight: '700',
  },
  introContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 24,
  },
  introWelcomeContainer: {
    flex: 1,
    backgroundColor: '#72AD8D',
    paddingTop: 72,
    paddingBottom: 40,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  introWelcomeContainerDark: {
    backgroundColor: '#000000',
  },
  introWelcomeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.12 }, { translateX: 28 }, { translateY: 80 }],
  },
  introWelcomeDots: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  introTopDots: {
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 8,
  },
  introWelcomeContent: {
    maxWidth: 320,
    marginTop: -520,
  },
  introWelcomeContentWelcome: {
    marginTop: 28,
  },
  introWelcomeContentControl: {
    marginTop: 28,
    maxWidth: 300,
  },
  introWelcomeSpacer: {
    flex: 1,
  },
  introSignalsContent: {
    marginTop: -560,
  },
  introSignalsContentWrap: {
    marginTop: 24,
    maxWidth: 320,
    gap: 12,
  },
  introWelcomeTitle: {
    color: '#FEF8EF',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '700',
  },
  introSignalsSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  introWelcomeTitleSegment: {
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 48,
  },
  introWelcomeTitleMedium: {
    color: '#FEF8EF',
    fontWeight: '500',
  },
  introWelcomeTitleBold: {
    color: '#FEF8EF',
    fontWeight: '700',
  },
  introWelcomeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  introLogoWrap: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  introLogo: {
    width: 30,
    height: 30,
  },
  introContent: {
    flex: 1,
  },
  introTitle: {
    marginBottom: 18,
  },
  introTitleSegment: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  introBody: {
    flex: 1,
  },
  introBodySegment: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  introCursor: {
    color: INTRO_GREEN,
    fontSize: 18,
    fontWeight: '800',
  },
  introFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  introDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  introDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FEF8EF',
  },
  introDotActive: {
    width: 26,
    backgroundColor: INTRO_GREEN,
  },
  introMockupLayer: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  introMockupImage: {
    width: 320,
    height: 460,
  },
  introArrowButton: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introArrowInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: INTRO_ARROW_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 10,
    left: 10,
  },
  introArrowText: {
    color: INTRO_ARROW_GREEN,
    fontSize: 26,
    fontWeight: '800',
  },
  calendarImportContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  calendarImportHeader: {
    gap: 10,
  },
  calendarImportTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
  },
  calendarImportSubtitle: {
    color: '#9CA4B1',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  calendarImportMockupWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  calendarImportMockup: {
    width: 320,
    height: 520,
  },
  calendarImportButton: {
    width: '100%',
    height: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9CA4B1',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },
  calendarImportButtonDisabled: {
    opacity: 0.5,
  },
  calendarImportButtonText: {
    color: '#16202A',
    fontSize: 16,
    fontWeight: '700',
  },
  locationFormWrap: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  locationInputLabel: {
    color: '#9CA4B1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  locationInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#101418',
    borderWidth: 1,
    borderColor: '#1F242B',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  locationSelectList: {
    maxHeight: 200,
    gap: 8,
  },
  locationSelectItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F242B',
    backgroundColor: '#0E1114',
  },
  locationSelectItemActive: {
    borderColor: '#3CAD74',
    backgroundColor: '#0F1A14',
  },
  locationSelectText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  locationHelperText: {
    color: '#6E7685',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  goalsContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 24,
    paddingBottom: 24,
  },
  goalsDotsWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  goalsTitle: {
    textAlign: 'center',
    color: '#F2F2F2',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  goalsSubtitle: {
    textAlign: 'center',
    color: '#D6D6D6',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    paddingHorizontal: 22,
  },
  goalsWarning: {
    textAlign: 'center',
    color: '#F4B740',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  goalsWarningStrong: {
    color: '#E04A4A',
  },
  goalsSubtitleAccent: {
    color: INTRO_GREEN,
  },
  goalsProgressWrap: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 22,
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsProgressDisabled: {
    opacity: 0.8,
  },
  goalsProgressCenter: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsProgressText: {
    color: '#FEF8EF',
    fontSize: 16,
    fontWeight: '800',
  },
  goalsSectionTitle: {
    color: '#F2F2F2',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
    paddingHorizontal: 22,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  goalsCard: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  goalsCardActive: {
    backgroundColor: INTRO_GREEN,
    borderWidth: 1,
    borderColor: '#FEF8EF',
  },
  goalsCardAdd: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  goalsCardText: {
    color: '#EDEDED',
    fontSize: 11,
    fontWeight: '700',
  },
  goalsCardTextActive: {
    color: '#FEF8EF',
  },
  goalsCardAddText: {
    fontSize: 20,
    fontWeight: '800',
  },
  tabBarWrapper: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 18,
  },
  tabBar: {
    height: 84,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(254,248,239,0.08)',
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  tabBarTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 84,
    paddingHorizontal: 4,
  },
  tabItem: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#171717',
  },
  addButtonWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF8EF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  addLogo: {
    width: 28,
    height: 28,
  },
  brainOverlayRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  brainOverlayTopBar: {
    position: 'absolute',
    top: 54,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 6,
  },
  brainOverlayTopLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brainOverlayTopIconPlain: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainOverlayTopTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brainOverlayTopTitle: {
    color: '#DADADF',
    fontSize: 18,
    fontWeight: '700',
  },
  brainOverlayTopChevron: {
    color: '#7D7D81',
    fontSize: 18,
    fontWeight: '700',
  },
  brainOverlayTopRight: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 4,
  },
  sidebarBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  sidebarPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    paddingTop: 64,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
    zIndex: 5,
  },
  sidebarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  sidebarSearchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1B1B1B',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sidebarSearchInput: {
    flex: 1,
    color: '#E6E6EA',
    fontSize: 14,
    fontWeight: '700',
    padding: 0,
  },
  sidebarNewChatIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B1B1B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sidebarTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingLeft: 12,
  },
  sidebarTabRowActive: {
    opacity: 0.9,
  },
  sidebarTabText: {
    color: '#EDEDED',
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarNewChatButton: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#1F1F1F',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sidebarNewChatButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarList: {
    marginTop: 12,
  },
  sidebarListItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sidebarListItemActive: {
    backgroundColor: '#1B1B1B',
  },
  sidebarListItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sidebarListItemText: {
    color: '#E6E6EA',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  sidebarImagesWrap: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  sidebarImagesText: {
    color: '#7D7D81',
    fontSize: 12,
    fontWeight: '600',
  },
  brainOverlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  brainOverlayContent: {
    flex: 1,
    paddingTop: 110,
    paddingBottom: 120,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    position: 'relative',
  },
  brainOverlayIntro: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 10,
  },
  brainOverlayTitle: {
    color: '#EDEDED',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  brainOverlaySubtitle: {
    color: '#C9C9C9',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  brainOverlayAccent: {
    color: BRAIN_LOGO_GREEN,
  },
  brainOverlayThread: {
    flex: 1,
    alignSelf: 'stretch',
    marginTop: 16,
    marginBottom: 10,
    minHeight: 0,
  },
  brainOverlayThreadScroll: {
    flex: 1,
  },
  brainOverlayThreadContent: {
    paddingBottom: 220,
    gap: 8,
  },
  brainOverlayMessageWrap: {
    alignSelf: 'stretch',
    paddingHorizontal: 6,
  },
  brainOverlayMessageRight: {
    alignItems: 'flex-end',
    paddingLeft: 64,
    paddingRight: 2,
  },
  brainOverlayMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(254,248,239,0.08)',
  },
  brainOverlayMessageBubbleLeft: {
    alignSelf: 'flex-start',
  },
  brainOverlayMessageBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#1B1B1B',
    borderColor: 'rgba(254,248,239,0.18)',
  },
  brainOverlayMessageText: {
    color: '#FEF8EF',
    fontSize: 14,
    fontWeight: '600',
  },
  brainOverlayTaskList: {
    gap: 6,
    alignSelf: 'stretch',
    alignItems: 'flex-start',
  },
  brainOverlayTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '96%',
    alignSelf: 'flex-start',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#1D1D1D',
  },
  brainOverlayTaskMain: {
    flex: 1,
  },
  brainOverlayTaskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brainOverlayTaskEmojiWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainOverlayTaskEmoji: {
    fontSize: 16,
  },
  brainOverlayTaskTitle: {
    color: '#FEF8EF',
    fontSize: 12,
    fontWeight: '700',
  },
  brainOverlayTaskTitleInput: {
    color: '#FEF8EF',
    fontSize: 12,
    fontWeight: '700',
    padding: 0,
  },
  brainOverlayTaskEditStack: {
    gap: 6,
  },
  brainOverlayTaskMetaRow: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 38,
  },
  brainOverlayTaskMetaInput: {
    color: '#D6D6D9',
    fontSize: 9,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(254,248,239,0.12)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  brainOverlayTaskMetaInputWide: {
    flex: 1.3,
  },
  brainOverlayTaskMetaInputShort: {
    flex: 0.7,
  },
  brainOverlayTaskSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 0,
    paddingLeft: 38,
  },
  brainOverlayTaskSubtitle: {
    color: '#A8A8AC',
    fontSize: 9,
    fontWeight: '600',
  },
  brainOverlayTaskBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
    marginLeft: 4,
  },
  brainOverlayTaskBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  brainOverlayTaskEdit: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginLeft: 2,
    marginRight: 2,
  },
  brainOverlayConfirmButton: {
    alignSelf: 'flex-end',
    marginTop: -2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainOverlayConfirmButtonDisabled: {
    opacity: 0.4,
  },
  brainOverlayInputWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 112,
    zIndex: 6,
    alignSelf: 'center',
  },
  brainOverlayInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brainOverlayInputPlus: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  brainOverlayInputGlass: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(254,248,239,0.12)',
  },
  brainOverlayInputTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  brainOverlayChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  brainOverlayChip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(18,18,18,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(254,248,239,0.08)',
  },
  brainOverlayChipText: {
    color: '#BEBEC2',
    fontSize: 11,
    fontWeight: '600',
  },
  brainOverlayInputInner: {
    height: 52,
    backgroundColor: 'transparent',
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brainOverlayInput: {
    flex: 1,
    color: '#E6E6EA',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
    padding: 0,
    margin: 0,
  },
  brainOverlayInputVoice: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: 2,
    backgroundColor: '#FFFFFF',
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
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  actionSheetLabel: {
    color: '#EDEDED',
    fontSize: 15,
    fontWeight: '600',
  },
  actionSheetLabelDanger: {
    color: '#FF5A5F',
    fontSize: 15,
    fontWeight: '600',
  },
  renameOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  renameBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  renameCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(10,10,10,0.85)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  renameCardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  renameTitle: {
    color: '#EDEDED',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  renameInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    color: '#E6E6EA',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(20,20,20,0.7)',
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  renameButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  renameButtonText: {
    color: '#E6E6EA',
    fontSize: 13,
    fontWeight: '700',
  },
  renameButtonPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  renameButtonPrimaryText: {
    color: '#0B0B0B',
    fontSize: 13,
    fontWeight: '700',
  },
  attachmentOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 140,
  },
  attachmentBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  attachmentSheet: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(10,10,10,0.85)',
  },
  attachmentSheetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  attachmentRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  attachmentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(25,25,25,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  attachmentLabel: {
    color: '#EDEDED',
    fontSize: 12,
    fontWeight: '700',
  },
  brainOverlayFooter: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 18,
  },
  brainOverlayFooterGlass: {
    height: 84,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(254,248,239,0.08)',
    paddingHorizontal: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brainOverlayFooterTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  brainOverlayFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 84,
    paddingHorizontal: 6,
  },
  brainOverlayFooterIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  brainOverlayTalkWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainOverlayTalkButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF8EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainOverlayStopSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: BRAIN_LOGO_GREEN,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  }
});

export const AppNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [shouldShowIntro, setShouldShowIntro] = useState(false);
  const [introStep, setIntroStep] = useState<'get-started' | 'welcome' | 'signals' | 'control' | 'calendar-import' | 'reminders' | 'location' | 'done'>('get-started');
  const [showSplash, setShowSplash] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [introNotificationsEnabled, setIntroNotificationsEnabled] = useState(false);
  const [introLocationEnabled, setIntroLocationEnabled] = useState(false);
  const [introHomeAddress, setIntroHomeAddress] = useState<string | undefined>(undefined);
  const [introHomePostcode, setIntroHomePostcode] = useState<string | undefined>(undefined);
  const [introHomeHouseNumber, setIntroHomeHouseNumber] = useState<string | undefined>(undefined);
  const [introHomePlaceId, setIntroHomePlaceId] = useState<string | undefined>(undefined);
  const [introHomeLatitude, setIntroHomeLatitude] = useState<number | undefined>(undefined);
  const [introHomeLongitude, setIntroHomeLongitude] = useState<number | undefined>(undefined);
  const [introBackgroundLocationEnabled, setIntroBackgroundLocationEnabled] = useState(false);
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const fullText = useMemo(() => 'neuromax', []);

  useEffect(() => {
    checkOnboarding();
  }, []);

  useEffect(() => {
    const typingDelay = 0;
    const typingSpeed = 120;
    const typingDuration = typingDelay + fullText.length * typingSpeed;
    const splashDuration = 800;
    const typingTimeout = setTimeout(() => {
      if (!fullText.length) return;
      let index = 0;
      const interval = setInterval(() => {
        index += 1;
        setTypedText(fullText.slice(0, index));
        if (index >= fullText.length) {
          clearInterval(interval);
        }
      }, typingSpeed);
    }, typingDelay);
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, splashDuration);
    const cursorAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    cursorAnim.start();
    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(splashTimeout);
      cursorAnim.stop();
    };
  }, [cursorOpacity, fullText]);

  const checkOnboarding = async () => {
    try {
      const profile = await StorageService.getUserProfile();
      if (profile && profile.isOnboardingCompleted) {
        setShouldShowIntro(false);
      } else {
        setShouldShowIntro(true);
        setIntroStep('get-started');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const completeIntro = async () => {
    setShouldShowIntro(false);
    setIntroStep('done');
    try {
      const profile = await StorageService.getUserProfile();
      if (profile) {
        if (!profile.isOnboardingCompleted) {
          await StorageService.saveUserProfile({
            ...profile,
            isOnboardingCompleted: true,
            notificationsEnabled: profile.notificationsEnabled || introNotificationsEnabled,
            locationEnabled: profile.locationEnabled || introLocationEnabled,
            homeAddress: profile.homeAddress ?? introHomeAddress,
            homePostcode: profile.homePostcode ?? introHomePostcode,
            homeHouseNumber: profile.homeHouseNumber ?? introHomeHouseNumber,
            homePlaceId: profile.homePlaceId ?? introHomePlaceId,
            homeLatitude: profile.homeLatitude ?? introHomeLatitude,
            homeLongitude: profile.homeLongitude ?? introHomeLongitude,
            backgroundLocationEnabled: profile.backgroundLocationEnabled ?? introBackgroundLocationEnabled,
            commuteBufferMinutes: profile.commuteBufferMinutes ?? 10,
          });
        }
      } else {
        await StorageService.saveUserProfile({
          name: 'User',
          gender: 'other',
          dob: new Date(2000, 0, 1).toISOString(),
          notificationsEnabled: introNotificationsEnabled,
          calendarEnabled: false,
          locationEnabled: introLocationEnabled,
          homeAddress: introHomeAddress,
          homePostcode: introHomePostcode,
          homeHouseNumber: introHomeHouseNumber,
          homePlaceId: introHomePlaceId,
          homeLatitude: introHomeLatitude,
          homeLongitude: introHomeLongitude,
          backgroundLocationEnabled: introBackgroundLocationEnabled,
          commuteBufferMinutes: 10,
          isOnboardingCompleted: true,
          xp: 0,
          rank: 'Iron I',
          streak: 0,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || showSplash) {
    return <SplashScreen />;
  }

  if (shouldShowIntro && introStep !== 'done') {
    if (introStep === 'get-started') {
      return <GetStartedScreen onComplete={() => setIntroStep('welcome')} />;
    }
    if (introStep === 'welcome') {
      return <IntroWelcomeScreen onComplete={() => setIntroStep('signals')} onBack={() => setIntroStep('get-started')} />;
    }
    if (introStep === 'signals') {
      return <IntroSignalsScreen onComplete={() => setIntroStep('control')} onBack={() => setIntroStep('welcome')} />;
    }
    if (introStep === 'control') {
      return <IntroControlScreen onComplete={() => setIntroStep('calendar-import')} onBack={() => setIntroStep('signals')} />;
    }
    if (introStep === 'calendar-import') {
      return <IntroCalendarImportScreen onComplete={() => setIntroStep('reminders')} />;
    }
    if (introStep === 'reminders') {
      return <IntroRemindersScreen onComplete={() => setIntroStep('location')} onGranted={() => setIntroNotificationsEnabled(true)} />;
    }
    return (
      <IntroLocationScreen
        onComplete={(data) => {
          setIntroLocationEnabled(true);
          setIntroHomeAddress(data.address);
          setIntroHomePostcode(data.postcode);
          setIntroHomeHouseNumber(data.houseNumber);
          setIntroHomePlaceId(data.placeId);
          setIntroHomeLatitude(data.latitude);
          setIntroHomeLongitude(data.longitude);
          setIntroBackgroundLocationEnabled(data.backgroundEnabled);
          void completeIntro();
        }}
        onGranted={() => setIntroLocationEnabled(true)}
      />
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ padding: 24, borderRadius: 20 }}>
          <View>
            <View>
              <View>
                <View />
              </View>
            </View>
          </View>
          <View>
            <View>
              <View />
            </View>
          </View>
          <View>
            <View>
              <View />
            </View>
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <View />
          </View>
        </View>
        <View>
          <View>
            <Text style={{ color: COLORS.success, fontSize: 48, fontWeight: '800', letterSpacing: 2 }}>NOW</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 260, easing: Easing.out(Easing.cubic) } },
            close: { animation: 'timing', config: { duration: 220, easing: Easing.in(Easing.cubic) } },
          },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen 
          name="AddModal" 
          component={PlanScreen} 
          options={{ 
            presentation: 'transparentModal',
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="FrameworkOverlay" 
          component={BrainOverlayScreen} 
          options={{ 
            presentation: 'transparentModal',
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="BrainOverlay" 
          component={BrainOverlayScreen} 
          options={{ 
            presentation: 'transparentModal',
            animation: 'fade',
          }} 
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Circle, Path, SvgXml } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isAfter, isSameMonth } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { HomeHeader } from '../components/HomeHeader';
import { StorageService } from '../services/storage';
 
const emojiSvgs = {
  happy1: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 0H13C12.45 0 12 0.45 12 1C12 1.55 12.45 2 13 2H14C15.1 2 16 2.9 16 4V5C16 5.55 16.45 6 17 6C17.55 6 18 5.55 18 5V4C18 1.79 16.2 0 14 0Z" fill="#3CAE74"/>
<path d="M17 12C16.45 12 16 12.45 16 13V14C16 15.1 15.1 16 14 16H13C12.45 16 12 16.45 12 17C12 17.55 12.45 18 13 18H14C16.21 18 18 16.2 18 14V13C18 12.45 17.55 12 17 12Z" fill="#3CAE74"/>
<path d="M5 16H4C2.9 16 2 15.1 2 14V13C2 12.45 1.55 12 1 12C0.45 12 0 12.45 0 13V14C0 16.21 1.8 18 4 18H5C5.55 18 6 17.55 6 17C6 16.45 5.55 16 5 16Z" fill="#3CAE74"/>
<path d="M1 6C1.55 6 2 5.55 2 5V4C2 2.9 2.9 2 4 2H5C5.55 2 6 1.55 6 1C6 0.45 5.55 0 5 0H4C1.79 0 0 1.8 0 4V5C0 5.55 0.45 6 1 6Z" fill="#3CAE74"/>
<path d="M4.5 6V6.58C4.5 7.13 4.95 7.58 5.5 7.58C6.05 7.58 6.5 7.13 6.5 6.58V6C6.5 5.45 6.05 5 5.5 5C4.95 5 4.5 5.45 4.5 6Z" fill="#3CAE74"/>
<path d="M12.51 7.58C13.06 7.58 13.51 7.13 13.51 6.58V6C13.51 5.45 13.06 5 12.51 5C11.96 5 11.51 5.45 11.51 6V6.58C11.51 7.13 11.96 7.58 12.51 7.58Z" fill="#3CAE74"/>
<path d="M12.7101 12.17C12.3301 11.77 11.7001 11.75 11.3001 12.13C10.0901 13.27 7.88007 13.24 6.71007 12.06C6.32007 11.67 5.69007 11.67 5.30007 12.06C4.91007 12.45 4.91007 13.08 5.30007 13.47C6.27007 14.44 7.63007 15 9.05007 15C10.4701 15 11.7101 14.5 12.6801 13.58C13.0801 13.2 13.1001 12.57 12.7201 12.17H12.7101Z" fill="#3CAE74"/>
</svg>`,
  happy2: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 0H13C12.45 0 12 0.45 12 1C12 1.55 12.45 2 13 2H14C15.1 2 16 2.9 16 4V5C16 5.55 16.45 6 17 6C17.55 6 18 5.55 18 5V4C18 1.79 16.2 0 14 0Z" fill="#3CAE74"/>
<path d="M17 12C16.45 12 16 12.45 16 13V14C16 15.1 15.1 16 14 16H13C12.45 16 12 16.45 12 17C12 17.55 12.45 18 13 18H14C16.21 18 18 16.2 18 14V13C18 12.45 17.55 12 17 12Z" fill="#3CAE74"/>
<path d="M5 16H4C2.9 16 2 15.1 2 14V13C2 12.45 1.55 12 1 12C0.45 12 0 12.45 0 13V14C0 16.21 1.8 18 4 18H5C5.55 18 6 17.55 6 17C6 16.45 5.55 16 5 16Z" fill="#3CAE74"/>
<path d="M1 6C1.55 6 2 5.55 2 5V4C2 2.9 2.9 2 4 2H5C5.55 2 6 1.55 6 1C6 0.45 5.55 0 5 0H4C1.79 0 0 1.8 0 4V5C0 5.55 0.45 6 1 6Z" fill="#3CAE74"/>
<ellipse cx="9" cy="10.5" rx="4" ry="3.5" fill="#3CAE74"/>
<rect x="3" y="7" width="12" height="4" fill="black"/>
<path d="M4.5 6V6.58C4.5 7.13 4.95 7.58 5.5 7.58C6.05 7.58 6.5 7.13 6.5 6.58V6C6.5 5.45 6.05 5 5.5 5C4.95 5 4.5 5.45 4.5 6Z" fill="#3CAE74"/>
<path d="M12.51 7.58C13.06 7.58 13.51 7.13 13.51 6.58V6C13.51 5.45 13.06 5 12.51 5C11.96 5 11.51 5.45 11.51 6V6.58C11.51 7.13 11.96 7.58 12.51 7.58Z" fill="#3CAE74"/>
</svg>`,
  sad1: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 0H13C12.45 0 12 0.45 12 1C12 1.55 12.45 2 13 2H14C15.1 2 16 2.9 16 4V5C16 5.55 16.45 6 17 6C17.55 6 18 5.55 18 5V4C18 1.79 16.2 0 14 0Z" fill="#3CAE74"/>
<path d="M17 12C16.45 12 16 12.45 16 13V14C16 15.1 15.1 16 14 16H13C12.45 16 12 16.45 12 17C12 17.55 12.45 18 13 18H14C16.21 18 18 16.2 18 14V13C18 12.45 17.55 12 17 12Z" fill="#3CAE74"/>
<path d="M5 16H4C2.9 16 2 15.1 2 14V13C2 12.45 1.55 12 1 12C0.45 12 0 12.45 0 13V14C0 16.21 1.8 18 4 18H5C5.55 18 6 17.55 6 17C6 16.45 5.55 16 5 16Z" fill="#3CAE74"/>
<path d="M1 6C1.55 6 2 5.55 2 5V4C2 2.9 2.9 2 4 2H5C5.55 2 6 1.55 6 1C6 0.45 5.55 0 5 0H4C1.79 0 0 1.8 0 4V5C0 5.55 0.45 6 1 6Z" fill="#3CAE74"/>
<path d="M4.5 6V6.58C4.5 7.13 4.95 7.58 5.5 7.58C6.05 7.58 6.5 7.13 6.5 6.58V6C6.5 5.45 6.05 5 5.5 5C4.95 5 4.5 5.45 4.5 6Z" fill="#3CAE74"/>
<path d="M12.51 7.58C13.06 7.58 13.51 7.13 13.51 6.58V6C13.51 5.45 13.06 5 12.51 5C11.96 5 11.51 5.45 11.51 6V6.58C11.51 7.13 11.96 7.58 12.51 7.58Z" fill="#3CAE74"/>
<path d="M12.7025 12.83C12.3225 13.23 11.6925 13.25 11.2925 12.87C10.0825 11.73 7.8725 11.76 6.7025 12.94C6.3125 13.33 5.6825 13.33 5.2925 12.94C4.9025 12.55 4.9025 11.92 5.2925 11.53C6.2625 10.56 7.6225 9.99998 9.0425 9.99998C10.4625 9.99998 11.7025 10.5 12.6725 11.42C13.0725 11.8 13.0925 12.43 12.7125 12.83H12.7025Z" fill="#3CAE74"/>
</svg>`,
  sad2: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 0H13C12.45 0 12 0.45 12 1C12 1.55 12.45 2 13 2H14C15.1 2 16 2.9 16 4V5C16 5.55 16.45 6 17 6C17.55 6 18 5.55 18 5V4C18 1.79 16.2 0 14 0Z" fill="#3CAE74"/>
<path d="M17 12C16.45 12 16 12.45 16 13V14C16 15.1 15.1 16 14 16H13C12.45 16 12 16.45 12 17C12 17.55 12.45 18 13 18H14C16.21 18 18 16.2 18 14V13C18 12.45 17.55 12 17 12Z" fill="#3CAE74"/>
<path d="M5 16H4C2.9 16 2 15.1 2 14V13C2 12.45 1.55 12 1 12C0.45 12 0 12.45 0 13V14C0 16.21 1.8 18 4 18H5C5.55 18 6 17.55 6 17C6 16.45 5.55 16 5 16Z" fill="#3CAE74"/>
<path d="M1 6C1.55 6 2 5.55 2 5V4C2 2.9 2.9 2 4 2H5C5.55 2 6 1.55 6 1C6 0.45 5.55 0 5 0H4C1.79 0 0 1.8 0 4V5C0 5.55 0.45 6 1 6Z" fill="#3CAE74"/>
<rect x="3" y="7" width="12" height="4" fill="black"/>
<mask id="path-6-outside-1_2246_1408" maskUnits="userSpaceOnUse" x="4" y="5" width="4" height="3" fill="black">
<rect fill="#FEF8EF" x="4" y="5" width="4" height="3"/>
<path d="M6.5 6C6.74028 6 6.86042 6 6.93306 6.12245C7.0057 6.2449 6.96299 6.32308 6.87758 6.47944C6.8323 6.56233 6.7751 6.63911 6.70711 6.70711C6.51957 6.89464 6.26522 7 6 7C5.73478 7 5.48043 6.89464 5.29289 6.70711C5.2249 6.63911 5.16771 6.56233 5.12242 6.47944C5.03701 6.32308 4.9943 6.2449 5.06694 6.12245C5.13958 6 5.25972 6 5.5 6L6 6H6.5Z"/>
</mask>
<path d="M6.5 6C6.74028 6 6.86042 6 6.93306 6.12245C7.0057 6.2449 6.96299 6.32308 6.87758 6.47944C6.8323 6.56233 6.7751 6.63911 6.70711 6.70711C6.51957 6.89464 6.26522 7 6 7C5.73478 7 5.48043 6.89464 5.29289 6.70711C5.2249 6.63911 5.16771 6.56233 5.12242 6.47944C5.03701 6.32308 4.9943 6.2449 5.06694 6.12245C5.13958 6 5.25972 6 5.5 6L6 6H6.5Z" fill="#3CAE74"/>
<path d="M6.5 6C6.74028 6 6.86042 6 6.93306 6.12245C7.0057 6.2449 6.96299 6.32308 6.87758 6.47944C6.8323 6.56233 6.7751 6.63911 6.70711 6.70711C6.51957 6.89464 6.26522 7 6 7C5.73478 7 5.48043 6.89464 5.29289 6.70711C5.2249 6.63911 5.16771 6.56233 5.12242 6.47944C5.03701 6.32308 4.9943 6.2449 5.06694 6.12245C5.13958 6 5.25972 6 5.5 6L6 6H6.5Z" stroke="#3CAE74" stroke-linecap="round" mask="url(#path-6-outside-1_2246_1408)"/>
<mask id="path-7-outside-2_2246_1408" maskUnits="userSpaceOnUse" x="10" y="5" width="4" height="3" fill="black">
<rect fill="#FEF8EF" x="10" y="5" width="4" height="3"/>
<path d="M12.5 6C12.7403 6 12.8604 6 12.9331 6.12245C13.0057 6.2449 12.963 6.32308 12.8776 6.47944C12.8323 6.56233 12.7751 6.63911 12.7071 6.70711C12.5196 6.89464 12.2652 7 12 7C11.7348 7 11.4804 6.89464 11.2929 6.70711C11.2249 6.63911 11.1677 6.56233 11.1224 6.47944C11.037 6.32308 10.9943 6.2449 11.0669 6.12245C11.1396 6 11.2597 6 11.5 6L12 6H12.5Z"/>
</mask>
<path d="M12.5 6C12.7403 6 12.8604 6 12.9331 6.12245C13.0057 6.2449 12.963 6.32308 12.8776 6.47944C12.8323 6.56233 12.7751 6.63911 12.7071 6.70711C12.5196 6.89464 12.2652 7 12 7C11.7348 7 11.4804 6.89464 11.2929 6.70711C11.2249 6.63911 11.1677 6.56233 11.1224 6.47944C11.037 6.32308 10.9943 6.2449 11.0669 6.12245C11.1396 6 11.2597 6 11.5 6L12 6H12.5Z" fill="#3CAE74"/>
<path d="M12.5 6C12.7403 6 12.8604 6 12.9331 6.12245C13.0057 6.2449 12.963 6.32308 12.8776 6.47944C12.8323 6.56233 12.7751 6.63911 12.7071 6.70711C12.5196 6.89464 12.2652 7 12 7C11.7348 7 11.4804 6.89464 11.2929 6.70711C11.2249 6.63911 11.1677 6.56233 11.1224 6.47944C11.037 6.32308 10.9943 6.2449 11.0669 6.12245C11.1396 6 11.2597 6 11.5 6L12 6H12.5Z" stroke="#3CAE74" stroke-linecap="round" mask="url(#path-7-outside-2_2246_1408)"/>
<path d="M12.7025 12.83C12.3225 13.23 11.6925 13.25 11.2925 12.87C10.0825 11.73 7.8725 11.76 6.7025 12.94C6.3125 13.33 5.6825 13.33 5.2925 12.94C4.9025 12.55 4.9025 11.92 5.2925 11.53C6.2625 10.56 7.6225 9.99998 9.0425 9.99998C10.4625 9.99998 11.7025 10.5 12.6725 11.42C13.0725 11.8 13.0925 12.43 12.7125 12.83H12.7025Z" fill="#3CAE74"/>
</svg>`,
  sad3: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 0H13C12.45 0 12 0.45 12 1C12 1.55 12.45 2 13 2H14C15.1 2 16 2.9 16 4V5C16 5.55 16.45 6 17 6C17.55 6 18 5.55 18 5V4C18 1.79 16.2 0 14 0Z" fill="#3CAE74"/>
<path d="M17 12C16.45 12 16 12.45 16 13V14C16 15.1 15.1 16 14 16H13C12.45 16 12 16.45 12 17C12 17.55 12.45 18 13 18H14C16.21 18 18 16.2 18 14V13C18 12.45 17.55 12 17 12Z" fill="#3CAE74"/>
<path d="M5 16H4C2.9 16 2 15.1 2 14V13C2 12.45 1.55 12 1 12C0.45 12 0 12.45 0 13V14C0 16.21 1.8 18 4 18H5C5.55 18 6 17.55 6 17C6 16.45 5.55 16 5 16Z" fill="#3CAE74"/>
<path d="M1 6C1.55 6 2 5.55 2 5V4C2 2.9 2.9 2 4 2H5C5.55 2 6 1.55 6 1C6 0.45 5.55 0 5 0H4C1.79 0 0 1.8 0 4V5C0 5.55 0.45 6 1 6Z" fill="#3CAE74"/>
<rect x="3" y="7" width="12" height="4" fill="black"/>
<mask id="path-6-outside-1_2246_1424" maskUnits="userSpaceOnUse" x="4" y="5" width="4" height="3" fill="black">
<rect fill="#FEF8EF" x="4" y="5" width="4" height="3"/>
<path d="M6.5 6C6.74028 6 6.86042 6 6.93306 6.12245C7.0057 6.2449 6.96299 6.32308 6.87758 6.47944C6.8323 6.56233 6.7751 6.63911 6.70711 6.70711C6.51957 6.89464 6.26522 7 6 7C5.73478 7 5.48043 6.89464 5.29289 6.70711C5.2249 6.63911 5.16771 6.56233 5.12242 6.47944C5.03701 6.32308 4.9943 6.2449 5.06694 6.12245C5.13958 6 5.25972 6 5.5 6L6 6H6.5Z"/>
</mask>
<path d="M6.5 6C6.74028 6 6.86042 6 6.93306 6.12245C7.0057 6.2449 6.96299 6.32308 6.87758 6.47944C6.8323 6.56233 6.7751 6.63911 6.70711 6.70711C6.51957 6.89464 6.26522 7 6 7C5.73478 7 5.48043 6.89464 5.29289 6.70711C5.2249 6.63911 5.16771 6.56233 5.12242 6.47944C5.03701 6.32308 4.9943 6.2449 5.06694 6.12245C5.13958 6 5.25972 6 5.5 6L6 6H6.5Z" fill="#3CAE74"/>
<path d="M6.5 6C6.74028 6 6.86042 6 6.93306 6.12245C7.0057 6.2449 6.96299 6.32308 6.87758 6.47944C6.8323 6.56233 6.7751 6.63911 6.70711 6.70711C6.51957 6.89464 6.26522 7 6 7C5.73478 7 5.48043 6.89464 5.29289 6.70711C5.2249 6.63911 5.16771 6.56233 5.12242 6.47944C5.03701 6.32308 4.9943 6.2449 5.06694 6.12245C5.13958 6 5.25972 6 5.5 6L6 6H6.5Z" stroke="#3CAE74" stroke-linecap="round" mask="url(#path-6-outside-1_2246_1424)"/>
<mask id="path-7-outside-2_2246_1424" maskUnits="userSpaceOnUse" x="10" y="5" width="4" height="3" fill="black">
<rect fill="#FEF8EF" x="10" y="5" width="4" height="3"/>
<path d="M12.5 6C12.7403 6 12.8604 6 12.9331 6.12245C13.0057 6.2449 12.963 6.32308 12.8776 6.47944C12.8323 6.56233 12.7751 6.63911 12.7071 6.70711C12.5196 6.89464 12.2652 7 12 7C11.7348 7 11.4804 6.89464 11.2929 6.70711C11.2249 6.63911 11.1677 6.56233 11.1224 6.47944C11.037 6.32308 10.9943 6.2449 11.0669 6.12245C11.1396 6 11.2597 6 11.5 6L12 6H12.5Z"/>
</mask>
<path d="M12.5 6C12.7403 6 12.8604 6 12.9331 6.12245C13.0057 6.2449 12.963 6.32308 12.8776 6.47944C12.8323 6.56233 12.7751 6.63911 12.7071 6.70711C12.5196 6.89464 12.2652 7 12 7C11.7348 7 11.4804 6.89464 11.2929 6.70711C11.2249 6.63911 11.1677 6.56233 11.1224 6.47944C11.037 6.32308 10.9943 6.2449 11.0669 6.12245C11.1396 6 11.2597 6 11.5 6L12 6H12.5Z" fill="#3CAE74"/>
<path d="M12.5 6C12.7403 6 12.8604 6 12.9331 6.12245C13.0057 6.2449 12.963 6.32308 12.8776 6.47944C12.8323 6.56233 12.7751 6.63911 12.7071 6.70711C12.5196 6.89464 12.2652 7 12 7C11.7348 7 11.4804 6.89464 11.2929 6.70711C11.2249 6.63911 11.1677 6.56233 11.1224 6.47944C11.037 6.32308 10.9943 6.2449 11.0669 6.12245C11.1396 6 11.2597 6 11.5 6L12 6H12.5Z" stroke="#3CAE74" stroke-linecap="round" mask="url(#path-7-outside-2_2246_1424)"/>
<path d="M5.32429 12.2726C5.74217 12.1822 6.3005 12.1149 6.92802 12.0696C7.56331 12.0237 8.27735 12 9 12C9.72265 12 10.4367 12.0237 11.072 12.0696C11.6995 12.1149 12.2578 12.1822 12.6757 12.2726" stroke="#3CAE74" stroke-width="2" stroke-linecap="round"/>
</svg>`,
};

const INSIGHT_GREEN = '#6FB38C';
const INSIGHT_YELLOW = '#D6B24C';
const INSIGHT_RED = '#B23A4B';

const metricCards = [
  { label: 'Cortisol', value: 9.1, color: INSIGHT_GREEN, emoji: '🌡️' },
  { label: 'Sleep', value: 7.6, color: INSIGHT_GREEN, emoji: '🌙' },
  { label: 'Recovery', value: 8.2, color: INSIGHT_GREEN, emoji: '♻️' },
  { label: 'Execution', value: 8.6, color: INSIGHT_GREEN, emoji: '🛠️' },
  { label: 'Consistency', value: 8.5, color: INSIGHT_GREEN, emoji: '🧱' },
  { label: 'Motivation', value: 7.4, color: INSIGHT_GREEN, emoji: '🚀' },
  { label: 'Burnout Risk', value: 9.6, color: INSIGHT_GREEN, emoji: '🥀' },
  { label: 'Confidence', value: 6.9, color: INSIGHT_YELLOW, emoji: '🦁' },
  { label: 'Discipline', value: 9.4, color: INSIGHT_GREEN, emoji: '🛡️' },
];

const reflectionChips = [
  { label: 'Morning Reflection', color: '#A58B5B', icon: 'weather-sunset' },
  { label: 'Evening Reflection', color: '#6FB38C', icon: 'leaf' },
  { label: 'Night Reflection', color: '#6B5AA6', icon: 'weather-night' },
];

const GRID_COLUMNS = 3;
const GRID_GAP = 12;
const GRID_SIDE_PADDING = SPACING.l;
const METRIC_CARD_SIZE =
  (Dimensions.get('window').width - GRID_SIDE_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const MONTH_CELL_SIZE = 32;
const MONTH_STROKE_WIDTH = 3;
const MONTH_DASH_COUNT = 8;
const MONTH_DASH_COLOR = '#2F2F2F';
const MONTH_TRACK_COLOR = '#2A2A2A';

const monthDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const monthlyInsightMap = {
  '2025-06-04': { ratio: 1, color: INSIGHT_GREEN },
  '2025-06-08': { ratio: 0.9, color: INSIGHT_GREEN },
  '2025-06-10': { ratio: 0.35, color: INSIGHT_RED },
  '2025-06-13': { ratio: 0.8, color: INSIGHT_GREEN },
  '2025-06-16': { ratio: 0.7, color: INSIGHT_GREEN },
  '2025-06-17': { ratio: 0.65, color: INSIGHT_GREEN },
  '2025-06-18': { ratio: 0.7, color: INSIGHT_GREEN },
  '2025-06-19': { ratio: 0.6, color: INSIGHT_GREEN },
  '2025-06-21': { ratio: 0.75, color: INSIGHT_GREEN },
  '2025-06-24': { ratio: 0.7, color: INSIGHT_GREEN },
  '2025-06-25': { ratio: 0.55, color: INSIGHT_GREEN },
  '2025-06-26': { ratio: 0.4, color: INSIGHT_RED },
  '2025-06-27': { ratio: 0.75, color: INSIGHT_GREEN },
  '2025-06-28': { ratio: 0.85, color: INSIGHT_GREEN },
  '2025-06-29': { ratio: 0.7, color: INSIGHT_GREEN },
  '2025-06-30': { ratio: 0.9, color: INSIGHT_GREEN },
};

export const InsightsScreen = () => {
  const today = new Date();
  const [monthlyMonth, setMonthlyMonth] = useState(startOfMonth(today));
  const monthlyToday = today;
  const [todayCompletionRatio, setTodayCompletionRatio] = useState(0);
  const todayProgressAnim = useRef(new Animated.Value(0)).current;
  const AnimatedCircle = useMemo(() => Animated.createAnimatedComponent(Circle), []);
  const weekStart = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]);
  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);
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
  const todayDashOffset = useMemo(
    () =>
      todayProgressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [monthCircumference, 0],
      }),
    [todayProgressAnim, monthCircumference],
  );
  const tintSvg = (xml: string, color: string) => xml.replace(/#3CAE74/g, color);
    const weeklyEmojiOrder = [
      { xml: tintSvg(emojiSvgs.happy1, INSIGHT_GREEN), color: INSIGHT_GREEN },
      { xml: tintSvg(emojiSvgs.happy2, INSIGHT_YELLOW), color: INSIGHT_YELLOW },
      { xml: tintSvg(emojiSvgs.happy1, INSIGHT_GREEN), color: INSIGHT_GREEN },
      { xml: tintSvg(emojiSvgs.happy2, INSIGHT_GREEN), color: INSIGHT_GREEN },
      { xml: tintSvg(emojiSvgs.happy1, INSIGHT_GREEN), color: INSIGHT_GREEN },
      { xml: tintSvg(emojiSvgs.happy2, INSIGHT_GREEN), color: INSIGHT_GREEN },
      { xml: tintSvg(emojiSvgs.happy1, INSIGHT_GREEN), color: INSIGHT_GREEN },
    ];

  const loadTodayCompletion = useCallback(async () => {
    const schedule = await StorageService.getSchedule();
    const dateKey = format(new Date(), 'yyyy-MM-dd');
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
    const ratio = total > 0 ? completed / total : 0;
    setTodayCompletionRatio(ratio);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTodayCompletion();
    }, [loadTodayCompletion]),
  );

  useEffect(() => {
    Animated.timing(todayProgressAnim, {
      toValue: todayCompletionRatio,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [todayCompletionRatio, todayProgressAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader centerIcon="lightbulb-outline" hideCalendar={true} hideCenterIcon={true} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Current Neurostates</Text>
          <Text style={styles.description}>A real-time snapshot of your mental and physical alignment.</Text>
          <Text style={styles.subtitle}>Daily Insights</Text>
        </View>

        <View style={styles.metricsGrid}>
          {metricCards.map(metric => (
            <View key={metric.label} style={styles.metricCard}>
              <View style={styles.metricTopRow}>
                <Text style={styles.metricEmoji}>{metric.emoji}</Text>
                <Text style={styles.metricLabel} numberOfLines={2}>
                  {metric.label}
                </Text>
              </View>
              <Text style={styles.metricValue}>{metric.value.toFixed(1)}</Text>
              <View style={styles.metricFooter}>
                <View style={styles.metricBarTrack}>
                  <View style={[styles.metricBarFill, { width: `${metric.value * 10}%`, backgroundColor: metric.color }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.weeklySection}>
          <Text style={styles.weeklyTitle}>Weekly Insights</Text>
          <View style={styles.weekRow}>
            <View style={styles.daysRow}>
              {weekDays.map((day, index) => {
                const isSelected = isSameDay(day, today);
                const isFuture = isAfter(day, today);
                const ratio = isFuture ? 0 : 1;
                const dashed = isFuture && ratio === 0;
                const size = 40;
                const strokeWidth = 5;
                const radius = (size - strokeWidth) / 2;
                const circumference = 2 * Math.PI * radius;
                const dashCount = 8;
                const dashLength = circumference / (dashCount * 2);
                const dashArray = `${dashLength} ${dashLength}`;
                const showEmoji = !isFuture;
                const emoji = weeklyEmojiOrder[index];
                const ringColor = showEmoji ? emoji.color : COLORS.success;

                return (
                  <View key={day.toISOString()} style={styles.dayItem}>
                    <View style={[styles.dayLetterPill, isSelected && styles.dayLetterPillActive]}>
                      <Text style={[styles.dayLetter, isSelected && styles.dayLetterActive]}>
                        {format(day, 'EEEEE')}
                      </Text>
                    </View>
                    <View style={styles.dayRingWrapper}>
                      <Svg width={size} height={size}>
                        <Circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke="#2A2A2A"
                          strokeWidth={strokeWidth}
                          fill="transparent"
                          strokeDasharray={dashed ? dashArray : undefined}
                          strokeLinecap={dashed ? 'round' : 'butt'}
                        />
                        {ratio > 0 && (
                          <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={ringColor}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={circumference * (1 - Math.min(1, ratio))}
                            strokeLinecap="round"
                            rotation={-90}
                            originX={size / 2}
                            originY={size / 2}
                          />
                        )}
                      </Svg>
                      <View style={styles.dayNumberWrap}>
                        {showEmoji ? (
                          <SvgXml xml={emoji.xml} width={18} height={18} />
                        ) : (
                          <Text style={styles.dayNumber}>+</Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.monthlySection}>
          <View style={styles.monthlyCard}>
            <View style={styles.monthlyHeader}>
              <TouchableOpacity style={styles.monthNavButton} onPress={() => setMonthlyMonth(addMonths(monthlyMonth, -1))}>
                <MaterialCommunityIcons name="chevron-left" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{format(monthlyMonth, 'MMM yyyy')}</Text>
              <TouchableOpacity style={styles.monthNavButton} onPress={() => setMonthlyMonth(addMonths(monthlyMonth, 1))}>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
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
                const entry = monthlyInsightMap[key as keyof typeof monthlyInsightMap];
                const isInMonth = isSameMonth(day, monthlyMonth);
                const isFuture = isAfter(day, monthlyToday);
                const isToday = isSameDay(day, monthlyToday);
                const hasEntry = Boolean(entry);
                const dashed = !isToday && (!hasEntry || isFuture);
                const ratio = isToday ? todayCompletionRatio : hasEntry && !isFuture ? entry.ratio : 0;
                const ringColor = isToday ? INSIGHT_GREEN : entry?.color ?? INSIGHT_GREEN;
                const numberColor = isInMonth ? COLORS.white : '#5C5C5C';

                return (
                  <View key={key} style={styles.monthDayCell}>
                    {isToday ? (
                      <View style={styles.monthRingWrapper}>
                        <Svg width={MONTH_CELL_SIZE} height={MONTH_CELL_SIZE}>
                          <Circle
                            cx={MONTH_CELL_SIZE / 2}
                            cy={MONTH_CELL_SIZE / 2}
                            r={monthRadius}
                            stroke={MONTH_TRACK_COLOR}
                            strokeWidth={MONTH_STROKE_WIDTH}
                            fill="transparent"
                          />
                          <AnimatedCircle
                            cx={MONTH_CELL_SIZE / 2}
                            cy={MONTH_CELL_SIZE / 2}
                            r={monthRadius}
                            stroke={ringColor}
                            strokeWidth={MONTH_STROKE_WIDTH}
                            fill="transparent"
                            strokeDasharray={`${monthCircumference} ${monthCircumference}`}
                            strokeDashoffset={todayDashOffset}
                            strokeLinecap="round"
                            rotation={-90}
                            originX={MONTH_CELL_SIZE / 2}
                            originY={MONTH_CELL_SIZE / 2}
                          />
                        </Svg>
                        <View style={styles.monthNumberWrap}>
                          <Text style={styles.monthDayNumber}>{format(day, 'd')}</Text>
                        </View>
                      </View>
                    ) : (
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
                          {ratio > 0 && (
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
                          )}
                        </Svg>
                        <View style={styles.monthNumberWrap}>
                          <Text style={[styles.monthDayNumber, { color: numberColor }]}>
                            {format(day, 'd')}
                          </Text>
                        </View>
                      </View>
                    )}
                    {isToday && <Text style={styles.monthTodayLabel}>Today</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.reflectionsRow}>
          {reflectionChips.map(chip => (
            <TouchableOpacity key={chip.label} style={[styles.reflectionChip, { backgroundColor: chip.color }]}>
              <MaterialCommunityIcons name={chip.icon as any} size={14} color={COLORS.white} />
              <Text style={styles.reflectionText}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  headerBlock: {
    marginTop: SPACING.s,
  },
  title: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '700',
  },
  description: {
    color: '#C9C9C9',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  subtitle: {
    color: '#E7E7E7',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: GRID_GAP,
    rowGap: GRID_GAP,
    marginHorizontal: 0,
    marginTop: 0,
  },
  metricCard: {
    width: METRIC_CARD_SIZE,
    height: METRIC_CARD_SIZE,
    backgroundColor: '#0B0B0B',
    borderRadius: 32,
    padding: 14,
    borderWidth: 1,
    borderColor: '#535353',
    justifyContent: 'flex-start',
    paddingTop: 18,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  metricEmoji: {
    fontSize: 9,
  },
  metricLabel: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
    lineHeight: 11,
  },
  metricValue: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 24,
    alignSelf: 'flex-start',
  },
  metricFooter: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
    width: '100%',
  },
  metricBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#535353',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  weeklySection: {
    marginTop: 36,
  },
  weeklyTitle: {
    color: '#E7E7E7',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
    textAlign: 'center',
    marginBottom: 6,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    gap: 16,
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
    backgroundColor: '#6FB38C',
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
  dayNumber: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
  },
  monthlySection: {
    marginTop: 12,
  },
  monthlyCard: {
    backgroundColor: '#0B0B0B',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 10,
  },
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  monthNavButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  monthDayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  monthDayLabel: {
    color: '#5C5C5C',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    width: '14.28%',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  monthDayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 46,
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
  monthDayNumber: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  monthTodayCircle: {
    width: MONTH_CELL_SIZE,
    height: MONTH_CELL_SIZE,
    borderRadius: MONTH_CELL_SIZE / 2,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTodayLabel: {
    color: INSIGHT_GREEN,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  reflectionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: SPACING.l,
    marginBottom: SPACING.l,
  },
  reflectionChip: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(254,248,239,0.18)',
  },
  reflectionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

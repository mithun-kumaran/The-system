import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { HomeHeader } from '../components/HomeHeader';
import { StorageService } from '../services/storage';
import { UserProfile } from '../types';
import Svg, { Circle, G, SvgUri } from 'react-native-svg';

const fallbackProfile: UserProfile = {
  name: 'You',
  gender: 'other',
  dob: new Date().toISOString(),
  notificationsEnabled: false,
  calendarEnabled: false,
  locationEnabled: false,
  isOnboardingCompleted: true,
  xp: 42,
  rank: 'Iron I',
  streak: 3,
};

type LeaderboardEntry = {
  name: string;
  xp: number;
  streak: number;
  avatarColor: string;
};

const baseLeaderboardGlobal: LeaderboardEntry[] = [
  { name: 'Leo Wilson', xp: 85, streak: 103, avatarColor: '#E7E5A1' },
  { name: 'Maya Black', xp: 72, streak: 103, avatarColor: '#6B6B6B' },
  { name: 'Avery McKinney', xp: 62, streak: 58, avatarColor: '#B1882B' },
  { name: 'Nora Warren', xp: 58, streak: 44, avatarColor: '#8B6AB5' },
  { name: 'Mitu Kitu', xp: 47, streak: 23, avatarColor: '#DCEBCF' },
  { name: 'Sam Cooper', xp: 45, streak: 76, avatarColor: '#FFD7DB' },
  { name: 'Aisha Flores', xp: 44, streak: 42, avatarColor: '#FFD2B8' },
  { name: 'Marcus McCoy', xp: 44, streak: 87, avatarColor: '#9FD7C1' },
  { name: 'Ivy Hart', xp: 41, streak: 33, avatarColor: '#C7C7C7' },
  { name: 'Jude Park', xp: 39, streak: 28, avatarColor: '#9DB7D8' },
];

const baseLeaderboardCurrent: LeaderboardEntry[] = [
  { name: 'Dante Quinn', xp: 91, streak: 64, avatarColor: '#E7E5A1' },
  { name: 'Zara Cole', xp: 79, streak: 52, avatarColor: '#6B6B6B' },
  { name: 'Kai Mendoza', xp: 70, streak: 49, avatarColor: '#B1882B' },
  { name: 'Iris Shaw', xp: 61, streak: 46, avatarColor: '#8B6AB5' },
  { name: 'Hugo Reed', xp: 56, streak: 40, avatarColor: '#DCEBCF' },
  { name: 'Mina Park', xp: 53, streak: 39, avatarColor: '#FFD7DB' },
  { name: 'Owen Cruz', xp: 50, streak: 36, avatarColor: '#FFD2B8' },
  { name: 'Tariq Noor', xp: 48, streak: 33, avatarColor: '#9FD7C1' },
  { name: 'Elise Moon', xp: 44, streak: 31, avatarColor: '#C7C7C7' },
  { name: 'Rowan Gale', xp: 42, streak: 29, avatarColor: '#9DB7D8' },
];

const baseLeaderboardDaily: LeaderboardEntry[] = [
  { name: 'Ravi Singh', xp: 78, streak: 120, avatarColor: '#E7E5A1' },
  { name: 'Lina Patel', xp: 71, streak: 97, avatarColor: '#6B6B6B' },
  { name: 'Sage Kim', xp: 66, streak: 84, avatarColor: '#B1882B' },
  { name: 'Miles Reed', xp: 61, streak: 72, avatarColor: '#8B6AB5' },
  { name: 'Tia Brooks', xp: 58, streak: 61, avatarColor: '#DCEBCF' },
  { name: 'Bea Stone', xp: 55, streak: 55, avatarColor: '#FFD7DB' },
  { name: 'Noel Price', xp: 51, streak: 49, avatarColor: '#FFD2B8' },
  { name: 'Juno Vale', xp: 49, streak: 42, avatarColor: '#9FD7C1' },
  { name: 'Cass Lee', xp: 46, streak: 36, avatarColor: '#C7C7C7' },
  { name: 'Eli Ford', xp: 43, streak: 31, avatarColor: '#9DB7D8' },
];

export const HealthScreen = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'current' | 'daily'>('current');

  useEffect(() => {
    let mounted = true;
    StorageService.getUserProfile().then(user => {
      if (mounted && user) {
        setProfile(user);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const currentUser = profile ?? fallbackProfile;

  const globalLeaderboard = baseLeaderboardGlobal;
  const currentRankLeaderboardSource = baseLeaderboardCurrent;
  const dailyLeaderboardSource = baseLeaderboardDaily;

  const rankOrder = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'ascendant', 'immortal', 'radiant'];
  const getRankKey = (rank: string) => {
    const lowered = rank.toLowerCase();
    const match = rankOrder.find(key => lowered.includes(key));
    return match ?? 'iron';
  };
  const rankIconMap: Record<string, any> = {
    iron: require('../../assets/Rank Icons/Iron 1.png'),
    bronze: require('../../assets/Rank Icons/Bronze 1.png'),
    silver: require('../../assets/Rank Icons/Silver 1.png'),
    gold: require('../../assets/Rank Icons/Gold 1.png'),
    platinum: require('../../assets/Rank Icons/Platinum 1.png'),
    diamond: require('../../assets/Rank Icons/Diamond 1.png'),
    ascendant: require('../../assets/Rank Icons/Ascendant 1.png'),
    immortal: require('../../assets/Rank Icons/Immortal 1.png'),
    radiant: require('../../assets/Rank Icons/Radiant.png'),
  };

  const currentRankLeaderboard = currentRankLeaderboardSource;
  const dailyLeaderboard = dailyLeaderboardSource;

  const tabs = [
    { key: 'global', label: 'GLOBAL' },
    { key: 'current', label: 'CURRENT' },
    { key: 'daily', label: 'DAILY' },
  ] as const;

  const visibleLeaderboard =
    activeTab === 'global' ? globalLeaderboard : activeTab === 'daily' ? dailyLeaderboard : currentRankLeaderboard;

  const xpIconUri = Image.resolveAssetSource(require('../../assets/XP ICON.svg')).uri;
  const coinIconUri = Image.resolveAssetSource(require('../../assets/COIN ICON.svg')).uri;
  const medal1Png = require('../../assets/1medal ribbons.png');
  const medal2Png = require('../../assets/2medal ribbons.png');
  const medal3Png = require('../../assets/3medal ribbons.png');
  const crownIcon = require('../../assets/crown icon.png');
  const fireIcon = require('../../assets/FIRE ALONE.png');
  const medalRibbonMap: Record<number, any> = {
    1: medal1Png,
    2: medal2Png,
    3: medal3Png,
  };
  const rankBadgeColors = ['#F0E59E', '#7A7A7A', '#B1882B', '#8B6AB5', '#DCEBCF', '#FFD7DB', '#FFD2B8', '#9FD7C1', '#C7C7C7', '#9DB7D8'];

  const rrpValue = 65;
  const ringSize = 220;
  const ringStroke = 16;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = Math.min(1, rrpValue / 100);
  const ringOffset = ringCircumference * (1 - ringProgress);
  const rankKey = getRankKey(currentUser.rank || 'Iron I');
  const rankImage = rankIconMap[rankKey];
  const animatedRingOffset = React.useRef(new Animated.Value(ringOffset)).current;
  const AnimatedCircle = React.useMemo(() => Animated.createAnimatedComponent(Circle), []);

  useEffect(() => {
    Animated.timing(animatedRingOffset, {
      toValue: ringOffset,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedRingOffset, ringOffset]);

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader centerIcon="trophy-outline" hideCalendar={true} hideCenterIcon={true} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Leaderboard</Text>
        </View>
        <View style={styles.ringWrap}>
          <View style={styles.ringContainer}>
            <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
              <G rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`}>
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke="#282828"
                  strokeWidth={ringStroke}
                  fill="transparent"
                />
                <AnimatedCircle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke="#88C29A"
                  strokeWidth={ringStroke}
                  fill="transparent"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={animatedRingOffset}
                  strokeLinecap="round"
                />
              </G>
            </Svg>
            <View style={styles.ringContent}>
              <View style={styles.rrpPill}>
                <Text style={styles.rrpText}>RRP</Text>
              </View>
              <Text style={styles.rrpValue}>{rrpValue}</Text>
              <View style={styles.rankIconCircle}>
                <Image source={rankImage} style={styles.rankIcon} />
              </View>
              <Text style={styles.rankLabel}>{(currentUser.rank || 'Iron I').toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={styles.tabsRow}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text numberOfLines={1} style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.list}>
          {visibleLeaderboard.map((user, index) => {
            const rankNumber = index + 1;
            const isTop = rankNumber === 1;
            const isMedal = rankNumber <= 3;
            const isCurrentUser = user.name === currentUser.name;
            const coinValue = 300;
            return (
              <View key={`${user.name}-${index}`} style={[styles.row, isTop ? styles.rowTop : styles.rowDefault]}>
                <View style={styles.avatarColumn}>
                  <View style={[styles.avatarCircle, { backgroundColor: user.avatarColor }]}>
                    {isTop && <Image source={crownIcon} style={styles.crownIcon} />}
                  </View>
                </View>
                <View style={styles.userInfo}>
                  <Text
                    style={[
                      styles.userName,
                      isTop && styles.userNameDark,
                      isCurrentUser && styles.userNameCurrent,
                    ]}
                  >
                    {user.name}
                  </Text>
                  <View style={styles.statRow}>
                    <View style={[styles.statPill, isTop && styles.statPillLight]}>
                      <Image source={fireIcon} style={styles.statIcon} />
                      <Text style={[styles.statText, isTop && styles.statTextDark]}>
                        {String(user.streak).padStart(3, '0')}
                      </Text>
                    </View>
                    <View style={[styles.statPill, isTop && styles.statPillLight]}>
                      <SvgUri uri={xpIconUri} width={12} height={12} />
                      <Text style={[styles.statText, isTop && styles.statTextDark]}>
                        {String(user.xp).padStart(3, '0')}
                      </Text>
                    </View>
                    <View style={[styles.statPill, isTop && styles.statPillLight]}>
                      <SvgUri uri={coinIconUri} width={12} height={12} />
                      <Text style={[styles.statText, isTop && styles.statTextDark]}>
                        {String(coinValue).padStart(3, '0')}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rankBadgeWrap}>
                  {isMedal ? (
                    <>
                      <Image source={medalRibbonMap[rankNumber]} style={styles.medalRibbon} />
                      <View style={[styles.rankBadgeCircleMedal, { backgroundColor: rankBadgeColors[index] }]}>
                        <Text style={[styles.rankBadgeTextCircle, isCurrentUser && styles.rankBadgeTextCurrent]}>
                          {rankNumber}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={[styles.rankBadgeCircle, { backgroundColor: rankBadgeColors[index] }]}>
                      <Text style={[styles.rankBadgeTextCircle, isCurrentUser && styles.rankBadgeTextCurrent]}>
                        {rankNumber}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
    marginTop: 10,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
  },
  headerBlock: {
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '700',
  },
  ringWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  ringContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  rrpPill: {
    backgroundColor: '#CBEAD3',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 2,
  },
  rrpText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rrpValue: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 6,
  },
  rankIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  rankIcon: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  rankLabel: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 22,
    paddingHorizontal: 6,
  },
  tabPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#88C29A',
    borderColor: '#FEF8EF',
  },
  tabLabel: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Circular Std Black',
    letterSpacing: 2,
  },
  tabLabelActive: {
    color: '#000000',
  },
  list: {
    marginTop: 18,
    gap: 10,
    width: '100%',
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: '#535353',
  },
  rowTop: {
    backgroundColor: '#F2F2F2',
  },
  rowDefault: {
    backgroundColor: '#111111',
  },
  avatarColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownIcon: {
    position: 'absolute',
    width: 34,
    height: 34,
    resizeMode: 'contain',
    top: -14,
    left: -10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  userNameCurrent: {
    color: '#88C29A',
  },
  userNameDark: {
    color: '#111111',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#1B1B1B',
  },
  statPillLight: {
    backgroundColor: '#EFEFEF',
    borderColor: '#E5E5E5',
  },
  statIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
  },
  statText: {
    color: '#E5E5E5',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
  },
  statTextDark: {
    color: '#111111',
  },
  rankBadgeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
  },
  rankBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeCircleMedal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 4,
  },
  medalRibbon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginTop: 20,
  },
  rankBadgeTextMedal: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '700',
    position: 'absolute',
  },
  rankBadgeTextCircle: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '700',
  },
  rankBadgeTextCurrent: {
    color: '#88C29A',
  },
});

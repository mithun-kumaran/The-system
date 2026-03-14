import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Svg, Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { UserProfile } from '../types';

interface RankCardProps {
  user: UserProfile;
  onSettingsPress?: () => void;
  showSettings?: boolean;
  showProfilePill?: boolean;
  layout?: 'row' | 'center';
  size?: number;
  strokeWidth?: number;
  rankImageSource?: ImageSourcePropType;
}

export const RankCard = ({
  user,
  onSettingsPress,
  showSettings = true,
  showProfilePill = true,
  layout = 'row',
  size = 80,
  strokeWidth = 6,
  rankImageSource,
}: RankCardProps) => {
  // Calculate Progress
  // Assuming Iron I is 0-100, so progress is just xp % 100 / 100
  // Or simply user.xp / 100 if we reset XP each level.
  // The user prompt said: "once it reaches 100 it goes up a new rank".
  // So progress = (user.xp % 100) / 100.
  // Actually, if we reset XP in storage.ts, then user.xp IS the progress (0-99).
  
  const progress = (user.xp || 0) / 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  const getNextRank = (currentRank: string) => {
      // Simple logic
      if (currentRank === 'Iron I') return 'Iron II';
      if (currentRank === 'Iron II') return 'Iron III';
      return 'Next Rank';
  };

  return (
    <View style={[styles.container, layout === 'center' && styles.containerCenter]}>
      {showProfilePill && (
        <View style={styles.profilePill}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={COLORS.white} />
          </View>
          <View style={styles.profileInfo}>
              <Text style={styles.name}>{user.name || 'User'}</Text>
              <Text style={styles.date}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
          <View style={styles.streakContainer}>
              <Text style={styles.streakText}>🔥 {user.streak || 0}</Text>
          </View>
        </View>
      )}

      {layout === 'row' && <View style={{ flex: 1 }} />}

      <View style={[styles.rightSection, layout === 'center' && styles.rightSectionCenter]}>
        <View style={[styles.rankContainer, layout === 'center' && styles.rankContainerCenter]}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#333"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={COLORS.primary} // Green
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </G>
            </Svg>
            
            <View style={styles.rankContent}>
                <View style={styles.rankIconPlaceholder}>
                     {rankImageSource ? (
                       <Image source={rankImageSource} style={styles.rankImage} />
                     ) : (
                       <Ionicons name="shield" size={24} color={COLORS.textDim} />
                     )}
                </View>
                <Text style={styles.rankTitle}>{user.rank || 'Iron I'}</Text>
                <Text style={styles.nextRank}>Next: {getNextRank(user.rank || 'Iron I')}</Text>
                <Text style={styles.xpText}>{Math.floor(user.xp || 0)}/100</Text>
            </View>
        </View>

        {showSettings && onSettingsPress && (
          <TouchableOpacity onPress={onSettingsPress} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  containerCenter: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface, // Dark grey pill
    borderRadius: 30,
    padding: SPACING.s,
    paddingRight: SPACING.m,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary, // Green
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.s,
  },
  profileInfo: {
    marginRight: SPACING.m,
  },
  name: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.body,
  },
  date: {
    color: COLORS.textDim,
    fontSize: 10,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  rightSection: {
      flexDirection: 'row',
      alignItems: 'flex-start', // Align to top
  },
  rightSectionCenter: {
      alignItems: 'center',
  },
  rankContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.s,
  },
  rankContainerCenter: {
      marginRight: 0,
  },
  rankContent: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
  },
  rankIconPlaceholder: {
      marginBottom: 2,
  },
  rankImage: {
      width: 32,
      height: 32,
      resizeMode: 'contain',
  },
  rankTitle: {
      color: COLORS.white,
      fontSize: 10,
      fontWeight: 'bold',
  },
  nextRank: {
      color: COLORS.primary,
      fontSize: 8,
  },
  xpText: {
      color: COLORS.white,
      fontSize: 10,
      fontWeight: 'bold',
  },
  settingsButton: {
      marginTop: 0,
  }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { StorageService } from '../services/storage';
import { useFocusEffect } from '@react-navigation/native';

export const ProfileHeader = () => {
  const [name, setName] = useState('User');
  const [streak, setStreak] = useState(0);

  const loadProfile = async () => {
    const profile = await StorageService.getUserProfile();
    if (profile && profile.name) {
      setName(profile.name);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
           <MaterialCommunityIcons name="account" size={24} color={COLORS.white} />
      </View>
      <View style={styles.profileText}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.dateText}>{format(new Date(), 'd MMM, yyyy')}</Text>
      </View>
      <View style={styles.streakContainer}>
          <MaterialCommunityIcons name="fire" size={16} color={COLORS.white} />
          <Text style={styles.streakText}>{streak}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E', // Surface color
    padding: SPACING.s,
    borderRadius: 30, // Pill shape
    alignSelf: 'flex-start', // Compact, left-aligned
    paddingRight: SPACING.l,
    marginBottom: SPACING.l,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 14, // Squircle-ish
    backgroundColor: COLORS.success, // Green
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.s,
  },
  profileText: {
    marginRight: SPACING.l,
  },
  profileName: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  dateText: {
    color: '#8E8E93', // TextDim
    fontSize: 10,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

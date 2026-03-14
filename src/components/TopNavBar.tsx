import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PressScale = ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <AnimatedTouchable
      onPress={onPress}
      activeOpacity={0.9}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
      }}
      style={{ transform: [{ scale }] }}
    >
      {children}
    </AnimatedTouchable>
  );
};

interface Props {
  centerIcon?: string;
  onSettingsPress?: () => void;
}

export const TopNavBar = ({ centerIcon = 'bulb-outline', onSettingsPress }: Props) => {
  const navigation = useNavigation<any>();

  const handleSettings = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      navigation.navigate('Settings');
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ width: 24 }} />
      
      <MaterialCommunityIcons name={centerIcon as any} size={24} color={COLORS.white} />
      
      <PressScale onPress={handleSettings}>
        <Ionicons name="settings-outline" size={24} color={COLORS.white} />
      </PressScale>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.l,
    paddingHorizontal: SPACING.s,
  },
});

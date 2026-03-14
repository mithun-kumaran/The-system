import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { TimeBlock } from '../types';

interface TimelineItemProps {
  item: TimeBlock;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TimelineItem = ({ item, onToggle, onDelete }: TimelineItemProps) => {
  const isCompleted = item.isCompleted;

  const renderRightActions = () => {
      if (!onDelete) return null;
      
      return (
          <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => onDelete(item.id)}
          >
              <Ionicons name="trash-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
      );
  };

  return (
    <View style={styles.wrapper}>
        <Swipeable renderRightActions={renderRightActions}>
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => onToggle(item.id)} 
                style={[styles.container, isCompleted && styles.completedContainer]}
            >
            <View style={styles.timeContainer}>
                <Text style={styles.startTime}>{item.startTime}</Text>
                <Text style={styles.endTime}>{item.endTime}</Text>
            </View>
            
            <View style={styles.contentContainer}>
                <Text style={[styles.title, isCompleted && styles.completedText]}>{item.title}</Text>
                {item.isHabit && (
                    <View style={styles.tagContainer}>
                        <View style={[styles.tagDot, { backgroundColor: item.tagColor || COLORS.primary }]} />
                        <Text style={styles.tagText}>{item.habitType || 'Habit'}</Text>
                    </View>
                )}
            </View>

            <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
                {isCompleted && <Ionicons name="checkmark" size={16} color={COLORS.background} />}
            </View>
            </TouchableOpacity>
        </Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
      marginBottom: SPACING.s,
      backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  deleteButton: {
      backgroundColor: COLORS.danger,
      justifyContent: 'center',
      alignItems: 'center',
      width: 70,
      height: '100%',
      borderRadius: 12,
      marginLeft: SPACING.s,
  },

  completedContainer: {
      opacity: 0.6,
      borderLeftColor: COLORS.textDim,
  },
  timeContainer: {
    marginRight: SPACING.m,
    alignItems: 'center',
    width: 50,
  },
  startTime: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.body,
  },
  endTime: {
    color: COLORS.textDim,
    fontSize: 10,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.white,
    fontSize: FONTS.body,
    fontWeight: '500',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textDim,
  },
  tagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
  },
  tagDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
  },
  tagText: {
      color: COLORS.textDim,
      fontSize: 10,
      textTransform: 'capitalize',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});

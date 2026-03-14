import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';

interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const DateStrip = ({ selectedDate, onSelectDate }: DateStripProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(selectedDate));

  useEffect(() => {
    setCurrentWeekStart(startOfWeek(selectedDate));
  }, [selectedDate]);

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  const handlePrevWeek = () => {
    const newStart = subWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newStart);
    // Optionally select the same day in the previous week?
    // onSelectDate(subWeeks(selectedDate, 1)); 
  };

  const handleNextWeek = () => {
    const newStart = addWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newStart);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePrevWeek} style={styles.arrowButton}>
        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
      </TouchableOpacity>

      <View style={styles.daysContainer}>
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <TouchableOpacity 
              key={day.toISOString()} 
              style={styles.dayItem} 
              onPress={() => onSelectDate(day)}
            >
              {isToday && <Text style={styles.todayLabel}>Today</Text>}
              <View style={[styles.dayCircle, isSelected && styles.selectedDayCircle]}>
                <Text style={[styles.dayLetter, isSelected && styles.selectedDayText]}>
                  {format(day, 'EEEEE')}
                </Text>
              </View>
              <Text style={styles.dayNumber}>{format(day, 'd')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity onPress={handleNextWeek} style={styles.arrowButton}>
        <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.s,
    marginBottom: SPACING.l,
  },
  arrowButton: {
    padding: SPACING.s,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: SPACING.s,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayLabel: {
    color: COLORS.primary,
    fontSize: 8,
    position: 'absolute',
    top: -12,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedDayCircle: {
    backgroundColor: COLORS.primary,
  },
  dayLetter: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: COLORS.background, // Black text on green circle
  },
  dayNumber: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
});

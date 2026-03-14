import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { TimeBlock } from '../types';

interface RoutineItemProps {
  item: TimeBlock;
  onToggleStep: (id: string, stepId: string) => void;
  onDelete?: (id: string) => void;
}

export const RoutineItem = ({ item, onToggleStep, onDelete }: RoutineItemProps) => {
  const total = item.steps?.length || 0;
  const done = item.steps?.filter(s => s.isDone).length || 0;

  const renderRightActions = () => {
    if (!onDelete) return null;
    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
        <Ionicons name="trash-outline" size={24} color={COLORS.white} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <Swipeable renderRightActions={renderRightActions}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.progress}>{done}/{total}</Text>
          </View>
          {item.steps?.map((step) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepOrder}>
                <Text style={styles.stepOrderText}>
                  {(item.steps?.findIndex(s => s.id === step.id) || 0) + 1}
                </Text>
              </View>
              <Text style={styles.stepLabel}>{step.label}</Text>
              <TouchableOpacity 
                style={[styles.stepCheck, step.isDone && styles.stepCheckDone]}
                onPress={() => onToggleStep(item.id, step.id)}
              >
                {step.isDone && <Ionicons name="checkmark" size={16} color={COLORS.background} />}
              </TouchableOpacity>
            </View>
          ))}
        </View>
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
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  title: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONTS.body,
  },
  progress: {
    color: COLORS.textDim,
    fontSize: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepOrder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.s,
  },
  stepOrderText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  stepLabel: {
    flex: 1,
    color: COLORS.white,
  },
  stepCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
});


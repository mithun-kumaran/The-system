import { parse, format, differenceInSeconds, startOfDay, addDays, isBefore, isAfter } from 'date-fns';

export const getTodayDateFromTimeString = (timeString: string, referenceDate: Date = new Date()): Date => {
  return parse(timeString, 'HH:mm', referenceDate);
};

export const formatTimeRemaining = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

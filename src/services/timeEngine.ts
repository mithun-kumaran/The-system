import { TimeBlock, NowState } from '../types';
import { getTodayDateFromTimeString } from '../utils/timeUtils';
import { differenceInSeconds, isBefore, isAfter, startOfDay, addDays } from 'date-fns';

export const TimeEngine = {
  evaluate(schedule: TimeBlock[], currentTime: Date = new Date()): NowState {
    const sortedSchedule = [...schedule].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    let currentBlock: TimeBlock | null = null;
    let nextBlock: TimeBlock | null = null;
    let secondsRemaining = 0;
    let totalDuration = 0;
    let status: NowState['status'] = 'free';

    // Check for current block
    for (const block of sortedSchedule) {
      const start = getTodayDateFromTimeString(block.startTime, currentTime);
      const end = getTodayDateFromTimeString(block.endTime, currentTime);
      
      // Handle case where end time is smaller than start time (overnight, though we assume simple day for now)
      // If we assume strict daily schedule, we ignore overnight complexity for MVP unless needed.
      
      if (currentTime >= start && currentTime < end) {
        currentBlock = block;
        secondsRemaining = differenceInSeconds(end, currentTime);
        totalDuration = differenceInSeconds(end, start);
        status = block.type === 'break' ? 'break' : 'active';
        break;
      }
    }

    // Find next block
    if (currentBlock) {
      // Next block is the one starting immediately after current, or the first one starting after current ends
      // Since it's sorted, we can just look for the first one with startTime >= currentBlock.endTime
      nextBlock = sortedSchedule.find(b => b.startTime >= currentBlock!.endTime) || null;
      
      // If no block later today, maybe the first one tomorrow?
      if (!nextBlock && sortedSchedule.length > 0) {
          nextBlock = sortedSchedule[0]; // First block of next day
      }
    } else {
      // If no current block, we are in a "gap" or "free" time.
      // Next block is the first one with startTime > currentTime
      // We need to compare strings "HH:mm" vs currentTime formatted
      const timeString = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0');
      
      nextBlock = sortedSchedule.find(b => b.startTime > timeString) || null;

      if (nextBlock) {
        const nextStart = getTodayDateFromTimeString(nextBlock.startTime, currentTime);
        secondsRemaining = differenceInSeconds(nextStart, currentTime);
        totalDuration = 0; // Or duration of gap?
      } else {
        // No more blocks today. Next is first of tomorrow.
        if (sortedSchedule.length > 0) {
          nextBlock = sortedSchedule[0];
          const nextStart = getTodayDateFromTimeString(nextBlock.startTime, currentTime);
          // Add 24 hours to nextStart since it's tomorrow
          const tomorrowStart = addDays(nextStart, 1);
          secondsRemaining = differenceInSeconds(tomorrowStart, currentTime);
        }
      }
    }

    return {
      status,
      currentBlock: currentBlock || null,
      nextBlock: nextBlock || null,
      secondsRemaining,
      totalDuration
    };
  }
};

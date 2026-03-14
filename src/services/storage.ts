import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { TimeBlock, LogEntry, UserProfile, DailyMetricsEntry, DailyCompletionEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { supabase } from '../lib/supabase';

const KEYS = {
  SCHEDULE: '@now_app_schedule',
  LOGS: '@now_app_logs',
  USER_PROFILE: '@now_app_user_profile',
  HABITS: '@now_app_habits',
  ROUTINES: '@now_app_routines',
  DAILY_METRICS: '@now_app_daily_metrics',
  DAILY_COMPLETION: '@now_app_daily_completion',
  COMMUNITY_FOLLOWS: '@now_app_community_follows',
  POST_LIKES: '@now_app_post_likes',
  POST_LOCATIONS: '@now_app_post_locations',
  CHAT_HISTORY: '@now_app_chat_history',
  CHAT_SESSIONS: '@now_app_chat_sessions',
  ACTIVE_CHAT_SESSION: '@now_app_active_chat_session',
};

const parseTime = (time: string | undefined) => {
  if (!time) return null;
  const parts = time.split(':');
  if (parts.length !== 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
};

const buildDateTime = (date: string | undefined, time: string | undefined) => {
  if (!date) return null;
  const dateParts = date.split('-').map(Number);
  if (dateParts.length !== 3) return null;
  const [year, month, day] = dateParts;
  if (!year || !month || !day) return null;
  const parsedTime = parseTime(time);
  if (!parsedTime) return null;
  const result = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0, 0);
  if (Number.isNaN(result.getTime())) return null;
  return result;
};

const isAllDayBlock = (block: TimeBlock) =>
  !!block.isLater || (block.source === 'calendar' && block.startTime === '00:00' && block.endTime === '23:59');

const scheduleTaskReminders = async (schedule: TimeBlock[], enabled: boolean) => {
  const Notifications = await import('expo-notifications');
  if (!enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    return;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#28CA99',
    });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = new Date();
  const minLeadMs = 60 * 1000;
  for (const block of schedule) {
    if (block.isDeleted || block.isCompleted || isAllDayBlock(block)) continue;
    if (!block.startTime) continue;
    const offsetMinutes = 15;
    const bodyText = 'Starts in 15 minutes.';
    if (block.date) {
      const startDate = buildDateTime(block.date, block.startTime);
      if (!startDate) continue;
      const reminderDate = new Date(startDate.getTime() - offsetMinutes * 60 * 1000);
      if (reminderDate.getTime() - now.getTime() <= minLeadMs) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: block.title,
          body: bodyText,
          data: { taskId: block.id },
        },
        trigger: { date: reminderDate, channelId: 'task-reminders' },
      });
      continue;
    }
    const parsedTime = parseTime(block.startTime);
    if (!parsedTime) continue;
    const totalMinutes = parsedTime.hours * 60 + parsedTime.minutes;
    const reminderMinutes = (totalMinutes - offsetMinutes + 1440) % 1440;
    const reminderHour = Math.floor(reminderMinutes / 60);
    const reminderMinute = reminderMinutes % 60;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: block.title,
        body: bodyText,
        data: { taskId: block.id },
      },
      trigger: { hour: reminderHour, minute: reminderMinute, repeats: true, channelId: 'task-reminders' },
    });
  }
};

// Default schedule for first launch
const DEFAULT_SCHEDULE: TimeBlock[] = [
  { id: '1', title: 'Wake Up', startTime: '07:00', endTime: '07:30', type: 'routine' },
  { id: '2', title: 'Sleep Time', startTime: '22:00', endTime: '23:00', type: 'routine' },
];

export const StorageService = {
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      if (jsonValue != null) {
        const profile = JSON.parse(jsonValue);
        // Migration for new fields
        return {
          ...profile,
          notificationsEnabled: profile.notificationsEnabled ?? false,
          calendarEnabled: profile.calendarEnabled ?? false,
          locationEnabled: profile.locationEnabled ?? false,
          homeAddress: profile.homeAddress ?? undefined,
          homePostcode: profile.homePostcode ?? undefined,
          homeHouseNumber: profile.homeHouseNumber ?? undefined,
          homePlaceId: profile.homePlaceId ?? undefined,
          homeLatitude: profile.homeLatitude ?? undefined,
          homeLongitude: profile.homeLongitude ?? undefined,
          homeVerifiedAt: profile.homeVerifiedAt ?? undefined,
          lastKnownLatitude: profile.lastKnownLatitude ?? undefined,
          lastKnownLongitude: profile.lastKnownLongitude ?? undefined,
          lastKnownAt: profile.lastKnownAt ?? undefined,
          commuteBufferMinutes: profile.commuteBufferMinutes ?? 10,
          backgroundLocationEnabled: profile.backgroundLocationEnabled ?? false,
          xp: profile.xp ?? 0,
          rank: profile.rank ?? 'Iron I',
          streak: profile.streak ?? 0,
        };
      }
      return null;
    } catch (e) {
      console.error('Failed to load user profile', e);
      return null;
    }
  },

  async addXP(amount: number): Promise<UserProfile | null> {
      const profile = await this.getUserProfile();
      if (!profile) return null;

      let newXP = (profile.xp || 0) + amount;
      let newRank = profile.rank || 'Iron I';

      // Simple Rank Logic
      // Iron I: 0-100
      // Iron II: 101-200
      // Iron III: 201-300
      // etc.
      if (newXP >= 100 && newRank === 'Iron I') {
          newRank = 'Iron II';
          newXP = newXP - 100; // Reset for next level? Or keep cumulative?
          // The image shows "75/100", so it's likely "Current Level Progress".
          // If I reset it, it's easier to render.
      } else if (newXP >= 100 && newRank === 'Iron II') {
          newRank = 'Iron III';
          newXP = newXP - 100;
      }

      const updatedProfile = { ...profile, xp: newXP, rank: newRank };
      await this.saveUserProfile(updatedProfile);
      return updatedProfile;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const jsonValue = JSON.stringify(profile);
      await AsyncStorage.setItem(KEYS.USER_PROFILE, jsonValue);
      const schedule = await this.getSchedule();
      await scheduleTaskReminders(schedule, profile.notificationsEnabled);
    } catch (e) {
      console.error('Failed to save user profile', e);
    }
  },

  async getSchedule(): Promise<TimeBlock[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.SCHEDULE);
      if (jsonValue != null) {
        return JSON.parse(jsonValue);
      }
      // Initialize with default if empty
      await this.saveSchedule(DEFAULT_SCHEDULE);
      return DEFAULT_SCHEDULE;
    } catch (e) {
      console.error('Failed to load schedule', e);
      return [];
    }
  },

  async saveSchedule(schedule: TimeBlock[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(schedule);
      await AsyncStorage.setItem(KEYS.SCHEDULE, jsonValue);
      const profile = await this.getUserProfile();
      await scheduleTaskReminders(schedule, profile?.notificationsEnabled ?? false);
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
  },

  async syncTaskReminders(schedule?: TimeBlock[], notificationsEnabled?: boolean): Promise<void> {
    const nextSchedule = schedule ?? (await this.getSchedule());
    const profile = await this.getUserProfile();
    const enabled = notificationsEnabled ?? profile?.notificationsEnabled ?? false;
    await scheduleTaskReminders(nextSchedule, enabled);
  },

  async getLogs(): Promise<LogEntry[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.LOGS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to load logs', e);
      return [];
    }
  },

  async getChatHistory(): Promise<Array<{ id: string; role: 'user' | 'assistant'; text: string }>> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.CHAT_HISTORY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to load chat history', e);
      return [];
    }
  },

  async saveChatHistory(messages: Array<{ id: string; role: 'user' | 'assistant'; text: string }>): Promise<void> {
    try {
      const jsonValue = JSON.stringify(messages);
      await AsyncStorage.setItem(KEYS.CHAT_HISTORY, jsonValue);
    } catch (e) {
      console.error('Failed to save chat history', e);
    }
  },

  async getChatSessions(): Promise<Array<{ id: string; title: string; updatedAt: number }>> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.CHAT_SESSIONS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to load chat sessions', e);
      return [];
    }
  },

  async saveChatSessions(sessions: Array<{ id: string; title: string; updatedAt: number }>): Promise<void> {
    try {
      const jsonValue = JSON.stringify(sessions);
      await AsyncStorage.setItem(KEYS.CHAT_SESSIONS, jsonValue);
    } catch (e) {
      console.error('Failed to save chat sessions', e);
    }
  },

  async getChatSessionMessages(sessionId: string): Promise<Array<{ id: string; role: 'user' | 'assistant'; text: string }>> {
    try {
      const jsonValue = await AsyncStorage.getItem(`${KEYS.CHAT_SESSIONS}:${sessionId}`);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to load chat session messages', e);
      return [];
    }
  },

  async saveChatSessionMessages(
    sessionId: string,
    messages: Array<{ id: string; role: 'user' | 'assistant'; text: string }>
  ): Promise<void> {
    try {
      const jsonValue = JSON.stringify(messages);
      await AsyncStorage.setItem(`${KEYS.CHAT_SESSIONS}:${sessionId}`, jsonValue);
    } catch (e) {
      console.error('Failed to save chat session messages', e);
    }
  },

  async deleteChatSessionMessages(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${KEYS.CHAT_SESSIONS}:${sessionId}`);
    } catch (e) {
      console.error('Failed to delete chat session messages', e);
    }
  },

  async getActiveChatSessionId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.ACTIVE_CHAT_SESSION);
    } catch (e) {
      console.error('Failed to load active chat session', e);
      return null;
    }
  },

  async saveActiveChatSessionId(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ACTIVE_CHAT_SESSION, sessionId);
    } catch (e) {
      console.error('Failed to save active chat session', e);
    }
  },

  async addLog(type: LogEntry['type'], value: string): Promise<LogEntry> {
    const newLog: LogEntry = {
      id: uuidv4(),
      type,
      value,
      timestamp: Date.now(),
    };

    try {
      const logs = await this.getLogs();
      const updatedLogs = [newLog, ...logs];
      await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(updatedLogs));
      return newLog;
    } catch (e) {
      console.error('Failed to save log', e);
      throw e;
    }
  },

  async getHabits(): Promise<any[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.HABITS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to load habits', e);
      return [];
    }
  },

  async saveHabits(habits: any[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(habits);
      await AsyncStorage.setItem(KEYS.HABITS, jsonValue);
    } catch (e) {
      console.error('Failed to save habits', e);
    }
  },

  async addHabit(habit: any): Promise<void> {
      try {
          const habits = await this.getHabits();
          const updatedHabits = [...habits, habit];
          await this.saveHabits(updatedHabits);
      } catch (e) {
          console.error('Failed to add habit', e);
      }
  },
  
  async getRoutines(): Promise<any[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.ROUTINES);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to load routines', e);
      return [];
    }
  },
  
  async saveRoutines(routines: any[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(routines);
      await AsyncStorage.setItem(KEYS.ROUTINES, jsonValue);
    } catch (e) {
      console.error('Failed to save routines', e);
    }
  },
  
  async addRoutine(routine: any): Promise<void> {
    try {
      const routines = await this.getRoutines();
      const updated = [...routines, routine];
      await this.saveRoutines(updated);
    } catch (e) {
      console.error('Failed to add routine', e);
    }
  },
  
  async getDailyMetricsHistory(): Promise<Record<string, DailyMetricsEntry>> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.DAILY_METRICS);
      return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (e) {
      console.error('Failed to load daily metrics', e);
      return {};
    }
  },

  async saveDailyMetricsHistory(history: Record<string, DailyMetricsEntry>): Promise<void> {
    try {
      const jsonValue = JSON.stringify(history);
      await AsyncStorage.setItem(KEYS.DAILY_METRICS, jsonValue);
    } catch (e) {
      console.error('Failed to save daily metrics', e);
    }
  },

  async upsertDailyMetrics(entry: DailyMetricsEntry): Promise<void> {
    const history = await this.getDailyMetricsHistory();
    const updated = { ...history, [entry.date]: entry };
    await this.saveDailyMetricsHistory(updated);
  },

  async getDailyCompletionHistory(): Promise<Record<string, DailyCompletionEntry>> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.DAILY_COMPLETION);
      return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (e) {
      console.error('Failed to load daily completion', e);
      return {};
    }
  },

  async saveDailyCompletionHistory(history: Record<string, DailyCompletionEntry>): Promise<void> {
    try {
      const jsonValue = JSON.stringify(history);
      await AsyncStorage.setItem(KEYS.DAILY_COMPLETION, jsonValue);
    } catch (e) {
      console.error('Failed to save daily completion', e);
    }
  },

  async upsertDailyCompletion(entry: DailyCompletionEntry): Promise<void> {
    const history = await this.getDailyCompletionHistory();
    const updated = { ...history, [entry.date]: entry };
    await this.saveDailyCompletionHistory(updated);
  },

  async getCommunityFollows(): Promise<string[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.COMMUNITY_FOLLOWS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to load community follows', e);
      return [];
    }
  },

  async saveCommunityFollows(communityIds: string[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(communityIds);
      await AsyncStorage.setItem(KEYS.COMMUNITY_FOLLOWS, jsonValue);
    } catch (e) {
      console.error('Failed to save community follows', e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  },

  async getSupabaseUser(): Promise<{ id: string } | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id };
  },

  async getProfileById(userId: string): Promise<{ id: string; username: string; is_admin: boolean } | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, is_admin')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return data;
  },

  async getProfilesByIds(userIds: string[]): Promise<Record<string, { id: string; username: string; is_admin: boolean }>> {
    if (userIds.length === 0) return {};
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, is_admin')
      .in('id', userIds);
    if (error || !data) return {};
    return data.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, { id: string; username: string; is_admin: boolean }>);
  },

  async getCommunities(): Promise<Array<{ id: string; name: string; is_public: boolean; is_locked: boolean }>> {
    const { data, error } = await supabase
      .from('communities')
      .select('id, name, is_public, is_locked')
      .order('name');
    if (error || !data) return [];
    return data;
  },

  async getPosts(options?: {
    communityId?: string;
    communityIds?: string[];
    includeHidden?: boolean;
  }): Promise<Array<{ id: string; author_id: string; community_id: string; content: string; is_pinned: boolean; is_hidden: boolean; created_at: string }>> {
    const { communityId, communityIds, includeHidden } = options || {};
    let query = supabase
      .from('posts')
      .select('id, author_id, community_id, content, is_pinned, is_hidden, created_at');
    if (!includeHidden) {
      query = query.eq('is_hidden', false);
    }
    if (communityId) {
      query = query.eq('community_id', communityId);
    } else if (communityIds && communityIds.length > 0) {
      query = query.in('community_id', communityIds);
    }
    const { data, error } = await query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data;
  },

  async getCommentCounts(postIds: string[]): Promise<Record<string, number>> {
    if (postIds.length === 0) return {};
    const { data, error } = await supabase
      .from('comments')
      .select('id, post_id, is_hidden')
      .in('post_id', postIds)
      .eq('is_hidden', false);
    if (error || !data) return {};
    return data.reduce((acc, row) => {
      acc[row.post_id] = (acc[row.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  },

  async getComments(postId: string, includeHidden?: boolean): Promise<Array<{ id: string; post_id: string; author_id: string; content: string; is_hidden: boolean; created_at: string }>> {
    let query = supabase
      .from('comments')
      .select('id, post_id, author_id, content, is_hidden, created_at')
      .eq('post_id', postId);
    if (!includeHidden) {
      query = query.eq('is_hidden', false);
    }
    const { data, error } = await query.order('created_at', { ascending: true });
    if (error || !data) return [];
    return data;
  },

  async createPost(authorId: string, communityId: string, content: string) {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ author_id: authorId, community_id: communityId, content }])
      .select('id, author_id, community_id, content, is_pinned, is_hidden, created_at')
      .single();
    if (error) throw error;
    return data;
  },

  async updatePost(postId: string, updates: Partial<{ content: string; is_pinned: boolean; is_hidden: boolean }>) {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select('id, author_id, community_id, content, is_pinned, is_hidden, created_at')
      .single();
    if (error) throw error;
    return data;
  },

  async deletePost(postId: string) {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
  },

  async createComment(authorId: string, postId: string, content: string) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ author_id: authorId, post_id: postId, content }])
      .select('id, post_id, author_id, content, is_hidden, created_at')
      .single();
    if (error) throw error;
    return data;
  },

  async updateComment(commentId: string, updates: Partial<{ content: string; is_hidden: boolean }>) {
    const { data, error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', commentId)
      .select('id, post_id, author_id, content, is_hidden, created_at')
      .single();
    if (error) throw error;
    return data;
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw error;
  },

  async getPostReactions(): Promise<Record<string, { count: number; liked: boolean }>> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.POST_LIKES);
      return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (e) {
      console.error('Failed to load post likes', e);
      return {};
    }
  },

  async savePostReactions(reactions: Record<string, { count: number; liked: boolean }>): Promise<void> {
    try {
      const jsonValue = JSON.stringify(reactions);
      await AsyncStorage.setItem(KEYS.POST_LIKES, jsonValue);
    } catch (e) {
      console.error('Failed to save post likes', e);
    }
  },

  async togglePostLike(postId: string): Promise<{ count: number; liked: boolean }> {
    const reactions = await this.getPostReactions();
    const current = reactions[postId] || { count: 0, liked: false };
    const nextLiked = !current.liked;
    const nextCount = Math.max(0, current.count + (nextLiked ? 1 : -1));
    const next = { count: nextCount, liked: nextLiked };
    const updated = { ...reactions, [postId]: next };
    await this.savePostReactions(updated);
    return next;
  },

  async getPostLocations(): Promise<Record<string, string>> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.POST_LOCATIONS);
      return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (e) {
      console.error('Failed to load post locations', e);
      return {};
    }
  },

  async setPostLocation(postId: string, location: string): Promise<Record<string, string>> {
    const locations = await this.getPostLocations();
    const next = { ...locations };
    if (location) {
      next[postId] = location;
    } else {
      delete next[postId];
    }
    try {
      await AsyncStorage.setItem(KEYS.POST_LOCATIONS, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save post locations', e);
    }
    return next;
  }
};

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { StorageService } from '../services/storage';
import { UserProfile } from '../types';

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const bufferOptions = [5, 10, 15, 20];
  
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userProfile = await StorageService.getUserProfile();
    setProfile(userProfile);
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (profile) {
      const updatedProfile = { ...profile, notificationsEnabled: value };
      await StorageService.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
    }
  };

  const handleSetCommuteBuffer = async (minutes: number) => {
    if (!profile) return;
    const updatedProfile = { ...profile, commuteBufferMinutes: minutes };
    await StorageService.saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to reset everything? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            await StorageService.clearAll();
            // Optionally navigate to onboarding or restart
            Alert.alert("Data Cleared", "Please restart the app.");
          }
        }
      ]
    );
  };

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const SettingItem = ({ 
    icon, 
    label, 
    value, 
    onPress, 
    type = 'link' 
  }: { 
    icon: keyof typeof Ionicons.glyphMap, 
    label: string, 
    value?: string | boolean, 
    onPress?: () => void,
    type?: 'link' | 'toggle' | 'info'
  }) => (
    <TouchableOpacity 
      style={styles.item} 
      onPress={type === 'toggle' ? undefined : onPress}
      disabled={type === 'info'}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={COLORS.white} />
        </View>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      
      <View style={styles.itemRight}>
        {type === 'toggle' && (
          <Switch 
            value={value as boolean} 
            onValueChange={onPress as any}
            trackColor={{ false: '#333', true: COLORS.success }}
            thumbColor={COLORS.white}
          />
        )}
        {type === 'link' && (
           <Ionicons name="chevron-forward" size={20} color={COLORS.textDim} />
        )}
        {type === 'info' && (
          <Text style={styles.infoText}>{value as string}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
          <Text style={styles.profileDetail}>Joined {new Date().getFullYear()}</Text>
        </View>

        <Section title="Preferences">
          <SettingItem 
            icon="notifications-outline" 
            label="Notifications" 
            type="toggle"
            value={profile?.notificationsEnabled}
            onPress={() => handleToggleNotifications(!profile?.notificationsEnabled)}
          />
          <View style={styles.bufferRow}>
            <View style={styles.bufferRowHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="time-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.itemLabel}>Commute Buffer</Text>
            </View>
            <View style={styles.bufferOptions}>
              {bufferOptions.map(option => {
                const isActive = (profile?.commuteBufferMinutes ?? 10) === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.bufferOption, isActive && styles.bufferOptionActive]}
                    onPress={() => handleSetCommuteBuffer(option)}
                  >
                    <Text style={[styles.bufferOptionText, isActive && styles.bufferOptionTextActive]}>{option}m</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <SettingItem 
            icon="moon-outline" 
            label="Dark Mode" 
            type="info"
            value="On"
          />
        </Section>

        <Section title="Data">
           <SettingItem 
            icon="cloud-upload-outline" 
            label="Backup Data" 
            onPress={() => Alert.alert("Backup", "Backup feature coming soon.")}
          />
           <SettingItem 
            icon="trash-outline" 
            label="Clear All Data" 
            onPress={handleClearData}
          />
        </Section>

        <Section title="About">
          <SettingItem 
            icon="information-circle-outline" 
            label="Version" 
            type="info"
            value="1.0.0"
          />
          <SettingItem 
            icon="document-text-outline" 
            label="Privacy Policy" 
            onPress={() => {}}
          />
          <SettingItem 
            icon="mail-outline" 
            label="Contact Support" 
            onPress={() => {}}
          />
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: SPACING.s,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: SPACING.m,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.m,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.s,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  profileName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileDetail: {
    color: COLORS.textDim,
    fontSize: 14,
  },
  section: {
    marginBottom: SPACING.l,
  },
  sectionTitle: {
    color: COLORS.textDim,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SPACING.s,
    marginLeft: SPACING.s,
  },
  sectionContent: {
    backgroundColor: '#1C1C1E', // Surface
    borderRadius: 16,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E', // Separator color
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  itemLabel: {
    color: COLORS.white,
    fontSize: 16,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: COLORS.textDim,
    fontSize: 16,
  },
  bufferRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    gap: 12,
  },
  bufferRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bufferOptions: {
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 44,
  },
  bufferOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  bufferOptionActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  bufferOptionText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  bufferOptionTextActive: {
    color: COLORS.black,
  },
});

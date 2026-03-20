import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { StorageService } from '../services/storage';
import { UserProfile } from '../types';

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const bufferOptions = [5, 10, 15, 20];
  const [homeQuery, setHomeQuery] = useState('');
  const [homeOptions, setHomeOptions] = useState<Array<{ description: string; placeId: string }>>([]);
  const [homeSelected, setHomeSelected] = useState<{ description: string; placeId: string } | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);
  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userProfile = await StorageService.getUserProfile();
    setProfile(userProfile);
    if (userProfile?.homeAddress) {
      setHomeQuery(userProfile.homeAddress);
    }
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

  const buildAddressLabel = (place: Location.LocationGeocodedAddress) => {
    const parts = [
      place.name,
      place.street,
      place.city,
      place.postalCode,
      place.region,
      place.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const ensureLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location access', 'Allow location access to improve commute timing.');
      return false;
    }
    return true;
  };

  const handleSetHomeFromCurrentLocation = async () => {
    if (!profile) return;
    const granted = await ensureLocationPermission();
    if (!granted) return;
    try {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = current.coords;
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = reverse[0];
      const address = place ? buildAddressLabel(place) : profile.homeAddress;
      const updatedProfile = {
        ...profile,
        locationEnabled: true,
        homeAddress: address || profile.homeAddress,
        homePostcode: place?.postalCode ?? profile.homePostcode,
        homeHouseNumber: place?.streetNumber ?? profile.homeHouseNumber,
        homeLatitude: latitude,
        homeLongitude: longitude,
        homeVerifiedAt: new Date().toISOString(),
      };
      await StorageService.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
    } catch (e) {
      Alert.alert('Location update', 'Unable to set home address. Try again.');
    }
  };

  const handleRefreshCurrentLocation = async () => {
    if (!profile) return;
    const granted = await ensureLocationPermission();
    if (!granted) return;
    try {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const updatedProfile = {
        ...profile,
        locationEnabled: true,
        lastKnownLatitude: current.coords.latitude,
        lastKnownLongitude: current.coords.longitude,
        lastKnownAt: new Date().toISOString(),
      };
      await StorageService.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
    } catch (e) {
      Alert.alert('Location update', 'Unable to refresh current location.');
    }
  };

  const handleSaveHomeAddress = async () => {
    if (!profile) return;
    const trimmed = homeQuery.trim();
    if (!trimmed) {
      Alert.alert('Home address', 'Enter your home address.');
      return;
    }
    let latitude = profile.homeLatitude;
    let longitude = profile.homeLongitude;
    let placeId = profile.homePlaceId;
    let postcode = profile.homePostcode;
    let houseNumber = profile.homeHouseNumber;
    if (homeSelected && GOOGLE_MAPS_API_KEY) {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(homeSelected.placeId)}&fields=geometry,address_component&key=${GOOGLE_MAPS_API_KEY}`;
        const detailResponse = await fetch(detailUrl);
        const detailData = await detailResponse.json();
        const location = detailData?.result?.geometry?.location;
        const components = Array.isArray(detailData?.result?.address_components)
          ? detailData.result.address_components
          : [];
        const findComponent = (type: string) =>
          components.find((c: any) => Array.isArray(c.types) && c.types.includes(type));
        const postal = findComponent('postal_code');
        const number = findComponent('street_number');
        if (location?.lat && location?.lng) {
          latitude = Number(location.lat);
          longitude = Number(location.lng);
        }
        if (postal?.long_name) {
          postcode = postal.long_name;
        }
        if (number?.long_name) {
          houseNumber = number.long_name;
        }
        placeId = homeSelected.placeId;
      } catch (e) {
        Alert.alert('Home address', 'Unable to fetch address details.');
      }
    }
    const updatedProfile = {
      ...profile,
      locationEnabled: true,
      homeAddress: trimmed,
      homeLatitude: latitude,
      homeLongitude: longitude,
      homePlaceId: placeId,
      homePostcode: postcode,
      homeHouseNumber: houseNumber,
      homeVerifiedAt: new Date().toISOString(),
    };
    await StorageService.saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  useEffect(() => {
    const trimmed = homeQuery.trim();
    setHomeSelected(null);
    if (!GOOGLE_MAPS_API_KEY || trimmed.length < 3) {
      setHomeOptions([]);
      return;
    }
    let isActive = true;
    const timeout = setTimeout(async () => {
      setHomeLoading(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmed)}&types=address&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (!isActive) return;
        const options = Array.isArray(data?.predictions)
          ? data.predictions.map((item: { description?: string; place_id?: string }) => ({
              description: item.description ?? '',
              placeId: item.place_id ?? '',
            }))
          : [];
        setHomeOptions(options.filter((item: { description: string; placeId: string }) => item.description && item.placeId));
      } catch (e) {
        if (isActive) {
          setHomeOptions([]);
        }
      } finally {
        if (isActive) {
          setHomeLoading(false);
        }
      }
    }, 300);
    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [homeQuery, GOOGLE_MAPS_API_KEY]);

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

        <Section title="Location">
          <SettingItem
            icon="location-outline"
            label="Location access"
            type="info"
            value={profile?.locationEnabled ? 'On' : 'Off'}
          />
          <SettingItem
            icon="home-outline"
            label="Home address"
            type="info"
            value={profile?.homeAddress || 'Not set'}
          />
          <View style={styles.homeEditor}>
            <Text style={styles.homeLabel}>Update home address</Text>
            <TextInput
              style={styles.homeInput}
              placeholder="Start typing your address"
              placeholderTextColor="#6E7685"
              value={homeQuery}
              onChangeText={setHomeQuery}
            />
            {GOOGLE_MAPS_API_KEY ? (
              <View style={styles.homeOptions}>
                {homeOptions.length === 0 && homeQuery.trim().length >= 3 && !homeLoading ? (
                  <Text style={styles.homeHelper}>No matches yet. Keep typing.</Text>
                ) : null}
                {homeOptions.map(option => {
                  const isSelected = homeSelected?.placeId === option.placeId;
                  return (
                    <TouchableOpacity
                      key={option.placeId}
                      style={[styles.homeOption, isSelected && styles.homeOptionActive]}
                      onPress={() => {
                        setHomeSelected(option);
                        setHomeQuery(option.description);
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.homeOptionText}>{option.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.homeHelper}>Add a Google Maps key to enable address suggestions.</Text>
            )}
            <TouchableOpacity style={styles.homeSaveButton} activeOpacity={0.9} onPress={handleSaveHomeAddress}>
              <Text style={styles.homeSaveText}>Save home address</Text>
            </TouchableOpacity>
          </View>
          <SettingItem
            icon="navigate-outline"
            label="Home coordinates"
            type="info"
            value={
              profile?.homeLatitude !== undefined && profile?.homeLongitude !== undefined
                ? `${profile.homeLatitude.toFixed(5)}, ${profile.homeLongitude.toFixed(5)}`
                : 'Not set'
            }
          />
          <SettingItem
            icon="time-outline"
            label="Last location update"
            type="info"
            value={profile?.lastKnownAt ? new Date(profile.lastKnownAt).toLocaleString() : 'Not set'}
          />
          <SettingItem
            icon="pin-outline"
            label="Set home from current location"
            onPress={handleSetHomeFromCurrentLocation}
          />
          <SettingItem
            icon="refresh-outline"
            label="Refresh current location"
            onPress={handleRefreshCurrentLocation}
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
  homeEditor: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F242B',
    backgroundColor: '#101418',
  },
  homeLabel: {
    color: '#9CA4B1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  homeInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0E1114',
    borderWidth: 1,
    borderColor: '#1F242B',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  homeOptions: {
    marginTop: 10,
    gap: 8,
    maxHeight: 200,
  },
  homeOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F242B',
    backgroundColor: '#0E1114',
  },
  homeOptionActive: {
    borderColor: '#3CAD74',
    backgroundColor: '#0F1A14',
  },
  homeOptionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  homeHelper: {
    color: '#6E7685',
    fontSize: 12,
    fontWeight: '600',
  },
  homeSaveButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#3CAD74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeSaveText: {
    color: '#0E1114',
    fontSize: 14,
    fontWeight: '700',
  },
});

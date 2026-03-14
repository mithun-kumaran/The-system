import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
  initialValue?: string;
}

const MOCK_LOCATIONS = [
  'Home', 'Office', 'Ilford Gym', 'Romford Gym', 'Library', 'Park', 'Coffee Shop', 
  'Central Park', 'Downtown', 'Coworking Space', 'Station', 'University'
];
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export const LocationSearchModal = ({ visible, onClose, onSelect, initialValue = '' }: LocationSearchModalProps) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue, visible]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      return;
    }
    if (!GOOGLE_MAPS_API_KEY) {
      const filtered = MOCK_LOCATIONS.filter(l =>
        l.toLowerCase().includes(trimmed.toLowerCase())
      );
      setResults(filtered);
      return;
    }
    let isActive = true;
    const timeout = setTimeout(async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmed)}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (!isActive) return;
        const suggestions = Array.isArray(data?.predictions)
          ? data.predictions.map((item: { description?: string }) => item.description).filter(Boolean)
          : [];
        setResults(suggestions);
      } catch (e) {
        if (isActive) {
          setResults([]);
        }
      }
    }, 250);
    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [query]);

  const handleSelect = (loc: string) => {
    onSelect(loc);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
             <TextInput
                style={styles.searchInput}
                placeholder="Add Location"
                placeholderTextColor={COLORS.textDim}
                value={query}
                onChangeText={setQuery}
                autoFocus
             />
             {query.length > 0 && (
                 <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                     <Ionicons name="close-circle" size={20} color={COLORS.textDim} />
                 </TouchableOpacity>
             )}
          </View>
        </View>

        <View style={styles.content}>
            {/* Custom Entry Option */}
            {query.length > 0 && !results.includes(query) && (
                <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(query)}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="map-marker-plus" size={24} color={COLORS.white} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.locationTitle}>{query}</Text>
                        <Text style={styles.locationSubtitle}>Create new location</Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Suggestions */}
            <FlatList
                data={results}
                keyExtractor={item => item}
                keyboardShouldPersistTaps="always"
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.textDim} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.locationTitle}>{item}</Text>
                            <Text style={styles.locationSubtitle}>Suggestion</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E', // Dark background as per image
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    marginRight: SPACING.m,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    paddingHorizontal: SPACING.m,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    marginLeft: SPACING.s,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.m,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  textContainer: {
    flex: 1,
  },
  locationTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  locationSubtitle: {
    color: COLORS.textDim,
    fontSize: 12,
    marginTop: 2,
  },
});

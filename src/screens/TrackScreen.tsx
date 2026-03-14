import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { LineChart } from 'react-native-gifted-charts';
import { HomeHeader } from '../components/HomeHeader';

const { width } = Dimensions.get('window');

const TimeFilters = ['W', 'M', '3M', '6M', 'Y', '3Y', 'All'];

export const TrackScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('3M');

  const data = [
    { value: 7.5, label: 'Apr' },
    { value: 7.8 },
    { value: 8.0, label: 'May' },
    { value: 8.1 },
    { value: 8.0 },
    { value: 8.2, label: 'Jun' },
  ];

  return (
    <View style={styles.container}>
      <HomeHeader centerIcon="bar-chart-outline" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Time Filters */}
        <View style={styles.filterContainer}>
          {TimeFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <TouchableOpacity>
                    <Text style={styles.chartNav}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.chartTitle}>Apr-Jun 2025</Text>
                <TouchableOpacity>
                    <Text style={styles.chartNav}>{'>'}</Text>
                </TouchableOpacity>
            </View>
            
          <LineChart
            data={data}
            areaChart
            curved
            color={COLORS.success}
            startFillColor={COLORS.success}
            startOpacity={0.1}
            endOpacity={0.0}
            initialSpacing={20}
            noOfSections={5}
            yAxisColor="transparent"
            xAxisColor="transparent"
            rulesColor="#333"
            rulesType="dashed"
            yAxisTextStyle={{ color: COLORS.textDim, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: COLORS.textDim, fontSize: 10 }}
            width={width - 80}
            height={220}
            maxValue={9}
            hideDataPoints={false}
            dataPointsColor={COLORS.background}
            dataPointsRadius={4}
            dataPointsShape='circular'
            customDataPoint={() => (
                <View style={{
                    width: 8, 
                    height: 8, 
                    borderRadius: 4, 
                    backgroundColor: COLORS.background, 
                    borderWidth: 2, 
                    borderColor: COLORS.white
                }} />
            )}
            pointerConfig={{
                pointerStripHeight: 160,
                pointerStripColor: 'lightgray',
                pointerStripWidth: 2,
                pointerColor: 'lightgray',
                radius: 6,
                pointerLabelWidth: 100,
                pointerLabelHeight: 90,
                activatePointersOnLongPress: true,
                autoAdjustPointerLabelPosition: false,
                pointerLabelComponent: (items: Array<{ date?: string; value?: number }>) => {
                  return (
                    <View
                      style={{
                        height: 90,
                        width: 100,
                        justifyContent: 'center',
                        marginTop: -30,
                        marginLeft: -40,
                      }}>
                      <Text style={{color: '#FEF8EF', fontSize: 14, marginBottom:6,textAlign:'center'}}>
                        {items[0]?.date ?? ''}
                      </Text>
      
                      <View style={{paddingHorizontal:14,paddingVertical:6, borderRadius:16, backgroundColor:'#FEF8EF'}}>
                        <Text style={{fontWeight: 'bold',textAlign:'center'}}>
                          {'$' + (items[0]?.value ?? 0) + '.0'}
                        </Text>
                      </View>
                    </View>
                  );
                },
              }}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Weekly Rate</Text>
            <Text style={styles.statsValue}>+0.5%</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Trends</Text>
            <Text style={styles.statsValue}>+1.17</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
            <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Highest</Text>
                <Text style={styles.statsValue}>8.25</Text>
            </View>
            <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Lowest</Text>
                <Text style={styles.statsValue}>7.51</Text>
            </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  filterButtonActive: {
    backgroundColor: COLORS.success,
  },
  filterText: {
    color: COLORS.textDim,
    fontSize: FONTS.caption,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.black,
  },
  chartCard: {
    backgroundColor: '#111', // Slightly different dark for card
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: SPACING.lg,
      paddingHorizontal: SPACING.sm
  },
  chartTitle: {
      fontSize: FONTS.h3,
      color: COLORS.white
  },
  chartNav: {
      color: COLORS.white,
      fontSize: 20,
      fontWeight: 'bold'
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statsCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 20,
  },
  statsLabel: {
    color: COLORS.white,
    fontSize: FONTS.h3,
    marginBottom: SPACING.sm,
  },
  statsValue: {
    color: COLORS.textDim,
    fontSize: FONTS.h3,
  },
});

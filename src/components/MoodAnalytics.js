import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { getMoodEntries, getDatabaseStats } from '../utils/database';
import { EMOTIONS, ACTIVITY_CATEGORIES } from '../data/models';

/**
 * MoodAnalytics component for visualizing mood data and providing insights
 * Implements the "Insightful Visual Analytics" section from mood.txt
 */
const MoodAnalytics = ({ navigation, timeRange = 'week' }) => {
  const [moodData, setMoodData] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTimeRange, setActiveTimeRange] = useState(timeRange);
  const [insights, setInsights] = useState([]);
  
  // Screen dimensions for charts
  const screenWidth = Dimensions.get('window').width;
  
  // Load mood data on mount and when timeRange changes
  useEffect(() => {
    loadMoodData();
  }, [activeTimeRange]);
  
  // Load mood data from database
  const loadMoodData = async () => {
    setIsLoading(true);
    try {
      // Get mood entries based on time range
      const limit = getEntriesLimitForTimeRange(activeTimeRange);
      const entries = await getMoodEntries(limit, 0);
      
      // Get general database stats
      const dbStats = await getDatabaseStats();
      
      setMoodData(entries);
      setStats(dbStats);
      
      // Generate insights from the data
      const generatedInsights = generateInsights(entries, dbStats);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error loading mood data for analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get limit for entries based on time range
  const getEntriesLimitForTimeRange = (range) => {
    switch (range) {
      case 'day': return 24; // Last 24 entries (roughly a day)
      case 'week': return 50; // About a week of entries
      case 'month': return 100; // About a month of entries
      case 'year': return 365; // A year of entries
      default: return 50;
    }
  };
  
  // Generate insights based on mood data
  const generateInsights = (entries, dbStats) => {
    if (!entries || entries.length === 0) {
      return ['Start logging your mood to see insights here.'];
    }
    
    const insights = [];
    
    // Average mood
    const avgRating = entries.reduce((sum, entry) => sum + entry.rating, 0) / entries.length;
    insights.push(`Your average mood is ${avgRating.toFixed(1)} out of 5.`);
    
    // Most common emotion
    const emotions = {};
    entries.forEach(entry => {
      emotions[entry.emotion] = (emotions[entry.emotion] || 0) + 1;
    });
    
    const mostCommonEmotion = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];
    if (mostCommonEmotion) {
      const emotionDetails = EMOTIONS.find(e => e.value === mostCommonEmotion[0]) || { label: mostCommonEmotion[0] };
      insights.push(`Your most frequent emotion is ${emotionDetails.label || mostCommonEmotion[0]}.`);
    }
    
    // Mood trends
    if (entries.length > 5) {
      const firstFiveAvg = entries.slice(entries.length - 5).reduce((sum, entry) => sum + entry.rating, 0) / 5;
      const lastFiveAvg = entries.slice(0, 5).reduce((sum, entry) => sum + entry.rating, 0) / 5;
      
      const difference = lastFiveAvg - firstFiveAvg;
      if (Math.abs(difference) >= 0.5) {
        const trend = difference > 0 ? 'improving' : 'declining';
        insights.push(`Your mood appears to be ${trend} recently.`);
      } else {
        insights.push('Your mood has been relatively stable recently.');
      }
    }
    
    // Location correlations (if at least 5 entries with location)
    const entriesWithLocation = entries.filter(entry => entry.location);
    if (entriesWithLocation.length >= 5) {
      // Find locations that correlate with higher/lower mood
      const locationStats = {};
      
      entriesWithLocation.forEach(entry => {
        if (!locationStats[entry.location]) {
          locationStats[entry.location] = { sum: 0, count: 0 };
        }
        locationStats[entry.location].sum += entry.rating;
        locationStats[entry.location].count += 1;
      });
      
      // Calculate average mood for each location
      const locationAverages = Object.entries(locationStats)
        .map(([location, stats]) => ({
          location,
          avg: stats.sum / stats.count,
          count: stats.count
        }))
        .filter(item => item.count >= 3) // Only include locations with enough data
        .sort((a, b) => b.avg - a.avg);
      
      // Add insight for best location if we have enough data
      if (locationAverages.length > 0) {
        const bestLocation = locationAverages[0];
        insights.push(`Your mood tends to be better when you're at ${bestLocation.location} (avg: ${bestLocation.avg.toFixed(1)}).`);
        
        // If we have multiple locations, add insight for the worst location
        if (locationAverages.length > 1) {
          const worstLocation = locationAverages[locationAverages.length - 1];
          if (bestLocation.avg - worstLocation.avg >= 0.8) {
            insights.push(`You might want to be mindful of your mood when at ${worstLocation.location} (avg: ${worstLocation.avg.toFixed(1)}).`);
          }
        }
      }
    }
    
    // Social context correlations (if at least 5 entries with social context)
    const entriesWithSocialContext = entries.filter(entry => entry.socialContext);
    if (entriesWithSocialContext.length >= 5) {
      // Find social contexts that correlate with higher/lower mood
      const socialContextStats = {};
      
      entriesWithSocialContext.forEach(entry => {
        if (!socialContextStats[entry.socialContext]) {
          socialContextStats[entry.socialContext] = { sum: 0, count: 0 };
        }
        socialContextStats[entry.socialContext].sum += entry.rating;
        socialContextStats[entry.socialContext].count += 1;
      });
      
      // Calculate average mood for each social context
      const socialContextAverages = Object.entries(socialContextStats)
        .map(([context, stats]) => ({
          context,
          avg: stats.sum / stats.count,
          count: stats.count
        }))
        .filter(item => item.count >= 3) // Only include contexts with enough data
        .sort((a, b) => b.avg - a.avg);
      
      // Add insight for best social context if we have enough data
      if (socialContextAverages.length > 0) {
        const bestContext = socialContextAverages[0];
        insights.push(`Your mood tends to be better when you're ${bestContext.context.toLowerCase()} (avg: ${bestContext.avg.toFixed(1)}).`);
      }
    }
    
    // Weather correlations (if at least 5 entries with weather)
    const entriesWithWeather = entries.filter(entry => entry.weather);
    if (entriesWithWeather.length >= 5) {
      // Find weather conditions that correlate with higher/lower mood
      const weatherStats = {};
      
      entriesWithWeather.forEach(entry => {
        if (!weatherStats[entry.weather]) {
          weatherStats[entry.weather] = { sum: 0, count: 0 };
        }
        weatherStats[entry.weather].sum += entry.rating;
        weatherStats[entry.weather].count += 1;
      });
      
      // Calculate average mood for each weather condition
      const weatherAverages = Object.entries(weatherStats)
        .map(([weather, stats]) => ({
          weather,
          avg: stats.sum / stats.count,
          count: stats.count
        }))
        .filter(item => item.count >= 3) // Only include weather conditions with enough data
        .sort((a, b) => b.avg - a.avg);
      
      // Add insight for best weather if we have enough data
      if (weatherAverages.length > 0) {
        const bestWeather = weatherAverages[0];
        insights.push(`Your mood tends to be better during ${bestWeather.weather.toLowerCase()} weather (avg: ${bestWeather.avg.toFixed(1)}).`);
      }
    }
    
    // Activity correlations (if at least 10 entries with activities)
    const entriesWithActivities = entries.filter(entry => Object.keys(entry.activities).length > 0);
    if (entriesWithActivities.length >= 10) {
      // Find activities that correlate with higher mood
      const activityCorrelations = {};
      
      Object.keys(ACTIVITY_CATEGORIES).forEach(category => {
        const entriesWithActivity = entriesWithActivities.filter(entry => entry.activities[category]);
        if (entriesWithActivity.length >= 3) {
          const avgWithActivity = entriesWithActivity.reduce((sum, entry) => sum + entry.rating, 0) / entriesWithActivity.length;
          const entriesWithoutActivity = entriesWithActivities.filter(entry => !entry.activities[category]);
          const avgWithoutActivity = entriesWithoutActivity.length > 0 
            ? entriesWithoutActivity.reduce((sum, entry) => sum + entry.rating, 0) / entriesWithoutActivity.length
            : 0;
          
          activityCorrelations[category] = {
            category: ACTIVITY_CATEGORIES[category],
            difference: avgWithActivity - avgWithoutActivity,
            sampleSize: entriesWithActivity.length
          };
        }
      });
      
      // Find strongest positive correlation
      const strongestCorrelation = Object.values(activityCorrelations)
        .filter(c => c.difference > 0.5)
        .sort((a, b) => b.difference - a.difference)[0];
      
      if (strongestCorrelation) {
        insights.push(`Your mood tends to be better when you engage in ${strongestCorrelation.category}.`);
      }
    }
    
    // Day of week patterns (if enough data)
    if (entries.length >= 14) {
      const dayAverages = Array(7).fill(0).map(() => ({ sum: 0, count: 0 }));
      
      entries.forEach(entry => {
        const day = new Date(entry.entry_time).getDay();
        dayAverages[day].sum += entry.rating;
        dayAverages[day].count++;
      });
      
      const dayScores = dayAverages.map((day, index) => ({
        day: index,
        avg: day.count > 0 ? day.sum / day.count : 0,
        count: day.count
      })).filter(day => day.count > 0);
      
      if (dayScores.length > 3) {
        const bestDay = dayScores.sort((a, b) => b.avg - a.avg)[0];
        const worstDay = dayScores.sort((a, b) => a.avg - b.avg)[0];
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        if (bestDay.avg - worstDay.avg > 0.7) {
          insights.push(`Your mood tends to be better on ${days[bestDay.day]} and worse on ${days[worstDay.day]}.`);
        }
      }
    }
    
    // Combined factor analysis (if we have a lot of data)
    if (entries.length >= 30) {
      // Check if multiple factors positively correlate
      let positiveFactors = [];
      
      // Check social + activity correlation
      const socialAndActivityEntries = entries.filter(entry => 
        entry.socialContext && Object.keys(entry.activities).length > 0
      );
      
      if (socialAndActivityEntries.length >= 5) {
        // Most common combinations
        const combinations = {};
        
        socialAndActivityEntries.forEach(entry => {
          Object.entries(entry.activities).forEach(([activity, _]) => {
            const key = `${entry.socialContext} + ${ACTIVITY_CATEGORIES[activity]}`;
            if (!combinations[key]) {
              combinations[key] = { sum: 0, count: 0, text: key };
            }
            combinations[key].sum += entry.rating;
            combinations[key].count += 1;
          });
        });
        
        // Find best combinations
        const bestCombinations = Object.values(combinations)
          .filter(c => c.count >= 3)
          .map(c => ({ ...c, avg: c.sum / c.count }))
          .sort((a, b) => b.avg - a.avg);
        
        if (bestCombinations.length > 0 && bestCombinations[0].avg > avgRating + 0.8) {
          insights.push(`Your best mood combination appears to be ${bestCombinations[0].text} (avg: ${bestCombinations[0].avg.toFixed(1)}).`);
        }
      }
    }
    
    return insights;
  };
  
  // Render mood distribution chart
  const renderMoodDistribution = () => {
    if (moodData.length === 0) return null;
    
    // Count entries by rating
    const distribution = [0, 0, 0, 0, 0]; // Ratings 1-5
    moodData.forEach(entry => {
      distribution[entry.rating - 1]++;
    });
    
    const maxCount = Math.max(...distribution);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Mood Distribution</Text>
        <View style={styles.barChart}>
          {distribution.map((count, index) => {
            const barHeight = maxCount > 0 ? (count / maxCount) * 150 : 0;
            return (
              <View key={index} style={styles.barContainer}>
                <Text style={styles.barLabel}>{count}</Text>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: barHeight > 0 ? barHeight : 5,
                      backgroundColor: getMoodColor(index + 1)
                    }
                  ]} 
                />
                <Text style={styles.barAxisLabel}>{index + 1}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.chartCaption}>Distribution of mood ratings (1-5)</Text>
      </View>
    );
  };
  
  // Render emotion word cloud (simplified version)
  const renderEmotionCloud = () => {
    if (moodData.length === 0) return null;
    
    // Count entries by emotion
    const emotionCounts = {};
    moodData.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });
    
    // Convert to array and sort by frequency
    const sortedEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ 
        emotion, 
        count,
        details: EMOTIONS.find(e => e.value === emotion) || { label: emotion, emoji: '😐' }
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Show top 6 emotions
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Common Emotions</Text>
        <View style={styles.emotionCloud}>
          {sortedEmotions.map((item, index) => (
            <View key={index} style={styles.emotionItem}>
              <Text style={styles.emotionEmoji}>{item.details.emoji}</Text>
              <Text style={styles.emotionLabel}>{item.details.label}</Text>
              <Text style={styles.emotionCount}>{item.count}×</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Render location mood correlations
  const renderLocationCorrelations = () => {
    if (moodData.length === 0) return null;
    
    // Filter entries with location data
    const entriesWithLocation = moodData.filter(entry => entry.location);
    if (entriesWithLocation.length < 5) return null;
    
    // Calculate average mood by location
    const locationStats = {};
    
    entriesWithLocation.forEach(entry => {
      if (!locationStats[entry.location]) {
        locationStats[entry.location] = { sum: 0, count: 0 };
      }
      locationStats[entry.location].sum += entry.rating;
      locationStats[entry.location].count += 1;
    });
    
    // Convert to array and sort by average mood
    const locationData = Object.entries(locationStats)
      .map(([location, stats]) => ({
        location,
        avg: stats.sum / stats.count,
        count: stats.count
      }))
      .filter(item => item.count >= 2) // Need at least 2 entries for meaningful data
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5); // Show top 5 locations
    
    if (locationData.length === 0) return null;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Location Mood Impact</Text>
        <View style={styles.locationChart}>
          {locationData.map((item, index) => (
            <View key={index} style={styles.locationItem}>
              <Text style={styles.locationName}>{item.location}</Text>
              <View style={styles.locationBarContainer}>
                <View 
                  style={[
                    styles.locationBar, 
                    { 
                      width: `${(item.avg / 5) * 100}%`,
                      backgroundColor: getMoodColor(Math.round(item.avg))
                    }
                  ]} 
                />
                <Text style={styles.locationRating}>{item.avg.toFixed(1)}</Text>
              </View>
              <Text style={styles.locationCount}>{item.count} entries</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Render social context correlations
  const renderSocialContextCorrelations = () => {
    if (moodData.length === 0) return null;
    
    // Filter entries with social context data
    const entriesWithContext = moodData.filter(entry => entry.socialContext);
    if (entriesWithContext.length < 5) return null;
    
    // Calculate average mood by social context
    const contextStats = {};
    
    entriesWithContext.forEach(entry => {
      if (!contextStats[entry.socialContext]) {
        contextStats[entry.socialContext] = { sum: 0, count: 0 };
      }
      contextStats[entry.socialContext].sum += entry.rating;
      contextStats[entry.socialContext].count += 1;
    });
    
    // Convert to array and sort by average mood
    const contextData = Object.entries(contextStats)
      .map(([context, stats]) => ({
        context,
        avg: stats.sum / stats.count,
        count: stats.count
      }))
      .filter(item => item.count >= 2) // Need at least 2 entries for meaningful data
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5); // Show top 5 contexts
    
    if (contextData.length === 0) return null;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Social Context Impact</Text>
        <View style={styles.socialContextChart}>
          {contextData.map((item, index) => (
            <View key={index} style={styles.contextItem}>
              <Text style={styles.contextName}>{item.context}</Text>
              <View style={styles.contextBarContainer}>
                <View 
                  style={[
                    styles.contextBar, 
                    { 
                      width: `${(item.avg / 5) * 100}%`,
                      backgroundColor: getMoodColor(Math.round(item.avg))
                    }
                  ]} 
                />
                <Text style={styles.contextRating}>{item.avg.toFixed(1)}</Text>
              </View>
              <Text style={styles.contextCount}>{item.count} entries</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Render weather mood correlations
  const renderWeatherCorrelations = () => {
    if (moodData.length === 0) return null;
    
    // Filter entries with weather data
    const entriesWithWeather = moodData.filter(entry => entry.weather);
    if (entriesWithWeather.length < 5) return null;
    
    // Calculate average mood by weather
    const weatherStats = {};
    
    entriesWithWeather.forEach(entry => {
      if (!weatherStats[entry.weather]) {
        weatherStats[entry.weather] = { sum: 0, count: 0 };
      }
      weatherStats[entry.weather].sum += entry.rating;
      weatherStats[entry.weather].count += 1;
    });
    
    // Convert to array and sort by average mood
    const weatherData = Object.entries(weatherStats)
      .map(([weather, stats]) => ({
        weather,
        avg: stats.sum / stats.count,
        count: stats.count
      }))
      .filter(item => item.count >= 2) // Need at least 2 entries for meaningful data
      .sort((a, b) => b.avg - a.avg);
    
    if (weatherData.length === 0) return null;
    
    // Emoji mapping for weather conditions
    const weatherEmojis = {
      'Sunny': '☀️',
      'Cloudy': '☁️',
      'Rainy': '🌧️',
      'Stormy': '⛈️',
      'Snowy': '❄️',
      'Foggy': '🌫️',
      'Hot': '🔥',
      'Cold': '🧊'
    };
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weather Impact</Text>
        <View style={styles.weatherChart}>
          {weatherData.map((item, index) => (
            <View key={index} style={styles.weatherItem}>
              <Text style={styles.weatherEmoji}>
                {weatherEmojis[item.weather] || '🌡️'}
              </Text>
              <Text style={styles.weatherName}>{item.weather}</Text>
              <Text style={[
                styles.weatherRating,
                { color: getMoodColor(Math.round(item.avg)) }
              ]}>
                {item.avg.toFixed(1)}
              </Text>
              <Text style={styles.weatherCount}>{item.count} entries</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Get color based on mood rating
  const getMoodColor = (rating) => {
    const colors = {
      1: '#E57373', // Red
      2: '#FFB74D', // Orange
      3: '#FFD54F', // Yellow
      4: '#81C784', // Light Green
      5: '#4CAF50', // Green
    };
    return colors[rating] || '#FFD54F';
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mood Analytics</Text>
      {/* Time range selector */}
      <View style={styles.timeRangeSelector}>
        {['day', 'week', 'month', 'year'].map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              activeTimeRange === range && styles.activeTimeRange
            ]}
            onPress={() => setActiveTimeRange(range)}
          >
            <Text 
              style={[
                styles.timeRangeText,
                activeTimeRange === range && styles.activeTimeRangeText
              ]}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Insights section */}
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Insights</Text>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
      
      {/* Mood distribution chart */}
      {renderMoodDistribution()}
      
      {/* Emotion cloud */}
      {renderEmotionCloud()}
      
      {/* Location correlations */}
      {renderLocationCorrelations()}
      
      {/* Social context correlations */}
      {renderSocialContextCorrelations()}
      
      {/* Weather correlations */}
      {renderWeatherCorrelations()}
      
      {/* Summary stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.moodEntries || 0}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{moodData.length > 0 ? (moodData.reduce((sum, entry) => sum + entry.rating, 0) / moodData.length).toFixed(1) : '-'}</Text>
              <Text style={styles.statLabel}>Avg. Mood</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.tags || 0}</Text>
              <Text style={styles.statLabel}>Tags Used</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
    marginHorizontal: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 0,
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTimeRange: {
    backgroundColor: '#FFD54F',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
  },
  activeTimeRangeText: {
    color: '#000',
    fontWeight: 'bold',
  },
  insightsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 16,
    color: '#444',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    width: '100%',
    paddingBottom: 25,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 30,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    marginBottom: 4,
    fontSize: 12,
  },
  barAxisLabel: {
    position: 'absolute',
    bottom: 0,
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartCaption: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  emotionCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  emotionItem: {
    margin: 8,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    width: 90,
  },
  emotionEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emotionCount: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD54F',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Location chart styles
  locationChart: {
    width: '100%',
  },
  locationItem: {
    marginBottom: 12,
  },
  locationName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  locationBar: {
    height: '100%',
    borderRadius: 4,
  },
  locationRating: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  
  // Social context chart styles
  socialContextChart: {
    width: '100%',
  },
  contextItem: {
    marginBottom: 12,
  },
  contextName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contextBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  contextBar: {
    height: '100%',
    borderRadius: 4,
  },
  contextRating: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  contextCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  
  // Weather chart styles
  weatherChart: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  weatherItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
  },
  weatherEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  weatherName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  weatherRating: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  weatherCount: {
    fontSize: 10,
    color: '#666',
  },
});

export default MoodAnalytics; 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { getMoodEntries, getDatabaseStats } from '../utils/database';
import { EMOTIONS, ACTIVITY_CATEGORIES } from '../data/models';
import { useLanguage } from '../context/LanguageContext';

/**
 * MoodAnalytics component for visualizing mood data and providing insights
 * Implements the "Insightful Visual Analytics" section from mood.txt
 */
const MoodAnalytics = ({ navigation, timeRange = 'week' }) => {
  const { t } = useLanguage();
  const [moodData, setMoodData] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTimeRange, setActiveTimeRange] = useState(timeRange);
  const [insights, setInsights] = useState([]);
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'mood', 'survey', 'calendar'
  
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
      case 'all': return 1000; // All entries
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
    
    // Check for mood swings
    if (entries.length > 10) {
      const moodChanges = [];
      for (let i = 1; i < entries.length; i++) {
        moodChanges.push(Math.abs(entries[i].rating - entries[i-1].rating));
      }
      
      const avgMoodChange = moodChanges.reduce((sum, change) => sum + change, 0) / moodChanges.length;
      
      if (avgMoodChange > 1.5) {
        insights.push('You seem to be experiencing significant mood swings.');
      } else if (avgMoodChange > 1.0) {
        insights.push('Your mood has moderate variability throughout the day.');
      } else {
        insights.push('Your mood is relatively consistent throughout the day.');
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
  
  // Render the mood distribution graph
  const renderMoodDistribution = () => {
    if (!moodData || moodData.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <Text>{t('noDataToDisplay')}</Text>
        </View>
      );
    }
    
    // Count occurrences of each rating
    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    moodData.forEach(entry => {
      ratings[entry.rating] = (ratings[entry.rating] || 0) + 1;
    });
    
    // Calculate bar widths based on counts
    const maxCount = Math.max(...Object.values(ratings));
    const barMaxWidth = screenWidth - 120; // Leave space for labels
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{t('moodDistribution')}</Text>
        {Object.entries(ratings).map(([rating, count]) => {
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <View key={rating} style={styles.barChartRow}>
              <View style={styles.barChartLabelContainer}>
                <Text style={styles.barChartLabel}>{rating}</Text>
                <Text style={styles.barChartEmoji}>{getMoodEmoji(parseInt(rating))}</Text>
              </View>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      width: `${percentage}%`, 
                      backgroundColor: getMoodColor(parseInt(rating))
                    }
                  ]}
                />
                <Text style={styles.barText}>{count}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };
  
  // Render graph of mood over time
  const renderMoodOverTime = () => {
    if (!moodData || moodData.length < 3) {
      return (
        <View style={styles.chartPlaceholder}>
          <Text>{t('notEnoughDataForTrend')}</Text>
        </View>
      );
    }
    
    // In a real implementation, you'd use a charting library here
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{t('moodOverTime')}</Text>
        <View style={styles.lineChartPlaceholder}>
          <Text style={styles.placeholderText}>{t('moodTrendChart')}</Text>
          {/* 
            Normally, you would render a real chart here using a library like:
            
            <LineChart
              data={{
                labels: [...],
                datasets: [{
                  data: moodData.map(entry => entry.rating).reverse()
                }]
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={{...}}
            />
          */}
        </View>
      </View>
    );
  };
  
  // Render mood swings / variability chart
  const renderMoodVariability = () => {
    if (!moodData || moodData.length < 5) {
      return (
        <View style={styles.chartPlaceholder}>
          <Text>{t('notEnoughDataForVariability')}</Text>
        </View>
      );
    }
    
    // Calculate variability by day
    // For demonstration, we'll just use a placeholder
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{t('moodVariability')}</Text>
        <View style={styles.lineChartPlaceholder}>
          <Text style={styles.placeholderText}>{t('moodVariabilityChart')}</Text>
        </View>
      </View>
    );
  };
  
  // Render calendar view with mood data
  const renderCalendarView = () => {
    // In a real implementation, you'd use a calendar library
    // For now, render a placeholder explaining the feature
    return (
      <View style={styles.calendarContainer}>
        <Text style={styles.chartTitle}>{t('moodCalendar')}</Text>
        <View style={styles.calendarPlaceholder}>
          <Text style={styles.placeholderText}>{t('calendarViewDescription')}</Text>
        </View>
      </View>
    );
  };
  
  // Render scientific survey scores over time
  const renderSurveyScores = () => {
    // In a real implementation, you'd need to filter mood entries 
    // that have associated survey results
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{t('surveyScores')}</Text>
        <View style={styles.lineChartPlaceholder}>
          <Text style={styles.placeholderText}>{t('surveyScoresChart')}</Text>
        </View>
      </View>
    );
  };
  
  // Get emoji for mood rating
  const getMoodEmoji = (rating) => {
    const emojis = {
      1: '😢',
      2: '😕',
      3: '😐',
      4: '🙂',
      5: '😊'
    };
    return emojis[rating] || '❓';
  };
  
  // Get color for mood rating
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
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD54F" />
        <Text style={styles.loadingText}>{t('loadingMoodData')}</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Time range selector */}
      <View style={styles.timeRangeSelector}>
        <Text style={styles.sectionTitle}>{t('timeRange')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRangeButtons}>
          <TouchableOpacity
            style={[styles.timeRangeButton, activeTimeRange === 'day' && styles.activeTimeRange]}
            onPress={() => setActiveTimeRange('day')}
          >
            <Text style={styles.timeRangeButtonText}>{t('day')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.timeRangeButton, activeTimeRange === 'week' && styles.activeTimeRange]}
            onPress={() => setActiveTimeRange('week')}
          >
            <Text style={styles.timeRangeButtonText}>{t('week')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.timeRangeButton, activeTimeRange === 'month' && styles.activeTimeRange]}
            onPress={() => setActiveTimeRange('month')}
          >
            <Text style={styles.timeRangeButtonText}>{t('month')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.timeRangeButton, activeTimeRange === 'year' && styles.activeTimeRange]}
            onPress={() => setActiveTimeRange('year')}
          >
            <Text style={styles.timeRangeButtonText}>{t('year')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.timeRangeButton, activeTimeRange === 'all' && styles.activeTimeRange]}
            onPress={() => setActiveTimeRange('all')}
          >
            <Text style={styles.timeRangeButtonText}>{t('allTime')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* View selector tabs */}
      <View style={styles.viewSelector}>
        <TouchableOpacity
          style={[styles.viewTab, activeView === 'overview' && styles.activeViewTab]}
          onPress={() => setActiveView('overview')}
        >
          <Text style={styles.viewTabText}>{t('overview')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewTab, activeView === 'mood' && styles.activeViewTab]}
          onPress={() => setActiveView('mood')}
        >
          <Text style={styles.viewTabText}>{t('moodGraphs')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewTab, activeView === 'survey' && styles.activeViewTab]}
          onPress={() => setActiveView('survey')}
        >
          <Text style={styles.viewTabText}>{t('surveyResults')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewTab, activeView === 'calendar' && styles.activeViewTab]}
          onPress={() => setActiveView('calendar')}
        >
          <Text style={styles.viewTabText}>{t('calendar')}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main content based on active view */}
      {activeView === 'overview' && (
        <>
          {/* Insights */}
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionTitle}>{t('moodInsights')}</Text>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
          
          {/* Summary stats */}
          {stats && (
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>{t('summary')}</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.moodEntries || 0}</Text>
                  <Text style={styles.statLabel}>{t('entries')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {moodData.length > 0 ? (moodData.reduce((sum, entry) => sum + entry.rating, 0) / moodData.length).toFixed(1) : '-'}
                  </Text>
                  <Text style={styles.statLabel}>{t('avgMood')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.tags || 0}</Text>
                  <Text style={styles.statLabel}>{t('tagsUsed')}</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Preview of mood distribution */}
          {renderMoodDistribution()}
        </>
      )}
      
      {activeView === 'mood' && (
        <>
          {renderMoodDistribution()}
          {renderMoodOverTime()}
          {renderMoodVariability()}
        </>
      )}
      
      {activeView === 'survey' && (
        <>
          {renderSurveyScores()}
        </>
      )}
      
      {activeView === 'calendar' && (
        <>
          {renderCalendarView()}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  timeRangeSelector: {
    marginBottom: 16,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 20,
    marginRight: 8,
  },
  activeTimeRange: {
    backgroundColor: '#FFD54F',
  },
  timeRangeButtonText: {
    fontWeight: '500',
  },
  viewSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 4,
  },
  viewTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeViewTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  viewTabText: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#444',
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD54F',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barChartLabelContainer: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barChartLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  barChartEmoji: {
    fontSize: 16,
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 20,
    borderRadius: 4,
  },
  barText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  lineChartPlaceholder: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarPlaceholder: {
    height: 300,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  chartPlaceholder: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  },
});

export default MoodAnalytics; 
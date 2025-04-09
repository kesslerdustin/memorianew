import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useFood } from '../context/FoodContext';

const FoodAnalytics = () => {
  const { t } = useLanguage();
  const { foodEntries, isLoading, getEntriesForDateRange } = useFood();
  
  const [weeklyData, setWeeklyData] = useState([]);
  const [nutritionSummary, setNutritionSummary] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [mealTypeDistribution, setMealTypeDistribution] = useState({});

  useEffect(() => {
    if (foodEntries.length > 0) {
      processData(foodEntries);
    }
  }, [foodEntries]);

  const processData = (entries) => {
    if (!entries || entries.length === 0) {
      return;
    }

    // Group data by day for weekly overview
    const days = {};
    const today = new Date().setHours(0, 0, 0, 0);
    
    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateString = date.toISOString().split('T')[0];
      days[dateString] = {
        date: new Date(date),
        calories: 0,
        entries: []
      };
    }

    // Calculate nutrition summary
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    // Calculate meal type distribution
    const mealCounts = {};
    
    // Process each entry
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      const dateString = entryDate.toISOString().split('T')[0];
      
      // Add to daily totals if within the last 7 days
      if (days[dateString]) {
        days[dateString].calories += entry.calories || 0;
        days[dateString].entries.push(entry);
      }
      
      // Add to nutrition totals
      totalCalories += entry.calories || 0;
      totalProtein += entry.protein || 0;
      totalCarbs += entry.carbs || 0;
      totalFat += entry.fat || 0;
      
      // Add to meal type counts
      const mealType = entry.meal_type || 'other';
      mealCounts[mealType] = (mealCounts[mealType] || 0) + 1;
    });

    // Convert days object to array sorted by date
    const daysArray = Object.values(days).sort((a, b) => b.date - a.date);
    
    setWeeklyData(daysArray);
    setNutritionSummary({
      calories: Math.round(totalCalories / entries.length) || 0,
      protein: Math.round(totalProtein / entries.length) || 0,
      carbs: Math.round(totalCarbs / entries.length) || 0,
      fat: Math.round(totalFat / entries.length) || 0
    });
    setMealTypeDistribution(mealCounts);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>{t('loadingAnalytics') || 'Loading analytics...'}</Text>
      </View>
    );
  }

  // Format day name
  const getDayName = (date) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today) {
      return t('today') || 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return t('yesterday') || 'Yesterday';
    }
    
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('weeklySummary') || 'Weekly Summary'}</Text>
        
        <View style={styles.chartContainer}>
          {weeklyData.slice(0, 7).map((day, index) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: Math.min(day.calories / 30, 150) || 5,
                      backgroundColor: day.date.getTime() === new Date().setHours(0, 0, 0, 0) ? '#4CAF50' : '#81C784'
                    }
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{getDayName(day.date)}</Text>
              <Text style={styles.barValue}>{day.calories}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('averageNutrition') || 'Average Daily Nutrition'}</Text>
        
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutritionSummary.calories}</Text>
            <Text style={styles.nutritionLabel}>{t('calories') || 'Calories'}</Text>
          </View>
          
          <View style={styles.nutritionDivider} />
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutritionSummary.protein}g</Text>
            <Text style={styles.nutritionLabel}>{t('protein') || 'Protein'}</Text>
          </View>
          
          <View style={styles.nutritionDivider} />
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutritionSummary.carbs}g</Text>
            <Text style={styles.nutritionLabel}>{t('carbs') || 'Carbs'}</Text>
          </View>
          
          <View style={styles.nutritionDivider} />
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutritionSummary.fat}g</Text>
            <Text style={styles.nutritionLabel}>{t('fat') || 'Fat'}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('mealDistribution') || 'Meal Distribution'}</Text>
        
        <View style={styles.mealDistribution}>
          {Object.entries(mealTypeDistribution).map(([type, count], index) => (
            <View key={index} style={styles.mealTypeItem}>
              <View style={styles.mealTypeBar}>
                <View 
                  style={[
                    styles.mealTypeFill,
                    { 
                      width: `${Math.min(count * 10, 100)}%`,
                      backgroundColor: 
                        type === 'breakfast' ? '#FFC107' :
                        type === 'lunch' ? '#4CAF50' :
                        type === 'dinner' ? '#2196F3' :
                        type === 'snack' ? '#FF5722' : 
                        type === 'drink' ? '#9C27B0' : '#757575'
                    }
                  ]}
                />
              </View>
              <View style={styles.mealTypeInfo}>
                <Text style={styles.mealTypeName}>{t(type) || type}</Text>
                <Text style={styles.mealTypeCount}>{count}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('insights') || 'Insights'}</Text>
        
        <Text style={styles.insightText}>
          {t('insightPlaceholder') || 'More detailed insights will be available as you add more food entries.'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
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
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 150,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  barLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  barValue: {
    fontSize: 10,
    color: '#999',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  nutritionDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  mealDistribution: {
    marginTop: 8,
  },
  mealTypeItem: {
    marginBottom: 12,
  },
  mealTypeBar: {
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  mealTypeFill: {
    height: '100%',
  },
  mealTypeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  mealTypeName: {
    fontSize: 14,
    color: '#666',
  },
  mealTypeCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  insightText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
});

export default FoodAnalytics; 
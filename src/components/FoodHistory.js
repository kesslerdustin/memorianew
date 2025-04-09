import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { usePeople } from '../context/PeopleContext';
import { MaterialIcons } from '@expo/vector-icons';

const FoodHistory = ({ 
  entries, 
  onEntryPress, 
  onEndReached, 
  onRefresh, 
  refreshing, 
  isLoadingMore, 
  bottomInset,
  getTranslatedMealType,
  getMealTypeEmoji
}) => {
  const { t } = useLanguage();
  const peopleContext = usePeople();
  
  // Create a fallback for getPeopleById in case it's not available
  const getPeopleById = (peopleIds) => {
    if (peopleContext && peopleContext.getPeopleById) {
      return peopleContext.getPeopleById(peopleIds);
    }
    // Return an empty array or dummy data if function is missing
    console.warn('getPeopleById function is not available in PeopleContext');
    return peopleIds?.map(id => ({ id, name: 'Unknown', emoji: '👤' })) || [];
  };

  // Group entries by date
  const groupedEntries = entries.reduce((groups, entry) => {
    const date = new Date(entry.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});

  // Convert grouped entries to array for FlatList
  const sections = Object.keys(groupedEntries).map(date => ({
    date,
    data: groupedEntries[date]
  }));

  // Calculate total calories for each day
  const getDayCalories = (entries) => {
    return entries.reduce((total, entry) => total + (entry.calories || 0), 0);
  };

  // Get people avatars for an entry
  const getPeopleAvatars = (entry) => {
    if (!entry.people || entry.people.length === 0) return null;
    
    const MAX_DISPLAY = 3;
    const people = getPeopleById(entry.people);
    
    return (
      <View style={styles.peopleAvatars}>
        {people.slice(0, MAX_DISPLAY).map((person, index) => (
          <View key={person.id} style={[styles.personAvatar, { zIndex: people.length - index }]}>
            <Text>{person.emoji || '👤'}</Text>
          </View>
        ))}
        {people.length > MAX_DISPLAY && (
          <View style={[styles.personAvatar, styles.moreAvatar]}>
            <Text>+{people.length - MAX_DISPLAY}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render a single food entry
  const renderFoodEntry = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.entryContainer}
        onPress={() => onEntryPress(item)}
      >
        <View style={styles.entryHeader}>
          {item.image_uri ? (
            <Image source={{ uri: item.image_uri }} style={styles.entryImage} />
          ) : (
            <Text style={styles.mealTypeEmoji}>{getMealTypeEmoji(item.meal_type)}</Text>
          )}
          <View style={styles.entryInfo}>
            <Text style={styles.entryName}>{item.name}</Text>
            <Text style={styles.entryMealType}>{getTranslatedMealType(item.meal_type)}</Text>
            
            {(item.people && item.people.length > 0) && (
              <View style={styles.entryMetadata}>
                <MaterialIcons name="people" size={14} color="#888" />
                <Text style={styles.entryMetadataText}>
                  {item.people.length} {item.people.length === 1 ? 'person' : 'people'}
                </Text>
              </View>
            )}
            
            {item.place && (
              <View style={styles.entryMetadata}>
                <MaterialIcons name="place" size={14} color="#888" />
                <Text style={styles.entryMetadataText}>1 place</Text>
              </View>
            )}
          </View>
          <View style={styles.entryNutrition}>
            <Text style={styles.entryCalories}>{item.calories} kcal</Text>
            {item.protein > 0 && <Text style={styles.entryNutrientValue}>P: {item.protein}g</Text>}
            {item.carbs > 0 && <Text style={styles.entryNutrientValue}>C: {item.carbs}g</Text>}
            {item.fat > 0 && <Text style={styles.entryNutrientValue}>F: {item.fat}g</Text>}
          </View>
        </View>
        
        {item.notes && (
          <Text style={styles.entryNotes} numberOfLines={1} ellipsizeMode="tail">
            {item.notes}
          </Text>
        )}
        
        <View style={styles.entryFooter}>
          <Text style={styles.entryTime}>
            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {getPeopleAvatars(item)}
        </View>
      </TouchableOpacity>
    );
  };

  // Render a day section
  const renderDay = ({ item }) => {
    const date = new Date(item.date);
    const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
    const formattedDate = date.toLocaleDateString();
    const totalCalories = getDayCalories(item.data);
    
    return (
      <View style={styles.dayContainer}>
        <View style={styles.dayHeader}>
          <View>
            <Text style={styles.dayName}>{dayName}</Text>
            <Text style={styles.dayDate}>{formattedDate}</Text>
          </View>
          <View style={styles.dayCalories}>
            <Text style={styles.dayCaloriesValue}>{totalCalories} kcal</Text>
            <Text style={styles.dayCaloriesLabel}>{t('totalCalories') || 'Total'}</Text>
          </View>
        </View>
        
        {item.data.map((entry) => renderFoodEntry({ item: entry }))}
      </View>
    );
  };

  // Loading indicator at bottom
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#4CAF50" />
        <Text style={styles.footerText}>{t('loadingMore') || 'Loading more entries...'}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={sections}
      renderItem={renderDay}
      keyExtractor={item => item.date}
      contentContainerStyle={[styles.container, { paddingBottom: bottomInset + 80 }]}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('noFoodEntries') || 'No food entries yet'}</Text>
          <Text style={styles.emptySubtext}>{t('addFoodEntryPrompt') || 'Add your first meal using the + button'}</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  dayContainer: {
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
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayDate: {
    fontSize: 14,
    color: '#666',
  },
  dayCalories: {
    alignItems: 'flex-end',
  },
  dayCaloriesValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  dayCaloriesLabel: {
    fontSize: 12,
    color: '#666',
  },
  entryContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  entryImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryMealType: {
    fontSize: 14,
    color: '#666',
  },
  entryMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  entryMetadataText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  entryNutrition: {
    alignItems: 'flex-end',
  },
  entryCalories: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryNutrientValue: {
    fontSize: 12,
    color: '#666',
  },
  entryNotes: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
    paddingLeft: 36,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  entryTime: {
    fontSize: 12,
    color: '#999',
  },
  peopleAvatars: {
    flexDirection: 'row',
  },
  personAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  moreAvatar: {
    backgroundColor: '#e0e0e0',
  },
  footer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  footerText: {
    marginLeft: 8,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default FoodHistory; 
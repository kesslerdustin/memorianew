import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ACTIVITY_CATEGORIES } from '../data/models';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle } from '../context/VisualStyleContext';
import { usePeople } from '../context/PeopleContext';

// Use the same EMOTIONS definition as in MoodScreen.js
const EMOTIONS = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'angry', label: 'Angry', emoji: '😠' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'excited', label: 'Excited', emoji: '🤩' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'bored', label: 'Bored', emoji: '😒' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'confused', label: 'Confused', emoji: '😕' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
  { value: 'content', label: 'Content', emoji: '🙂' },
];

const MoodEntryDetail = ({ entry, onClose, bottomInset = 0, topInset = 0, getTranslatedEmotion, getMoodIcon }) => {
  const { t } = useLanguage();
  const localVisualStyle = useVisualStyle();
  const { people, getPeopleById } = usePeople();
  const [associatedPeople, setAssociatedPeople] = useState([]);
  
  // Use provided visual style helpers or fallback to context
  const actualGetMoodIcon = getMoodIcon || localVisualStyle.getMoodIcon;

  useEffect(() => {
    // Load associated people
    if (entry && entry.people && Array.isArray(entry.people) && entry.people.length > 0) {
      if (getPeopleById) {
        // Use the context function if available
        const peopleData = getPeopleById(entry.people);
        setAssociatedPeople(peopleData);
      } else {
        // Fallback to manual lookup
        const peopleData = entry.people.map(personId => {
          const person = people.find(p => p.id === personId);
          return person || { id: personId, name: 'Unknown Person' };
        });
        setAssociatedPeople(peopleData);
      }
    } else {
      setAssociatedPeople([]);
    }
  }, [entry, people]);

  if (!entry) return null;

  // Get emotion details
  const getEmotion = () => {
    const emotionObj = EMOTIONS.find(e => e.value === entry.emotion) || 
      { label: entry.emotion || 'Unknown', emoji: '😐' };
    
    return {
      ...emotionObj,
      label: getTranslatedEmotion ? getTranslatedEmotion(entry.emotion) : t(emotionObj.value) || emotionObj.label
    };
  };

  const emotion = getEmotion();

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return t('unknownDate');
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get color based on rating
  const getRatingColor = (rating) => {
    const colors = {
      1: '#E57373', // Red
      2: '#FFB74D', // Orange
      3: '#FFD54F', // Yellow
      4: '#81C784', // Light Green
      5: '#4CAF50', // Green
    };
    return colors[rating] || '#FFD54F';
  };

  // Render people section
  const renderPeopleSection = () => {
    if (!associatedPeople || associatedPeople.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('peopleWithYou') || 'People With You'}</Text>
        <View style={styles.peopleList}>
          {associatedPeople.map(person => (
            <View key={person.id} style={styles.personItem}>
              <Text style={styles.personEmoji}>👤</Text>
              <Text style={styles.personName}>{safeRender(person.name)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Safe render for activities section
  const renderActivities = () => {
    try {
      if (!entry.activities || typeof entry.activities !== 'object') {
        return <View style={{ height: 1 }} />;
      }

      const activityKeys = Object.keys(entry.activities);
      if (activityKeys.length === 0) {
        return <View style={{ height: 1 }} />;
      }

      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('activities')}</Text>
          {activityKeys.map((type, index) => {
            if (!type) return null;
            
            const value = entry.activities[type];
            if (value === undefined) return null;

            // Convert everything to strings for safe display
            const activityType = String(type);
            let activityValue = '';
            
            if (value === null) {
              activityValue = '';
            } else if (typeof value === 'object') {
              try {
                activityValue = JSON.stringify(value);
              } catch (e) {
                activityValue = 'Complex value';
              }
            } else {
              activityValue = String(value);
            }
            
            // Get readable type name
            let typeName = activityType;
            if (ACTIVITY_CATEGORIES && typeof ACTIVITY_CATEGORIES === 'object') {
              typeName = ACTIVITY_CATEGORIES[activityType] || activityType;
            }
            
            return (
              <View key={`activity-${index}-${activityType}`} style={styles.contextItem}>
                <Text style={styles.contextLabel}>
                  {typeName}:
                </Text>
                <Text style={styles.contextValue}>
                  {activityValue}
                </Text>
              </View>
            );
          })}
        </View>
      );
    } catch (error) {
      console.error('Error rendering activities:', error);
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('activities')}</Text>
          <Text style={styles.errorText}>{t('errorDisplayingActivities')}</Text>
        </View>
      );
    }
  };

  // Extra safety to ensure every value is a proper React element or string in a Text
  const safeRender = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  };

  return (
    <View style={{ flex: 1 }}> 
      <ScrollView 
        style={[styles.container, { paddingTop: topInset }]}
        contentContainerStyle={{ paddingBottom: Math.max(20, bottomInset) }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('moodDetails')}</Text>
          <View style={{width: 80}} />
        </View>

        {/* Date and Time */}
        <Text style={styles.dateText}>{safeRender(formatDate(entry.entry_time))}</Text>

        {/* Mood and Emotion */}
        <View style={styles.moodContainer}>
          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(entry.rating) }]}>
            <Text style={styles.ratingText}>{safeRender(entry.rating || 0)}/5</Text>
          </View>
          <View style={styles.emotionContainer}>
            <Text style={styles.emotionEmoji}>{actualGetMoodIcon ? actualGetMoodIcon(entry.rating) : emotion.emoji}</Text>
            <Text style={styles.emotionLabel}>{safeRender(emotion.label)}</Text>
          </View>
        </View>

        {/* Notes */}
        {entry.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('notes')}</Text>
            <Text style={styles.notes}>{safeRender(entry.notes)}</Text>
          </View>
        ) : null}
        
        {/* People Section */}
        {renderPeopleSection()}

        {/* Location Information */}
        {entry.location ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('location')}</Text>
            <Text style={styles.sectionContent}>{safeRender(entry.location)}</Text>
            
            {/* Show detailed location data if available */}
            {entry.locationData && (
              <View style={styles.detailedData}>
                <Text style={styles.detailedLabel}>{t('coordinates')}</Text>
                <Text style={styles.detailedValue}>
                  {safeRender(entry.locationData.latitude)}, {safeRender(entry.locationData.longitude)}
                </Text>
              </View>
            )}
          </View>
        ) : null}
        
        {/* Weather Information */}
        {entry.weather ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('weather')}</Text>
            <Text style={styles.sectionContent}>{safeRender(entry.weather)}</Text>
            
            {/* Show detailed weather data if available */}
            {entry.weatherData && (
              <View style={styles.weatherDetails}>
                {entry.weatherData.description && (
                  <View style={styles.detailedData}>
                    <Text style={styles.detailedLabel}>{t('description')}</Text>
                    <Text style={styles.detailedValue}>{safeRender(entry.weatherData.description)}</Text>
                  </View>
                )}
                
                {entry.weatherData.feelsLike && (
                  <View style={styles.detailedData}>
                    <Text style={styles.detailedLabel}>{t('feelsLike')}</Text>
                    <Text style={styles.detailedValue}>{safeRender(entry.weatherData.feelsLike)}°C</Text>
                  </View>
                )}
                
                {entry.weatherData.humidity && (
                  <View style={styles.detailedData}>
                    <Text style={styles.detailedLabel}>{t('humidity')}</Text>
                    <Text style={styles.detailedValue}>{safeRender(entry.weatherData.humidity)}%</Text>
                  </View>
                )}
                
                {entry.weatherData.windSpeed && (
                  <View style={styles.detailedData}>
                    <Text style={styles.detailedLabel}>{t('windSpeed')}</Text>
                    <Text style={styles.detailedValue}>{safeRender(entry.weatherData.windSpeed)} m/s</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : null}
        
        {/* Social Context */}
        {entry.socialContext ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('socialContext')}</Text>
            <Text style={styles.sectionContent}>{safeRender(entry.socialContext)}</Text>
          </View>
        ) : null}

        {/* Linked Food Entries */}
        {entry.related && entry.related.food && entry.related.food.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('linkedFoods') || 'Linked Foods'}</Text>
            {entry.related.food.map((food, index) => (
              <View key={`food-${index}`} style={styles.linkedItem}>
                <Text style={styles.linkedItemTitle}>{safeRender(food.name)}</Text>
                {food.meal_type && (
                  <Text style={styles.linkedItemSubtitle}>
                    {safeRender(food.meal_type)}
                  </Text>
                )}
                {food.calories && (
                  <Text style={styles.linkedItemDetail}>
                    {safeRender(food.calories)} kcal
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {/* Tags */}
        {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('tags')}</Text>
            <View style={styles.tagsContainer}>
              {entry.tags.map((tag, index) => (
                <View key={`tag-${index}`} style={styles.tag}>
                  <Text style={styles.tagText}>{safeRender(tag)}</Text> 
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Activities */}
        {renderActivities()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#4A90E2',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
  },
  ratingBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD54F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  emotionContainer: {
    alignItems: 'center',
  },
  emotionEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  emotionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  notes: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
  },
  detailedData: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6, 
    paddingLeft: 8,
  },
  detailedLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    width: 100,
  },
  detailedValue: {
    fontSize: 14,
    color: '#333',
  },
  weatherDetails: {
    marginTop: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#0288D1',
  },
  errorText: {
    color: '#B00020',
    fontStyle: 'italic',
  },
  linkedItem: {
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  linkedItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  linkedItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  linkedItemDetail: {
    fontSize: 14,
    color: '#333',
  },
  peopleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    margin: 4,
    borderRadius: 20,
  },
  personEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  personName: {
    fontSize: 14,
  },
});

export default MoodEntryDetail; 
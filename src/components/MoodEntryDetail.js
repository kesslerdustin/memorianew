import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ACTIVITY_CATEGORIES } from '../data/models';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle } from '../context/VisualStyleContext';

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
  
  // Use provided visual style helpers or fallback to context
  const actualGetMoodIcon = getMoodIcon || localVisualStyle.getMoodIcon;

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
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{safeRender(entry.notes)}</Text>
            </View>
          </View>
        ) : null}

        {/* Context Details */}
        {(entry.location || entry.socialContext || entry.weather) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('context')}</Text>
            
            {/* Location */}
            {entry.location ? (
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>{t('location')}:</Text>
                <Text style={styles.contextValue}>{safeRender(entry.location)}</Text>
              </View>
            ) : null}

            {/* Social Context */}
            {entry.socialContext ? (
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>{t('social')}:</Text>
                <Text style={styles.contextValue}>{safeRender(entry.socialContext)}</Text>
              </View>
            ) : null}

            {/* Weather */}
            {entry.weather ? (
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>{t('weather')}:</Text>
                <Text style={styles.contextValue}>{safeRender(entry.weather)}</Text>
              </View>
            ) : null}
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
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 16,
  },
  ratingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emotionEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  emotionLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#444',
    marginBottom: 12,
  },
  notesContainer: {
    padding: 8,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    width: 80,
  },
  contextValue: {
    fontSize: 16,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E1F5FE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  errorText: {
    color: '#E57373',
    fontStyle: 'italic',
    fontSize: 14,
    padding: 8,
  }
});

export default MoodEntryDetail; 
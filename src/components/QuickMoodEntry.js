import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { saveMoodEntry } from '../database/database';
import { AntDesign } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle, VISUAL_STYLES, getRatingColor } from '../context/VisualStyleContext';

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

// Mood scale with emojis for 5-point Likert scale
const MOOD_SCALE = [
  { value: 1, label: 'Very Bad', emoji: '😫' },
  { value: 2, label: 'Bad', emoji: '😔' },
  { value: 3, label: 'Neutral', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '😊' },
  { value: 5, label: 'Very Good', emoji: '🤩' },
];

const QuickMoodEntry = ({ onMoodAdded, onDetailedEntry, visualStyle, getMoodIcon }) => {
  const { t } = useLanguage();
  const localVisualStyle = useVisualStyle();
  
  // Use provided visual style helpers or fallback to context
  const actualGetMoodIcon = getMoodIcon || localVisualStyle.getMoodIcon;
  const actualVisualStyle = visualStyle || localVisualStyle.visualStyle;
  
  // Check if smileys should be shown
  const showSmileys = actualVisualStyle === VISUAL_STYLES.SMILEYS;
  
  // Check if decimal values are supported (slider style)
  const supportsDecimal = actualVisualStyle === VISUAL_STYLES.SLIDER;

  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Get translated emotion label
  const getTranslatedEmotion = (emotionValue) => {
    const emotion = EMOTIONS.find(e => e.value === emotionValue);
    return emotion ? t(emotion.value) : emotionValue;
  };

  // Get the mood icon based on visual style
  const getMoodIconForRating = (rating) => {
    const moodScale = MOOD_SCALE.find(m => m.value === rating);
    return actualGetMoodIcon ? actualGetMoodIcon(rating) : (moodScale ? moodScale.emoji : '❓');
  };

  const handleRatingSelect = (rating) => {
    setSelectedRating(rating);
  };

  const handleEmotionSelect = (emotion) => {
    setSelectedEmotion(emotion);
  };

  // Handle rating change from slider
  const handleSliderChange = (value) => {
    // Round to one decimal place
    const roundedValue = Math.round(value * 10) / 10;
    setSelectedRating(roundedValue);
  };

  const handleQuickSubmit = async () => {
    if (!selectedRating || !selectedEmotion) {
      alert(t('selectRatingAndEmotion'));
      return;
    }

    setSubmitting(true);
    try {
      const currentTime = Date.now();
      const newEntry = await saveMoodEntry({
        rating: selectedRating,
        emotion: selectedEmotion,
        notes: '',
        entry_time: currentTime,
        timestamp: new Date(currentTime),
        activities: {},
        tags: []
      });
      
      // Reset selection
      setSelectedRating(null);
      setSelectedEmotion(null);
      
      if (onMoodAdded) {
        onMoodAdded(newEntry);
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      alert(t('failedToSaveMood'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailedEntry = () => {
    if (!selectedRating) {
      alert(t('selectRatingFirst'));
      return;
    }
    
    if (onDetailedEntry) {
      onDetailedEntry(selectedRating, selectedEmotion);
    }
  };

  const renderEmotionItem = (emotion) => {
    return (
      <TouchableOpacity
        key={emotion.value}
        style={[
          styles.emotionButton,
          selectedEmotion === emotion.value && styles.selectedEmotion
        ]}
        onPress={() => handleEmotionSelect(emotion.value)}
      >
        {showSmileys && (
          <Text style={styles.emoji}>{emotion.emoji}</Text>
        )}
        <Text style={[
          styles.emotionText,
          !showSmileys && styles.noEmojiEmotionText
        ]}>
          {t(emotion.value)}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Render the appropriate rating selector based on visual style
  const renderRatingSelector = () => {
    if (supportsDecimal) {
      // For slider visual style, render a slider
      return (
        <View style={styles.sliderContainer}>
          <Text style={styles.sectionTitle}>{t('yourMoodToday')}</Text>
          
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={0.1}
            value={selectedRating || 3}
            onValueChange={handleSliderChange}
            minimumTrackTintColor={getRatingColor(selectedRating || 3)}
            maximumTrackTintColor="#CCCCCC"
            thumbTintColor={getRatingColor(selectedRating || 3)}
          />
          
          <Text style={[
            styles.sliderValueText,
            { color: getRatingColor(selectedRating || 3) }
          ]}>
            {selectedRating ? selectedRating.toFixed(1) : '3.0'}
          </Text>
          
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderMinLabel}>{t('veryBad')}</Text>
            <Text style={styles.sliderMaxLabel}>{t('veryGood')}</Text>
          </View>
        </View>
      );
    }
    
    // For non-slider visual styles, render the mood buttons
    return (
      <View>
        <Text style={styles.sectionTitle}>{t('yourMoodToday')}</Text>
        <View style={styles.moodScaleContainer}>
          {MOOD_SCALE.map((mood) => (
            <TouchableOpacity
              key={mood.value}
              style={[
                styles.moodButton,
                selectedRating === mood.value && styles.selectedMood,
              ]}
              onPress={() => handleRatingSelect(mood.value)}
            >
              <Text style={styles.moodEmoji}>
                {getMoodIconForRating(mood.value)}
              </Text>
              <Text style={styles.moodLabel}>{t(mood.label.toLowerCase().replace(' ', ''))}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('howAreYouFeeling')}</Text>
      
      <View style={styles.ratingContainer}>
        {renderRatingSelector()}
      </View>

      <View style={styles.emotionContainer}>
        <Text style={styles.sectionTitle}>{t('primaryEmotion')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.emotionButtons}>
            {EMOTIONS.map(renderEmotionItem)}
          </View>
        </ScrollView>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.submitButton, (!selectedRating || !selectedEmotion) && styles.disabledButton]} 
          onPress={handleQuickSubmit}
          disabled={!selectedRating || !selectedEmotion || submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? t('saving') : t('saveMood')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.detailedButton} onPress={handleDetailedEntry}>
          <Text style={styles.detailedButtonText}>{t('addDetails')}</Text>
          <AntDesign name="pluscircleo" size={16} color="#4A90E2" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#555',
  },
  ratingContainer: {
    marginBottom: 28,
  },
  moodScaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  moodButton: {
    width: 64,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
  },
  selectedMood: {
    backgroundColor: '#E1F5FE',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  emotionContainer: {
    marginBottom: 28,
  },
  emotionButtons: {
    flexDirection: 'row',
    paddingBottom: 12,
  },
  emotionButton: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    width: 80,
    backgroundColor: '#f8f8f8',
  },
  selectedEmotion: {
    borderColor: '#4A90E2',
    backgroundColor: '#E1F5FE',
  },
  emoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  emotionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  noEmojiEmotionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 0,
  },
  actionButtons: {
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#B2D6FF',
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  detailedButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  detailedButtonText: {
    color: '#4A90E2',
    fontWeight: '600',
    marginRight: 8,
  },
  sliderContainer: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 28,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 10,
  },
  sliderValueText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderMinLabel: {
    color: '#E57373', // Red for minimum
    fontWeight: 'bold',
    fontSize: 14,
  },
  sliderMaxLabel: {
    color: '#4CAF50', // Green for maximum
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default QuickMoodEntry; 
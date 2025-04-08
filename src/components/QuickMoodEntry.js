import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { saveMoodEntry } from '../utils/database';
import { AntDesign } from '@expo/vector-icons';

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

const QuickMoodEntry = ({ onMoodAdded, onDetailedEntry }) => {
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRatingSelect = (rating) => {
    setSelectedRating(rating);
  };

  const handleEmotionSelect = (emotion) => {
    setSelectedEmotion(emotion);
  };

  const handleQuickSubmit = async () => {
    if (!selectedRating || !selectedEmotion) {
      alert('Please select both a rating and an emotion');
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
      alert('Failed to save your mood entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailedEntry = () => {
    if (!selectedRating) {
      alert('Please select a mood rating first');
      return;
    }
    
    if (onDetailedEntry) {
      onDetailedEntry(selectedRating, selectedEmotion);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling right now?</Text>
      
      <View style={styles.ratingContainer}>
        <Text style={styles.sectionTitle}>Your mood today</Text>
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
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.emotionContainer}>
        <Text style={styles.sectionTitle}>Primary emotion</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.emotionButtons}>
            {EMOTIONS.map((emotion) => (
              <TouchableOpacity
                key={emotion.value}
                style={[
                  styles.emotionButton,
                  selectedEmotion === emotion.value && styles.selectedEmotion
                ]}
                onPress={() => handleEmotionSelect(emotion.value)}
              >
                <Text style={styles.emoji}>{emotion.emoji}</Text>
                <Text style={styles.emotionText}>{emotion.label}</Text>
              </TouchableOpacity>
            ))}
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
            {submitting ? 'Saving...' : 'Save Mood'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.detailedButton} onPress={handleDetailedEntry}>
          <Text style={styles.detailedButtonText}>Add Details</Text>
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
    fontSize: 12,
    color: '#666',
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
});

export default QuickMoodEntry; 
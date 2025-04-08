import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { addMoodEntry, getActivities, getTags } from '../utils/database';
import { Ionicons } from '@expo/vector-icons';

const DetailedMoodEntry = ({ 
  initialRating = null, 
  initialEmotion = null, 
  onSave, 
  onCancel 
}) => {
  const [rating, setRating] = useState(initialRating);
  const [primaryEmotion, setPrimaryEmotion] = useState(initialEmotion);
  const [secondaryEmotions, setSecondaryEmotions] = useState([]);
  const [notes, setNotes] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activities, setActivities] = useState([]);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newActivity, setNewActivity] = useState('');

  // Emotions list
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

  // Ratings array
  const ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Load activities and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        const activitiesData = await getActivities();
        const tagsData = await getTags();
        
        setActivities(activitiesData);
        setTags(tagsData);
      } catch (error) {
        console.error('Error loading activities and tags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle selecting or deselecting a secondary emotion
  const toggleSecondaryEmotion = (emotion) => {
    if (secondaryEmotions.includes(emotion)) {
      setSecondaryEmotions(secondaryEmotions.filter(e => e !== emotion));
    } else {
      if (secondaryEmotions.length < 3) {
        setSecondaryEmotions([...secondaryEmotions, emotion]);
      } else {
        alert('You can select up to 3 secondary emotions');
      }
    }
  };

  // Handle selecting or deselecting an activity
  const toggleActivity = (activity) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter(a => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  // Handle selecting or deselecting a tag
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Add new tag
  const addNewTag = () => {
    if (newTag.trim() === '') return;
    
    const formattedTag = newTag.trim().toLowerCase();
    if (!tags.includes(formattedTag)) {
      setTags([...tags, formattedTag]);
    }
    
    if (!selectedTags.includes(formattedTag)) {
      setSelectedTags([...selectedTags, formattedTag]);
    }
    
    setNewTag('');
  };

  // Add new activity
  const addNewActivity = () => {
    if (newActivity.trim() === '') return;
    
    const formattedActivity = newActivity.trim();
    if (!activities.includes(formattedActivity)) {
      setActivities([...activities, formattedActivity]);
    }
    
    if (!selectedActivities.includes(formattedActivity)) {
      setSelectedActivities([...selectedActivities, formattedActivity]);
    }
    
    setNewActivity('');
  };

  // Save the detailed mood entry
  const handleSave = async () => {
    if (!rating || !primaryEmotion) {
      alert('Please select at least a rating and primary emotion');
      return;
    }

    setSubmitting(true);
    try {
      const moodEntry = {
        rating,
        emotion: primaryEmotion,
        secondaryEmotions,
        notes,
        date: new Date().toISOString(),
        activities: selectedActivities,
        tags: selectedTags
      };

      await addMoodEntry(moodEntry);
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving detailed mood entry:', error);
      alert('Failed to save your mood entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Detailed Mood Entry</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Ionicons name="close" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Rating Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood Intensity (1-10)</Text>
          <View style={styles.ratingContainer}>
            {ratings.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.ratingButton,
                  rating === r && styles.selectedRating,
                  { backgroundColor: getColorForRating(r) }
                ]}
                onPress={() => setRating(r)}
              >
                <Text style={styles.ratingText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Primary Emotion Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Emotion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.emotionContainer}>
              {EMOTIONS.map((emotion) => (
                <TouchableOpacity
                  key={emotion.value}
                  style={[
                    styles.emotionButton,
                    primaryEmotion === emotion.value && styles.selectedEmotion
                  ]}
                  onPress={() => setPrimaryEmotion(emotion.value)}
                >
                  <Text style={styles.emoji}>{emotion.emoji}</Text>
                  <Text style={styles.emotionText}>{emotion.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Secondary Emotions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Secondary Emotions (up to 3)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.emotionContainer}>
              {EMOTIONS.filter(e => e.value !== primaryEmotion).map((emotion) => (
                <TouchableOpacity
                  key={emotion.value}
                  style={[
                    styles.emotionButton,
                    secondaryEmotions.includes(emotion.value) && styles.selectedEmotion
                  ]}
                  onPress={() => toggleSecondaryEmotion(emotion.value)}
                >
                  <Text style={styles.emoji}>{emotion.emoji}</Text>
                  <Text style={styles.emotionText}>{emotion.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <View style={styles.tagContainer}>
            {activities.map((activity) => (
              <TouchableOpacity
                key={activity}
                style={[
                  styles.tag,
                  selectedActivities.includes(activity) && styles.selectedTag
                ]}
                onPress={() => toggleActivity(activity)}
              >
                <Text style={selectedActivities.includes(activity) ? styles.selectedTagText : styles.tagText}>
                  {activity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add new activity..."
              value={newActivity}
              onChangeText={setNewActivity}
            />
            <TouchableOpacity style={styles.addButton} onPress={addNewActivity}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagContainer}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  selectedTags.includes(tag) && styles.selectedTag
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={selectedTags.includes(tag) ? styles.selectedTagText : styles.tagText}>
                  #{tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add new tag..."
              value={newTag}
              onChangeText={setNewTag}
            />
            <TouchableOpacity style={styles.addButton} onPress={addNewTag}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="How are you feeling? What's on your mind?"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!rating || !primaryEmotion) && styles.disabledButton
          ]}
          onPress={handleSave}
          disabled={!rating || !primaryEmotion || submitting}
        >
          <Text style={styles.saveButtonText}>
            {submitting ? 'Saving...' : 'Save Entry'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getColorForRating = (rating) => {
  if (rating <= 2) return '#d32f2f'; // Very negative - red
  if (rating <= 4) return '#f57c00'; // Negative - orange
  if (rating <= 6) return '#fdd835'; // Neutral - yellow
  if (rating <= 8) return '#7cb342'; // Positive - light green
  return '#388e3c'; // Very positive - green
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ratingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 4,
  },
  selectedRating: {
    borderWidth: 2,
    borderColor: '#000',
  },
  ratingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emotionContainer: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  emotionButton: {
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: 80,
  },
  selectedEmotion: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F2FF',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  emotionText: {
    fontSize: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTag: {
    backgroundColor: '#E6F2FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  tagText: {
    fontSize: 14,
  },
  selectedTagText: {
    fontSize: 14,
    color: '#007AFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notesInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  disabledButton: {
    backgroundColor: '#A6C9FF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DetailedMoodEntry; 
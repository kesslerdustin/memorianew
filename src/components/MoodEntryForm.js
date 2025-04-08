import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { EMOTIONS, ACTIVITY_CATEGORIES } from '../data/models';
import { saveMoodEntry, generateId } from '../utils/database';

const MoodEntryForm = ({ onSave, onCancel, initialRating = 3, initialEmotion = null }) => {
  const [rating, setRating] = useState(initialRating);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Context and activities tracking (new)
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedSocialContext, setSelectedSocialContext] = useState(null);
  const [selectedWeather, setSelectedWeather] = useState(null);
  
  // Common tags for context
  const commonTags = [
    'Home', 'Work', 'Family', 'Friends', 'Alone', 
    'Outdoors', 'Exercise', 'Relaxing', 'Busy', 'Tired',
    'Productive', 'Socializing', 'Learning', 'Creating'
  ];
  
  // Location options
  const locationOptions = [
    'Home', 'Work', 'School', 'Commuting', 'Outdoors', 
    'Restaurant', 'Gym', 'Friend\'s place', 'Family\'s place', 'Other'
  ];
  
  // Social context options
  const socialContextOptions = [
    'Alone', 'With partner', 'With family', 'With friends', 
    'With colleagues', 'With strangers', 'In a crowd', 'Online socializing'
  ];
  
  // Weather options
  const weatherOptions = [
    { label: 'Sunny', emoji: '☀️' },
    { label: 'Cloudy', emoji: '☁️' },
    { label: 'Rainy', emoji: '🌧️' },
    { label: 'Stormy', emoji: '⛈️' },
    { label: 'Snowy', emoji: '❄️' },
    { label: 'Foggy', emoji: '🌫️' },
    { label: 'Hot', emoji: '🔥' },
    { label: 'Cold', emoji: '🧊' },
  ];
  
  // Use initialEmotion when component mounts
  useEffect(() => {
    if (initialEmotion) {
      const emotionObj = EMOTIONS.find(e => e.value === initialEmotion);
      if (emotionObj) {
        setSelectedEmotion(emotionObj);
      }
    }
  }, [initialEmotion]);
  
  // Handle submission of the form
  const handleSubmit = async () => {
    if (!selectedEmotion) {
      alert('Please select an emotion');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create a new mood entry with extended data
      const currentTime = Date.now();
      const newEntry = {
        id: generateId(),
        entry_time: currentTime,
        timestamp: new Date(currentTime),
        rating,
        emotion: selectedEmotion.value,
        notes,
        tags: selectedTags,
        activities: selectedActivities,
        location: selectedLocation,
        socialContext: selectedSocialContext,
        weather: selectedWeather
      };
      
      console.log("Saving mood entry with data:", {
        id: newEntry.id,
        entry_time: newEntry.entry_time,
        rating: newEntry.rating,
        emotion: newEntry.emotion,
        tags: newEntry.tags.length,
        activities: Object.keys(newEntry.activities).length,
        location: newEntry.location,
        socialContext: newEntry.socialContext,
        weather: newEntry.weather
      });
      
      // Save the entry
      const savedEntry = await saveMoodEntry(newEntry);
      
      if (savedEntry) {
        // Call the onSave callback with the new entry
        onSave && onSave(savedEntry);
      } else {
        alert('Failed to save mood entry. Please try again.');
      }
    } catch (error) {
      console.error('Error saving mood entry:', error);
      alert('An error occurred while saving your mood entry.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle tag selection
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Handle location selection
  const selectLocation = (location) => {
    setSelectedLocation(location === selectedLocation ? null : location);
  };
  
  // Handle social context selection
  const selectSocialContext = (context) => {
    setSelectedSocialContext(context === selectedSocialContext ? null : context);
  };
  
  // Handle weather selection
  const selectWeather = (weather) => {
    setSelectedWeather(weather === selectedWeather ? null : weather);
  };
  
  // Handle activity selection
  const toggleActivity = (category, value) => {
    if (selectedActivities[category] === value) {
      // Deselect if already selected
      const updatedActivities = {...selectedActivities};
      delete updatedActivities[category];
      setSelectedActivities(updatedActivities);
    } else {
      // Select new activity
      setSelectedActivities({
        ...selectedActivities,
        [category]: value
      });
    }
  };
  
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>How are you feeling?</Text>
        
        {/* Mood Rating Slider */}
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Mood Rating: {rating}/5</Text>
          <View style={styles.ratingButtons}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.ratingButton,
                  rating === value && styles.selectedRating,
                ]}
                onPress={() => setRating(value)}
              >
                <Text style={[
                  styles.ratingButtonText,
                  rating === value && styles.selectedRatingText,
                ]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Emotions Selection */}
        <Text style={styles.sectionTitle}>Select Primary Emotion</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emotionsContainer}>
          {EMOTIONS.map((emotion) => (
            <TouchableOpacity
              key={emotion.value}
              style={[
                styles.emotionButton,
                selectedEmotion?.value === emotion.value && styles.selectedEmotion,
              ]}
              onPress={() => setSelectedEmotion(emotion)}
            >
              <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
              <Text style={styles.emotionLabel}>{emotion.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Toggle for Advanced Options */}
        <TouchableOpacity 
          style={styles.advancedToggle}
          onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
        >
          <Text style={styles.advancedToggleLabel}>
            {showAdvancedOptions ? 'Hide Context Details' : 'Add Context Details'}
          </Text>
          <Switch 
            value={showAdvancedOptions}
            onValueChange={setShowAdvancedOptions}
            trackColor={{ false: '#ccc', true: '#81D4FA' }}
            thumbColor={showAdvancedOptions ? '#4A90E2' : '#f4f3f4'}
          />
        </TouchableOpacity>
        
        {showAdvancedOptions && (
          <>
            {/* Location Selection */}
            <Text style={styles.sectionTitle}>Where are you?</Text>
            <View style={styles.tagsContainer}>
              {locationOptions.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.tagButton,
                    selectedLocation === location && styles.selectedTag,
                  ]}
                  onPress={() => selectLocation(location)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedLocation === location && styles.selectedTagText,
                  ]}>
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Social Context Selection */}
            <Text style={styles.sectionTitle}>Who are you with?</Text>
            <View style={styles.tagsContainer}>
              {socialContextOptions.map((context) => (
                <TouchableOpacity
                  key={context}
                  style={[
                    styles.tagButton,
                    selectedSocialContext === context && styles.selectedTag,
                  ]}
                  onPress={() => selectSocialContext(context)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedSocialContext === context && styles.selectedTagText,
                  ]}>
                    {context}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Weather Selection */}
            <Text style={styles.sectionTitle}>How's the weather?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weatherContainer}>
              {weatherOptions.map((weather) => (
                <TouchableOpacity
                  key={weather.label}
                  style={[
                    styles.weatherButton,
                    selectedWeather === weather.label && styles.selectedWeather,
                  ]}
                  onPress={() => selectWeather(weather.label)}
                >
                  <Text style={styles.weatherEmoji}>{weather.emoji}</Text>
                  <Text style={styles.weatherLabel}>{weather.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Tags Selection */}
            <Text style={styles.sectionTitle}>Context Tags</Text>
            <View style={styles.tagsContainer}>
              {commonTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagButton,
                    selectedTags.includes(tag) && styles.selectedTag,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.selectedTagText,
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Activities Selection */}
            <Text style={styles.sectionTitle}>Activities</Text>
            {Object.entries(ACTIVITY_CATEGORIES).map(([key, category]) => (
              <View key={key} style={styles.activityCategory}>
                <Text style={styles.categoryLabel}>{category}</Text>
                <View style={styles.activityOptions}>
                  <TouchableOpacity
                    style={[
                      styles.activityButton,
                      selectedActivities[key] === 'low' && styles.selectedActivityLow,
                    ]}
                    onPress={() => toggleActivity(key, 'low')}
                  >
                    <Text style={styles.activityText}>Low</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.activityButton,
                      selectedActivities[key] === 'medium' && styles.selectedActivityMedium,
                    ]}
                    onPress={() => toggleActivity(key, 'medium')}
                  >
                    <Text style={styles.activityText}>Medium</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.activityButton,
                      selectedActivities[key] === 'high' && styles.selectedActivityHigh,
                    ]}
                    onPress={() => toggleActivity(key, 'high')}
                  >
                    <Text style={styles.activityText}>High</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
        
        {/* Notes Input */}
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="What's on your mind? (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={500}
        />
        
        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedEmotion && styles.disabledButton),
              isSaving && styles.savingButton
            ]}
            onPress={handleSubmit}
            disabled={!selectedEmotion || isSaving}
          >
            <Text style={styles.submitButtonText}>
              {isSaving ? 'Saving...' : 'Save Entry'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: '80%',
  },
  container: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  ratingContainer: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    color: '#555',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRating: {
    backgroundColor: '#4A90E2',
  },
  ratingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  selectedRatingText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: '#444',
  },
  emotionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  emotionButton: {
    width: 80,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedEmotion: {
    backgroundColor: '#E1F5FE',
    borderColor: '#4A90E2',
  },
  emotionEmoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  emotionLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#555',
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  advancedToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedTag: {
    backgroundColor: '#4A90E2',
    borderColor: '#2979FF',
  },
  tagText: {
    fontSize: 14,
    color: '#555',
  },
  selectedTagText: {
    color: 'white',
    fontWeight: 'bold',
  },
  weatherContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  weatherButton: {
    width: 80,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedWeather: {
    backgroundColor: '#E1F5FE',
    borderColor: '#4A90E2',
  },
  weatherEmoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  weatherLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#555',
  },
  activityCategory: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  activityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedActivityLow: {
    backgroundColor: '#A5D6A7', // Light green
    borderColor: '#66BB6A',
  },
  selectedActivityMedium: {
    backgroundColor: '#FFE082', // Yellow
    borderColor: '#FFD54F',
  },
  selectedActivityHigh: {
    backgroundColor: '#FFAB91', // Orange
    borderColor: '#FF8A65',
  },
  activityText: {
    fontSize: 14,
    color: '#555',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  submitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  savingButton: {
    backgroundColor: '#4A90E2',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default MoodEntryForm; 
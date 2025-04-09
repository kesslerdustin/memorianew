import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { EMOTIONS, ACTIVITY_CATEGORIES } from '../data/models';
import { saveMoodEntry, generateId } from '../utils/database';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle, VISUAL_STYLES, getRatingColor } from '../context/VisualStyleContext';
import * as Location from 'expo-location';
import { fetchWeatherData } from '../utils/weather';

const MoodEntryForm = ({ onSave, onCancel, initialRating = 3, initialEmotion = null, visualStyle, getMoodIcon }) => {
  const { t } = useLanguage();
  const localVisualStyle = useVisualStyle();
  
  // Use provided visual style helpers or fallback to context
  const actualGetMoodIcon = getMoodIcon || localVisualStyle.getMoodIcon;
  const actualVisualStyle = visualStyle || localVisualStyle.visualStyle;
  
  // Check if smileys should be shown
  const showSmileys = actualVisualStyle === VISUAL_STYLES.SMILEYS;
  
  // Check if decimal values are supported
  const supportsDecimal = actualVisualStyle === VISUAL_STYLES.SLIDER;

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
      alert(t('pleaseSelectEmotion'));
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create a new mood entry with extended data
      const currentTime = Date.now();
      
      // Prepare location data - store address string in main entry and full data in metadata
      let locationString = null;
      let locationData = null;
      
      if (locationEnabled && selectedLocation) {
        // Store readable location in main entry
        locationString = selectedLocation.address;
        
        // Store full location data for metadata
        locationData = {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address
        };
      }
      
      // Prepare weather data - store simple string in main entry and full data in metadata
      let weatherString = null;
      let weatherData = null;
      
      if (weatherEnabled && weather) {
        // Store readable weather in main entry
        weatherString = `${weather.condition}, ${weather.temperature}°C`;
        
        // Store full weather data for metadata
        weatherData = {
          condition: weather.condition,
          description: weather.description,
          temperature: weather.temperature,
          feelsLike: weather.feelsLike,
          icon: weather.icon,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          locationName: weather.locationName,
          country: weather.country,
          timestamp: Date.now()
        };
      }
      
      const newEntry = {
        id: generateId(),
        entry_time: currentTime,
        timestamp: new Date(currentTime),
        rating,
        emotion: selectedEmotion.value,
        notes,
        tags: selectedTags,
        activities: selectedActivities,
        location: locationString,
        socialContext: selectedSocialContext,
        weather: weatherString,
        // Add detailed data for metadata storage
        locationData: locationData,
        weatherData: weatherData
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
        weather: newEntry.weather,
        hasLocationData: !!newEntry.locationData,
        hasWeatherData: !!newEntry.weatherData
      });
      
      // Save the entry
      const savedEntry = await saveMoodEntry(newEntry);
      
      if (savedEntry) {
        // Call the onSave callback with the new entry
        onSave && onSave(savedEntry);
      } else {
        alert(t('failedToSaveMood'));
      }
    } catch (error) {
      console.error('Error saving mood entry:', error);
      alert(t('errorSavingMood'));
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
  
  // Handle rating change
  const handleRatingChange = (value) => {
    if (supportsDecimal) {
      // For slider style, round to 1 decimal place
      setRating(Math.round(value * 10) / 10);
    } else {
      // For other styles, use integer values
      setRating(Math.round(value));
    }
  };
  
  // Render the rating selector based on visual style
  const renderRatingSelector = () => {
    if (supportsDecimal) {
      return (
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={0.1}
            value={rating}
            minimumTrackTintColor={getRatingColor(rating)}
            maximumTrackTintColor="#CCCCCC"
            thumbTintColor={getRatingColor(rating)}
            onValueChange={handleRatingChange}
          />
          <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: getRatingColor(rating), marginVertical: 10 }}>
            {rating.toFixed(1)}
          </Text>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderMinLabel}>{t('veryBad')}</Text>
            <Text style={styles.sliderMaxLabel}>{t('veryGood')}</Text>
          </View>
        </View>
      );
    }
    
    // Default button-based rating selector for integer values
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>{t('moodRating')}: {rating}/5</Text>
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
              <Text style={styles.ratingButtonText}>
                {actualGetMoodIcon ? actualGetMoodIcon(value) : value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
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
  
  // Render emotion item with or without emoji based on visual style
  const renderEmotionItem = (emotion) => {
    return (
      <TouchableOpacity
        key={emotion.value}
        style={[
          styles.emotionButton,
          selectedEmotion?.value === emotion.value && styles.selectedEmotion,
        ]}
        onPress={() => setSelectedEmotion(emotion)}
      >
        {showSmileys && (
          <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
        )}
        <Text style={[
          styles.emotionLabel,
          !showSmileys && styles.noEmojiEmotionLabel
        ]}>
          {t(emotion.value)}
        </Text>
      </TouchableOpacity>
    );
  };

  const [locationEnabled, setLocationEnabled] = useState(false);
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [weather, setWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Request location permissions when location is enabled
  useEffect(() => {
    if (locationEnabled) {
      getLocation();
    }
  }, [locationEnabled]);

  // Fetch weather when location is available and weather is enabled
  useEffect(() => {
    if (selectedLocation && weatherEnabled) {
      getWeather();
    }
  }, [selectedLocation, weatherEnabled]);

  // Function to get current location
  const getLocation = async () => {
    setIsLoadingWeather(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('locationPermission'),
          t('locationPermissionDenied'),
          [{ text: t('ok') }]
        );
        setLocationEnabled(false);
        setIsLoadingWeather(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      // Get readable address
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      let address = '';
      if (addressResponse && addressResponse.length > 0) {
        const addressData = addressResponse[0];
        address = [
          addressData.name,
          addressData.street,
          addressData.city,
          addressData.region,
          addressData.country
        ]
          .filter(part => part)
          .join(', ');

        // Simplify to just city and country if available
        if (addressData.city) {
          address = addressData.city;
          if (addressData.country) {
            address += `, ${addressData.country}`;
          }
        }
      }

      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address || t('unknownLocation')
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        t('locationError'),
        t('unableToGetLocation'),
        [{ text: t('ok') }]
      );
      setLocationEnabled(false);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Function to get weather data
  const getWeather = async () => {
    if (!selectedLocation) return;

    setIsLoadingWeather(true);
    
    try {
      const weatherData = await fetchWeatherData(selectedLocation.latitude, selectedLocation.longitude);
      
      if (weatherData.isMockData) {
        Alert.alert(
          t('weatherNote'),
          t('usingOfflineWeatherData'),
          [{ text: t('ok') }]
        );
      }
      
      setWeather(weatherData);
    } catch (error) {
      console.error('Error fetching weather:', error);
      
      // Show more specific error for authentication issues
      if (error.message && error.message.includes('401')) {
        Alert.alert(
          t('weatherAPIError'),
          t('weatherAPIKeyError'),
          [{ text: t('ok') }]
        );
      } else {
        Alert.alert(
          t('weatherError'),
          t('unableToGetWeather'),
          [{ text: t('ok') }]
        );
      }
      setWeatherEnabled(false);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingView} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.container}>
            <Text style={styles.title}>{t('howAreYouFeeling')}</Text>
            
            {/* Mood Rating Slider */}
            {renderRatingSelector()}
            
            {/* Emotions Selection */}
            <Text style={styles.sectionTitle}>{t('selectPrimaryEmotion')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emotionsContainer}>
              {EMOTIONS.map(renderEmotionItem)}
            </ScrollView>
            
            {/* Notes Input */}
            <Text style={styles.sectionTitle}>{t('notes')}</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder={t('addNoteAboutHowYouFeel')}
              value={notes}
              onChangeText={setNotes}
            />
            
            {/* Toggle for Advanced Options */}
            <TouchableOpacity 
              style={styles.advancedToggle}
              onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              <Text style={styles.advancedToggleLabel}>
                {showAdvancedOptions ? t('hideContextDetails') : t('addContextDetails')}
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
                <Text style={styles.sectionTitle}>{t('whereAreYou')}</Text>
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
                <Text style={styles.sectionTitle}>{t('whoAreYouWith')}</Text>
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
                <Text style={styles.sectionTitle}>{t('howIsTheWeather')}</Text>
                <View style={styles.tagsContainer}>
                  {weatherOptions.map((weather) => (
                    <TouchableOpacity
                      key={weather.label}
                      style={[
                        styles.weatherButton,
                        selectedWeather === weather.label && styles.selectedTag,
                      ]}
                      onPress={() => selectWeather(weather.label)}
                    >
                      <Text style={styles.weatherEmoji}>{weather.emoji}</Text>
                      <Text style={[
                        styles.tagText,
                        selectedWeather === weather.label && styles.selectedTagText,
                      ]}>
                        {weather.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Tags */}
                <Text style={styles.sectionTitle}>{t('addTags')}</Text>
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
                
                {/* Activities */}
                <Text style={styles.sectionTitle}>{t('activities')}</Text>
                {Object.keys(ACTIVITY_CATEGORIES).map((category) => (
                  <View key={category} style={styles.activityCategory}>
                    <Text style={styles.activityCategoryLabel}>{ACTIVITY_CATEGORIES[category]}</Text>
                    <View style={styles.activityOptionsContainer}>
                      {['Low', 'Medium', 'High'].map((level) => (
                        <TouchableOpacity
                          key={`${category}-${level}`}
                          style={[
                            styles.activityOption,
                            selectedActivities[category] === level && styles.selectedActivityOption,
                          ]}
                          onPress={() => toggleActivity(category, level)}
                        >
                          <Text style={[
                            styles.activityOptionText,
                            selectedActivities[category] === level && styles.selectedActivityOptionText,
                          ]}>
                            {level}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}
            
            {/* Location and Weather section */}
            <Text style={styles.sectionTitle}>{t('additionalContext')}</Text>
            
            {/* Location toggle */}
            <View style={styles.contextRow}>
              <View style={styles.contextInfo}>
                <Text style={styles.contextLabel}>{t('addLocation')}</Text>
                <Text style={styles.contextDescription}>{t('locationDescription')}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.contextButton, locationEnabled && styles.contextButtonActive]}
                onPress={() => setLocationEnabled(!locationEnabled)}
                disabled={isLoadingWeather}
              >
                {isLoadingWeather ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.contextButtonText}>
                    {locationEnabled ? t('enabled') : t('disabled')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            
            {locationEnabled && selectedLocation && (
              <View style={styles.contextDataContainer}>
                <Text style={styles.contextDataLabel}>{t('currentLocation')}</Text>
                <Text style={styles.contextDataValue}>{selectedLocation.address}</Text>
              </View>
            )}
            
            {/* Weather toggle */}
            <View style={styles.contextRow}>
              <View style={styles.contextInfo}>
                <Text style={styles.contextLabel}>{t('addWeather')}</Text>
                <Text style={styles.contextDescription}>{t('weatherDescription')}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.contextButton, weatherEnabled && styles.contextButtonActive]}
                onPress={() => setWeatherEnabled(!weatherEnabled)}
                disabled={isLoadingWeather || !locationEnabled}
              >
                {isLoadingWeather ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.contextButtonText}>
                    {weatherEnabled ? t('enabled') : t('disabled')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            
            {weatherEnabled && weather && (
              <View style={styles.contextDataContainer}>
                <Text style={styles.contextDataLabel}>{t('currentWeather')}</Text>
                <View style={styles.weatherDisplay}>
                  {weather.icon && (
                    <Text style={styles.weatherIcon}>{getWeatherEmoji(weather.condition)}</Text>
                  )}
                  <Text style={styles.contextDataValue}>
                    {weather.condition}, {weather.temperature}°C
                  </Text>
                </View>
              </View>
            )}
            
            {/* Add padding at the bottom to ensure scroll shows all content */}
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
        
        {/* Fixed Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onCancel}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? t('saving') : t('save')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// Helper function to convert weather condition to emoji
const getWeatherEmoji = (condition) => {
  const conditionLower = condition ? condition.toLowerCase() : '';
  
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return '☀️';
  if (conditionLower.includes('cloud')) return '☁️';
  if (conditionLower.includes('rain')) return '🌧️';
  if (conditionLower.includes('storm') || conditionLower.includes('thunder')) return '⛈️';
  if (conditionLower.includes('snow') || conditionLower.includes('flurr')) return '❄️';
  if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '🌫️';
  if (conditionLower.includes('wind')) return '💨';
  if (conditionLower.includes('haz')) return '⚠️';
  
  // Default
  return '🌡️';
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ratingButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  selectedRating: {
    backgroundColor: '#4A90E2',
  },
  ratingButtonText: {
    fontSize: 28,
  },
  selectedRatingText: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  emotionsContainer: {
    marginBottom: 20,
  },
  emotionButton: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 100,
  },
  selectedEmotion: {
    borderColor: '#4A90E2',
    backgroundColor: '#E1F5FE',
  },
  emotionEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  emotionLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  noEmojiEmotionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  notesInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  advancedToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    paddingVertical: 4,
  },
  tagButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F1F1',
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
  },
  selectedTag: {
    backgroundColor: '#4A90E2',
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTagText: {
    color: 'white',
  },
  weatherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F1F1',
    marginRight: 8,
    marginBottom: 8,
    minWidth: 100,
  },
  weatherEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  activityCategory: {
    marginBottom: 16,
  },
  activityCategoryLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  activityOptionsContainer: {
    flexDirection: 'row',
  },
  activityOption: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 4,
    borderRadius: 4,
  },
  selectedActivityOption: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  activityOptionText: {
    color: '#333',
  },
  selectedActivityOptionText: {
    color: 'white',
  },
  bottomSpacer: {
    height: 70,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sliderContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 5,
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
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contextInfo: {
    flex: 1,
    marginRight: 12,
  },
  contextLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contextDescription: {
    fontSize: 12,
    color: '#666',
  },
  contextButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },
  contextButtonActive: {
    backgroundColor: '#4CAF50',
  },
  contextButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  contextDataContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  contextDataLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  contextDataValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  weatherDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 24,
    marginRight: 8,
  },
});

export default MoodEntryForm; 
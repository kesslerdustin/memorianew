import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { EMOTIONS, ACTIVITY_CATEGORIES } from '../data/models';
import { generateId } from '../database/MoodsDB';
import { addMood } from '../services/DatabaseService';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle, VISUAL_STYLES, getRatingColor } from '../context/VisualStyleContext';
import { usePeople } from '../context/PeopleContext';
import * as Location from 'expo-location';
import { fetchWeatherData } from '../utils/weather';

const MoodEntryForm = ({ onSave, onCancel, initialRating = 3, initialEmotion = null, visualStyle, getMoodIcon }) => {
  const { t } = useLanguage();
  const localVisualStyle = useVisualStyle();
  const { people, addPerson } = usePeople();
  
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
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  
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
      
      if (selectedLocation) {
        // Store readable location in main entry
        locationString = selectedLocation.address;
        
        // Store full location data for metadata
        locationData = {
          ...selectedLocation,
          // Ensure these fields exist even if null
          latitude: selectedLocation.latitude || null,
          longitude: selectedLocation.longitude || null,
          locationType: selectedLocation.locationType || 'predefined'
        };
      }
      
      // Prepare weather data - store simple string in main entry and full data in metadata
      let weatherString = null;
      let weatherData = null;
      
      if (selectedWeather) {
        // Store readable weather in main entry
        weatherString = `${selectedWeather}, 20°C`;
        
        // Store full weather data for metadata
        weatherData = {
          condition: selectedWeather,
          temperature: 20,
          description: selectedWeather,
          timestamp: new Date().toISOString(),
          source: 'manual'
        };
      } else if (weather) {
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
          timestamp: Date.now(),
          source: weather.source || 'api'
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
        // Add people data
        people: selectedPeople,
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
        people: newEntry.people.length,
        hasLocationData: !!newEntry.locationData,
        hasWeatherData: !!newEntry.weatherData
      });
      
      // Use the enhanced function that maintains cross-database relationships
      // (Moods with locations will link to places, mood context will create people, etc.)
      const savedEntryId = await addMood(newEntry);
      
      if (savedEntryId) {
        // Call the onSave callback with the new entry
        onSave && onSave({...newEntry, id: savedEntryId});
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
    // If location is a string (from predefined list), convert to object format
    if (typeof location === 'string') {
      location = {
        address: location,
        latitude: null,
        longitude: null,
        locationType: 'predefined'
      };
    } else if (location && !location.locationType) {
      // Add locationType to GPS locations
      location.locationType = 'gps';
    }
    
    setSelectedLocation(location);
    
    // Don't try to reload weather if we already have some
    if (!weather && !weatherLoading && location && location.latitude && location.longitude) {
      getWeather(location);
    }
  };
  
  // Handle social context selection
  const selectSocialContext = (context) => {
    setSelectedSocialContext(context === selectedSocialContext ? null : context);
  };
  
  // Handle weather selection
  const selectWeather = (weatherCondition) => {
    setSelectedWeather(weatherCondition);
    
    // If we're toggling off the current selection, just clear it
    if (weatherCondition === selectedWeather) {
      setSelectedWeather(null);
      return;
    }
    
    // Create weather data if not fetched from API
    if (!weather) {
      // Create basic weather data
      setWeather({
        condition: weatherCondition,
        temperature: 20, // Default temperature
        description: weatherCondition,
        timestamp: new Date().toISOString(),
        source: 'manual'
      });
    } else {
      // Update existing weather data
      setWeather({
        ...weather,
        condition: weatherCondition,
        source: 'manual'
      });
    }
    
    setWeatherEnabled(true);
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

  const [locationEnabled, setLocationEnabled] = useState(true);
  const [weatherEnabled, setWeatherEnabled] = useState(true);
  const [weather, setWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

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
        address: address || t('unknownLocation'),
        locationType: 'gps'
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
  const getWeather = async (providedLocation) => {
    if (weatherLoading) return;
    
    setWeatherLoading(true);
    setWeatherError(null);
    
    try {
      let locationToUse = providedLocation || selectedLocation;
      
      // If no location provided and no selected location with coordinates, try to get current location
      if (!locationToUse || !locationToUse.latitude || !locationToUse.longitude) {
        try {
          const { coords } = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
          
          // Get readable address for the coordinates
          const addressResponse = await Location.reverseGeocodeAsync({
            latitude: coords.latitude,
            longitude: coords.longitude
          });

          let address = t('currentLocation');
          if (addressResponse && addressResponse.length > 0) {
            const addressData = addressResponse[0];
            // Simplify to just city and country if available
            if (addressData.city) {
              address = addressData.city;
              if (addressData.country) {
                address += `, ${addressData.country}`;
              }
            }
          }
          
          locationToUse = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            address: address,
            locationType: 'gps'
          };
          
          // Update selected location if none was set
          setSelectedLocation(locationToUse);
          setLocationEnabled(true);
        } catch (locError) {
          console.error('Error getting current location for weather:', locError);
          setWeatherError(t('locationAccessError') || 'Could not access location');
          setWeatherLoading(false);
          return;
        }
      }
      
      // Get weather from API
      const weatherData = await fetchWeatherData(locationToUse.latitude, locationToUse.longitude);
      if (weatherData) {
        // Mark the weather data as coming from the API
        const apiWeatherData = {
          ...weatherData,
          source: 'api'
        };
        
        setWeather(apiWeatherData);
        // Automatically select the weather condition
        setSelectedWeather(apiWeatherData.condition);
        setWeatherEnabled(true);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherError(error.message || t('weatherFetchError') || 'Error fetching weather data');
    } finally {
      setWeatherLoading(false);
    }
  };

  // Handle selection of a person
  const togglePersonSelection = (personId) => {
    if (selectedPeople.includes(personId)) {
      setSelectedPeople(selectedPeople.filter(id => id !== personId));
    } else {
      setSelectedPeople([...selectedPeople, personId]);
    }
  };
  
  // Handle adding a new person
  const handleAddNewPerson = async () => {
    if (!newPersonName || newPersonName.trim() === '') {
      return;
    }
    
    try {
      const newPerson = {
        id: generateId(),
        name: newPersonName.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await addPerson(newPerson);
      
      // Add the new person to selected people
      setSelectedPeople([...selectedPeople, newPerson.id]);
      setNewPersonName('');
    } catch (error) {
      console.error('Error adding new person:', error);
      Alert.alert(t('error'), t('errorAddingPerson'));
    }
  };

  // Render people section
  const renderPeopleSection = () => {
    return (
      <View style={styles.fieldSection}>
        <Text style={styles.fieldLabel}>{t('peopleWithYou') || 'People With You'}</Text>
        
        {/* Add new person input */}
        <View style={styles.addPersonContainer}>
          <TextInput
            style={styles.addPersonInput}
            placeholder={t('addNewPerson') || "Add new person..."}
            value={newPersonName}
            onChangeText={setNewPersonName}
          />
          <TouchableOpacity
            style={styles.addPersonButton}
            onPress={handleAddNewPerson}
            disabled={!newPersonName.trim()}
          >
            <Text style={styles.addPersonButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {/* Existing people list */}
        <View style={styles.peopleContainer}>
          {people.length > 0 ? (
            <View style={styles.peopleList}>
              {people.map(person => (
                <TouchableOpacity
                  key={person.id}
                  style={[
                    styles.personItem,
                    selectedPeople.includes(person.id) && styles.selectedPerson
                  ]}
                  onPress={() => togglePersonSelection(person.id)}
                >
                  <Text style={styles.personEmoji}>👤</Text>
                  <Text style={styles.personName}>{person.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyListText}>{t('noPeople') || 'No people added yet'}</Text>
          )}
        </View>
      </View>
    );
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
            
            {/* Locations - Main UI */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>{t('location')}</Text>
              <View style={styles.optionContainer}>
                {locationOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      selectedLocation && selectedLocation.address === option && styles.selectedOption
                    ]}
                    onPress={() => selectLocation(option)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedLocation && selectedLocation.address === option ? { color: 'white' } : null
                    ]}>{option}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.optionButton, 
                    selectedLocation && selectedLocation.locationType === 'gps' ? styles.selectedOption : styles.specialOption
                  ]}
                  onPress={getLocation}
                  disabled={isLoadingWeather}
                >
                  {isLoadingWeather ? (
                    <ActivityIndicator size="small" color="#333" />
                  ) : (
                    <Text style={[
                      styles.optionText,
                      selectedLocation && selectedLocation.locationType === 'gps' ? { color: 'white' } : { color: 'white' }
                    ]}>📍 {t('currentLocation')}</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Show currently selected location */}
              {selectedLocation && (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationInfoText}>
                    {selectedLocation.locationType === 'gps' 
                      ? `📍 ${selectedLocation.address}` 
                      : selectedLocation.address}
                  </Text>
                </View>
              )}
            </View>
            
            {/* People Section - Add this here */}
            {renderPeopleSection()}
            
            {/* Weather */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>{t('weather')}</Text>
              <View style={styles.optionContainer}>
                {weatherOptions.map(option => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.optionButton,
                      selectedWeather === option.label && styles.selectedOption
                    ]}
                    onPress={() => selectWeather(option.label)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedWeather === option.label ? { color: 'white' } : null
                    ]}>{option.emoji} {option.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.optionButton, 
                    weather && weather.source === 'api' ? styles.selectedOption : styles.specialOption
                  ]}
                  onPress={() => getWeather()}
                  disabled={weatherLoading}
                >
                  {weatherLoading ? (
                    <ActivityIndicator size="small" color="#333" />
                  ) : (
                    <Text style={[
                      styles.optionText,
                      weather && weather.source === 'api' ? { color: 'white' } : { color: 'white' }
                    ]}>🌤️ {t('currentWeather')}</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              {weatherError && (
                <Text style={styles.errorText}>{weatherError}</Text>
              )}
              
              {weather && (
                <View style={styles.weatherInfo}>
                  <Text style={styles.weatherInfoText}>
                    {weather.condition}, {weather.temperature !== undefined ? `${weather.temperature}°C` : ''}
                  </Text>
                </View>
              )}
            </View>
            
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
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    paddingVertical: 4,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F1F1',
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
  },
  selectedOption: {
    backgroundColor: '#4A90E2',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  specialOption: {
    backgroundColor: '#4A90E2',
  },
  addPersonContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  addPersonInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  addPersonButton: {
    backgroundColor: '#FFD54F',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPersonButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  peopleContainer: {
    marginTop: 10,
  },
  peopleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    margin: 4,
    borderRadius: 20,
  },
  selectedPerson: {
    backgroundColor: '#FFD54F',
  },
  personEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  personName: {
    fontSize: 14,
  },
  emptyListText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  weatherInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  weatherInfoText: {
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    marginTop: 8,
    color: '#d32f2f',
    fontSize: 14,
  },
  selectedLocationInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  selectedLocationText: {
    fontSize: 14,
    color: '#333',
  },
  locationInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  locationInfoText: {
    fontSize: 14,
    color: '#333',
  },
});

export default MoodEntryForm; 
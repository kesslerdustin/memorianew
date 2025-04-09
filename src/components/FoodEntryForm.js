import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Image, Alert, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../context/LanguageContext';
import { useFood } from '../context/FoodContext';
import { usePeople } from '../context/PeopleContext';
import { usePlaces } from '../context/PlacesContext';
import { useVisualStyle } from '../context/VisualStyleContext';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';

// Define meal types
const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { value: 'lunch', label: 'Lunch', emoji: '🥪' },
  { value: 'dinner', label: 'Dinner', emoji: '🍲' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
  { value: 'drink', label: 'Drink', emoji: '🥤' },
];

const FoodEntryForm = ({ route = {}, onClose }) => {
  const { editEntry } = route.params || {};
  const { t } = useLanguage();
  const { addFoodEntry, updateFoodEntry } = useFood();
  const { people, addPerson } = usePeople();
  const { places, addPlace } = usePlaces();
  const { getMoodIcon, visualStyle } = useVisualStyle();
  
  // Handle the case where navigation is not available
  let navigation;
  try {
    navigation = useNavigation();
  } catch (error) {
    // Navigation is not available, we'll use onClose prop instead
    navigation = null;
  }
  
  // State for form fields
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPeoplePicker, setShowPeoplePicker] = useState(false);
  const [showPlacePicker, setShowPlacePicker] = useState(false);
  
  // New state for person creation
  const [isAddPersonModalVisible, setIsAddPersonModalVisible] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmoji, setNewPersonEmoji] = useState('👤');
  
  // New state for location tracking
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isAddPlaceModalVisible, setIsAddPlaceModalVisible] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceEmoji, setNewPlaceEmoji] = useState('📍');
  
  // New state for mood tracking and restaurant details
  const [moodRating, setMoodRating] = useState(3);
  const [moodEmotion, setMoodEmotion] = useState(null);
  const [foodRating, setFoodRating] = useState(5);
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [showMoodSection, setShowMoodSection] = useState(false);
  
  // Constant for emotions (same as in MoodScreen)
  const EMOTIONS = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'satisfied', label: 'Satisfied', emoji: '😌' },
    { value: 'grateful', label: 'Grateful', emoji: '🙏' },
    { value: 'excited', label: 'Excited', emoji: '🤩' },
    { value: 'content', label: 'Content', emoji: '🙂' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' },
    { value: 'disappointed', label: 'Disappointed', emoji: '😕' },
    { value: 'guilty', label: 'Guilty', emoji: '😣' },
    { value: 'uncomfortable', label: 'Uncomfortable', emoji: '😫' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
  ];

  useEffect(() => {
    if (editEntry) {
      setName(editEntry.name || '');
      setCalories(editEntry.calories ? editEntry.calories.toString() : '');
      setProtein(editEntry.protein ? editEntry.protein.toString() : '');
      setCarbs(editEntry.carbs ? editEntry.carbs.toString() : '');
      setFat(editEntry.fat ? editEntry.fat.toString() : '');
      setMealType(editEntry.mealType || 'breakfast');
      setDate(new Date(editEntry.date) || new Date());
      setNotes(editEntry.notes || '');
      setImageUri(editEntry.image_uri || null);
      setSelectedPeople(editEntry.people || []);
      setSelectedPlace(editEntry.place || null);
    }
  }, [editEntry]);

  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle save
  const handleSave = async () => {
    if (!name) {
      alert(t('pleaseEnterFoodName') || 'Please enter a food name');
      return;
    }

    try {
      const newFoodEntry = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        calories: calories ? parseInt(calories) : 0,
        protein: protein ? parseFloat(protein) : 0,
        carbs: carbs ? parseFloat(carbs) : 0,
        fat: fat ? parseFloat(fat) : 0,
        meal_type: mealType,
        date,
        notes,
        image_uri: imageUri,
        people: selectedPeople,
        place: selectedPlace,
        // Add new data for mood tracking and restaurant info
        mood_rating: showMoodSection ? moodRating : null,
        mood_emotion: showMoodSection ? moodEmotion : null,
        food_rating: foodRating,
        is_restaurant: isRestaurant,
        restaurant_name: isRestaurant ? restaurantName : null
      };
      
      // Use context to add the entry
      const savedEntry = await addFoodEntry(newFoodEntry);
      
      // Close form using appropriate method
      if (navigation) {
        navigation.goBack();
      } else if (onClose) {
        onClose(savedEntry);
      }
    } catch (error) {
      console.error('Error saving food entry:', error);
      alert(t('errorSavingFoodEntry') || 'Error saving food entry');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (navigation) {
      navigation.goBack();
    } else if (onClose) {
      onClose();
    }
  };

  // Image picker
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert(t('permissionRequired') || 'Permission to access camera roll is required!');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Take photo
  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert(t('permissionRequired') || 'Permission to access camera is required!');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Remove image
  const removeImage = () => {
    setImageUri(null);
  };

  // Toggle person selection
  const togglePersonSelection = (personId) => {
    if (selectedPeople.includes(personId)) {
      setSelectedPeople(selectedPeople.filter(id => id !== personId));
    } else {
      setSelectedPeople([...selectedPeople, personId]);
    }
  };

  // Toggle place selection
  const togglePlaceSelection = (placeId) => {
    if (selectedPlace === placeId) {
      setSelectedPlace(null);
    } else {
      setSelectedPlace(placeId);
    }
  };
  
  // Handle adding a new person
  const handleAddPerson = async () => {
    if (!newPersonName.trim()) {
      Alert.alert(
        t('error') || 'Error',
        t('pleaseEnterPersonName') || 'Please enter a name for the person'
      );
      return;
    }
    
    try {
      // Match the structure from GlossarScreen's AddEditPersonScreen
      const newPerson = {
        name: newPersonName,
        context: 'Friend', // Default context
        status: '',       // Empty status initially
        birthDate: new Date(),
        isDeceased: false,
        hobbies: [],
        interests: [],
        phoneNumber: '',
        email: '',
        socials: '',
        deceasedDate: null
      };
      
      const personId = await addPerson(newPerson);
      
      // Add the new person to selected people
      setSelectedPeople([...selectedPeople, personId]);
      
      // Reset form and close modal
      setNewPersonName('');
      setIsAddPersonModalVisible(false);
    } catch (error) {
      console.error('Error adding person:', error);
      Alert.alert(
        t('error') || 'Error',
        t('errorAddingPerson') || 'Error adding person'
      );
    }
  };
  
  // Handle getting current location
  const handleGetLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissionDenied') || 'Permission Denied',
          t('locationPermissionDenied') || 'Location permission is needed to add your current location'
        );
        return;
      }

      setIsGettingLocation(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      
      // Reverse geocode to get address
      const geocodeResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      let address = '';
      if (geocodeResult && geocodeResult.length > 0) {
        const addressData = geocodeResult[0];
        const parts = [
          addressData.street,
          addressData.city,
          addressData.region,
          addressData.country
        ].filter(Boolean);
        address = parts.join(', ');
      }

      setCurrentLocation({
        coords: {
          latitude,
          longitude
        },
        address
      });
      
      // Automatically set new place name to the address
      setNewPlaceName(address || t('currentLocation') || 'Current Location');
      setIsGettingLocation(false);
      setIsAddPlaceModalVisible(true);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        t('error') || 'Error',
        t('errorGettingLocation') || 'Error getting location'
      );
      setIsGettingLocation(false);
    }
  };
  
  // Handle adding a new place
  const handleAddPlace = async () => {
    if (!newPlaceName.trim() || !currentLocation) {
      Alert.alert(
        t('error') || 'Error',
        t('invalidPlaceInfo') || 'Please provide a valid place name and location'
      );
      return;
    }
    
    try {
      const newPlace = {
        name: newPlaceName,
        address: currentLocation.address,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        emoji: newPlaceEmoji
      };
      
      const placeId = await addPlace(newPlace);
      
      // Select the new place
      setSelectedPlace(placeId);
      
      // Reset form and close modal
      setNewPlaceName('');
      setNewPlaceEmoji('📍');
      setIsAddPlaceModalVisible(false);
    } catch (error) {
      console.error('Error adding place:', error);
      Alert.alert(
        t('error') || 'Error',
        t('errorAddingPlace') || 'Error adding place'
      );
    }
  };

  // Analyze food image
  const handleAnalyzeFood = async () => {
    if (!imageUri) {
      alert(t('pleaseAddImage') || 'Please add an image to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      // This would be implemented in the context to connect to an API
      // For now, we'll just simulate a successful analysis with mock data
      setTimeout(() => {
        setName('Chicken Salad');
        setCalories('350');
        setProtein('25');
        setCarbs('15');
        setFat('20');
        setIsAdvancedMode(true);
        setIsAnalyzing(false);
      }, 2000);
    } catch (error) {
      console.error('Error analyzing food:', error);
      alert(t('errorAnalyzingFood') || 'Error analyzing food');
      setIsAnalyzing(false);
    }
  };

  const getPersonName = (personId) => {
    const person = people.find(p => p.id === personId);
    return person ? person.name : 'Unknown';
  };

  const getPlaceName = (placeId) => {
    const place = places.find(p => p.id === placeId);
    return place ? place.name : 'Unknown';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{editEntry ? 'Edit Food Entry' : 'Add Food Entry'}</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>{t('cancel') || 'Cancel'}</Text>
        </TouchableOpacity>
      </View>

      {/* Image Upload Section */}
      <View style={styles.imageSection}>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.foodImage} />
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.imageButton} onPress={removeImage}>
                <Text style={styles.imageButtonText}>{t('removeImage') || 'Remove'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.analyzeButton, isAnalyzing && styles.analyzingButton]} 
                onPress={handleAnalyzeFood}
                disabled={isAnalyzing}
              >
                <Text style={styles.analyzeButtonText}>
                  {isAnalyzing 
                    ? (t('analyzing') || 'Analyzing...') 
                    : (t('analyzeFood') || 'Analyze Food')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imagePicker}>
            <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
              <Text style={styles.imagePickerIcon}>🖼️</Text>
              <Text style={styles.imagePickerText}>{t('chooseImage') || 'Choose Image'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePickerButton} onPress={handleTakePhoto}>
              <Text style={styles.imagePickerIcon}>📷</Text>
              <Text style={styles.imagePickerText}>{t('takePhoto') || 'Take Photo'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Food Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('foodName') || 'Food Name'} *</Text>
        <TextInput
          style={styles.input}
          placeholder={t('enterFoodName') || 'Enter food name'}
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Meal Type Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('mealType') || 'Meal Type'}</Text>
        <View style={styles.mealTypeContainer}>
          {MEAL_TYPES.map((meal) => (
            <TouchableOpacity
              key={meal.value}
              style={[
                styles.mealTypeButton,
                mealType === meal.value && styles.selectedMealType
              ]}
              onPress={() => setMealType(meal.value)}
            >
              <Text style={styles.mealTypeEmoji}>{meal.emoji}</Text>
              <Text style={styles.mealTypeText}>{t(meal.value) || meal.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Date and Time */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('date') || 'Date & Time'}</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            is24Hour={true}
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>

      {/* Calories (Basic info always visible) */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('calories') || 'Calories (kcal)'}</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          keyboardType="numeric"
          value={calories}
          onChangeText={setCalories}
        />
      </View>

      {/* Advanced Nutrition Switch */}
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>{t('advancedNutrition') || 'Advanced Nutrition Info'}</Text>
        <Switch
          value={isAdvancedMode}
          onValueChange={setIsAdvancedMode}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isAdvancedMode ? '#4CAF50' : '#f4f3f4'}
        />
      </View>

      {/* Advanced Nutrition Fields (conditional) */}
      {isAdvancedMode && (
        <View style={styles.advancedFields}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('protein') || 'Protein (g)'}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={protein}
              onChangeText={setProtein}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('carbs') || 'Carbs (g)'}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={carbs}
              onChangeText={setCarbs}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('fat') || 'Fat (g)'}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={fat}
              onChangeText={setFat}
            />
          </View>
        </View>
      )}

      {/* People */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('peopleSharing') || 'People Sharing This Meal'}</Text>
        <View style={styles.peopleContainer}>
          {people.length > 0 ? (
            <>
              {people.map(person => (
                <TouchableOpacity
                  key={person.id}
                  style={[
                    styles.personButton,
                    selectedPeople.includes(person.id) && styles.selectedPerson
                  ]}
                  onPress={() => togglePersonSelection(person.id)}
                >
                  <Text style={styles.personEmoji}>{person.emoji || '👤'}</Text>
                  <Text style={styles.personName}>{person.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={() => setIsAddPersonModalVisible(true)}
              >
                <Text style={styles.addNewButtonIcon}>+</Text>
                <Text style={styles.addNewButtonText}>{t('addPerson') || 'Add Person'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyListText}>{t('noPeople') || 'No people added yet'}</Text>
              <TouchableOpacity
                style={[styles.addNewButton, { marginTop: 10 }]}
                onPress={() => setIsAddPersonModalVisible(true)}
              >
                <Text style={styles.addNewButtonIcon}>+</Text>
                <Text style={styles.addNewButtonText}>{t('addPerson') || 'Add Person'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Places */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('place') || 'Place'}</Text>
        <View style={styles.placesContainer}>
          {places.length > 0 ? (
            <>
              {places.map(place => (
                <TouchableOpacity
                  key={place.id}
                  style={[
                    styles.placeButton,
                    selectedPlace === place.id && styles.selectedPlace
                  ]}
                  onPress={() => togglePlaceSelection(place.id)}
                >
                  <Text style={styles.placeEmoji}>{place.emoji || '📍'}</Text>
                  <Text style={styles.placeName}>{place.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleGetLocation}
                disabled={isGettingLocation}
              >
                <MaterialIcons name="my-location" size={16} color="#fff" />
                <Text style={styles.locationButtonText}>
                  {isGettingLocation 
                    ? (t('gettingLocation') || 'Getting location...') 
                    : (t('getCurrentLocation') || 'Get Current Location')}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyListText}>{t('noPlaces') || 'No places added yet'}</Text>
              <TouchableOpacity
                style={[styles.locationButton, { marginTop: 10 }]}
                onPress={handleGetLocation}
                disabled={isGettingLocation}
              >
                <MaterialIcons name="my-location" size={16} color="#fff" />
                <Text style={styles.locationButtonText}>
                  {isGettingLocation 
                    ? (t('gettingLocation') || 'Getting location...') 
                    : (t('getCurrentLocation') || 'Get Current Location')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Restaurant Switch */}
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>{t('isRestaurant') || 'Restaurant'}</Text>
        <Switch
          value={isRestaurant}
          onValueChange={setIsRestaurant}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isRestaurant ? '#4CAF50' : '#f4f3f4'}
        />
      </View>
      
      {/* Restaurant Name (when isRestaurant is true) */}
      {isRestaurant && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('restaurantName') || 'Restaurant Name'}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enterRestaurantName') || 'Enter restaurant name'}
            value={restaurantName}
            onChangeText={setRestaurantName}
          />
        </View>
      )}
      
      {/* Food Rating */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('foodRating') || 'Food Rating'}</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map(rating => (
            <TouchableOpacity
              key={`food-rating-${rating}`}
              style={[
                styles.ratingButton,
                foodRating === rating && styles.selectedRating
              ]}
              onPress={() => setFoodRating(rating)}
            >
              <Text style={styles.ratingText}>{rating}</Text>
              <Text style={styles.ratingEmoji}>
                {rating === 1 ? '🙁' : 
                 rating === 2 ? '😐' : 
                 rating === 3 ? '🙂' : 
                 rating === 4 ? '😊' : '😍'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Mood Tracking Switch */}
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>{t('trackMood') || 'Track Mood'}</Text>
        <Switch
          value={showMoodSection}
          onValueChange={setShowMoodSection}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={showMoodSection ? '#FFD54F' : '#f4f3f4'}
        />
      </View>
      
      {/* Mood Rating and Emotion (when showMoodSection is true) */}
      {showMoodSection && (
        <View style={styles.moodContainer}>
          <Text style={styles.moodSectionTitle}>{t('howDoYouFeel') || 'How do you feel about this meal?'}</Text>
          
          {/* Mood Rating */}
          <View style={styles.moodRatingContainer}>
            <Text style={styles.moodRatingLabel}>{t('moodRating') || 'Mood Rating:'}</Text>
            <View style={styles.moodRatingButtons}>
              {[1, 2, 3, 4, 5].map(rating => (
                <TouchableOpacity
                  key={`mood-rating-${rating}`}
                  style={[
                    styles.moodRatingButton,
                    moodRating === rating && styles.selectedMoodRating
                  ]}
                  onPress={() => setMoodRating(rating)}
                >
                  <Text style={styles.moodRatingText}>{rating}</Text>
                  <Text style={styles.moodRatingEmoji}>
                    {getMoodIcon ? getMoodIcon(rating) : 
                      (rating === 1 ? '😞' : 
                       rating === 2 ? '😔' : 
                       rating === 3 ? '😐' : 
                       rating === 4 ? '🙂' : '😊')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Mood Emotion */}
          <Text style={styles.emotionLabel}>{t('emotion') || 'Emotion:'}</Text>
          <View style={styles.emotionsContainer}>
            {EMOTIONS.map(emotion => (
              <TouchableOpacity
                key={emotion.value}
                style={[
                  styles.emotionButton,
                  moodEmotion === emotion.value && styles.selectedEmotion
                ]}
                onPress={() => setMoodEmotion(emotion.value)}
              >
                <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                <Text style={styles.emotionText}>{t(emotion.value) || emotion.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Notes */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('notes') || 'Notes'}</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder={t('addNotes') || 'Add notes about this meal'}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {/* Modal for adding a new person */}
      <Modal
        visible={isAddPersonModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAddPersonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('addPerson') || 'Add Person'}</Text>
              <TouchableOpacity onPress={() => setIsAddPersonModalVisible(false)}>
                <Text style={styles.closeModalButton}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>{t('name') || 'Name'}</Text>
              <TextInput
                style={styles.modalInput}
                value={newPersonName}
                onChangeText={setNewPersonName}
                placeholder={t('enterPersonName') || 'Enter person name'}
              />
            </View>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>{t('context') || 'Context'}</Text>
              <View style={styles.contextOptions}>
                {['Family', 'Friend', 'Colleague', 'Acquaintance', 'Relationship', 'Other'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={styles.contextOption}
                  >
                    <Text style={styles.contextOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setIsAddPersonModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleAddPerson}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal for adding a new place */}
      <Modal
        visible={isAddPlaceModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAddPlaceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('addNewPlace') || 'Add New Place'}</Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>{t('name') || 'Name'}</Text>
              <TextInput
                style={styles.modalInput}
                value={newPlaceName}
                onChangeText={setNewPlaceName}
                placeholder={t('enterPlaceName') || 'Enter place name'}
              />
            </View>
            
            {currentLocation && (
              <View style={styles.currentLocationInfo}>
                <Text style={styles.currentLocationLabel}>{t('currentLocation') || 'Current Location'}</Text>
                <Text style={styles.currentLocationAddress}>{currentLocation.address}</Text>
                <Text style={styles.currentLocationCoords}>
                  {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
                </Text>
              </View>
            )}
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>{t('emoji') || 'Emoji'}</Text>
              <View style={styles.emojiSelector}>
                {['📍', '🏠', '🏢', '🏫', '🏥', '🍽️', '🍕', '🍣', '☕', '🛒', '🏪', '🏞️'].map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      newPlaceEmoji === emoji && styles.selectedEmojiButton
                    ]}
                    onPress={() => setNewPlaceEmoji(emoji)}
                  >
                    <Text style={styles.emojiButtonText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsAddPlaceModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleAddPlace}
              >
                <Text style={styles.modalSaveButtonText}>{t('add') || 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{t('saveEntry') || 'Save Entry'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '48%',
  },
  selectedMealType: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  mealTypeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  mealTypeText: {
    fontSize: 14,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  advancedFields: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 20,
  },
  imagePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '48%',
  },
  imagePickerIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#666',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  foodImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  imageButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  analyzeButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  analyzingButton: {
    backgroundColor: '#90CAF9',
  },
  analyzeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  peopleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  personButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPerson: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  personEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  personName: {
    fontSize: 14,
  },
  placesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  placeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPlace: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  placeEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  placeName: {
    fontSize: 14,
  },
  emptyListText: {
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  addNewButtonIcon: {
    fontSize: 16,
    marginRight: 4,
    color: 'white',
  },
  addNewButtonText: {
    fontSize: 14,
    color: 'white',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  locationButtonText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeModalButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalInputContainer: {
    marginBottom: 15,
  },
  modalInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  emojiSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  selectedEmojiButton: {
    backgroundColor: '#4CAF50',
  },
  emojiButtonText: {
    fontSize: 20,
  },
  contextOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contextOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  contextOptionText: {
    fontSize: 14,
  },
  currentLocationInfo: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  currentLocationLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  currentLocationAddress: {
    marginBottom: 5,
  },
  currentLocationCoords: {
    fontSize: 12,
    color: '#666',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#e0e0e0',
  },
  modalSaveButton: {
    backgroundColor: '#3F51B5',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  savePersonButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  savePersonButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  selectedRating: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingEmoji: {
    fontSize: 20,
  },
  moodContainer: {
    marginBottom: 16,
  },
  moodSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  moodRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodRatingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  moodRatingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodRatingButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  selectedMoodRating: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  moodRatingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emotionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emotionButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedEmotion: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  emotionEmoji: {
    fontSize: 20,
  },
  emotionText: {
    fontSize: 14,
  },
});

export default FoodEntryForm; 
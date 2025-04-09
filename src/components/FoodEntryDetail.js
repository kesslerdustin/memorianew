import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useFood } from '../context/FoodContext';
import { usePeople } from '../context/PeopleContext';
import { usePlaces } from '../context/PlacesContext';
import { MaterialIcons } from '@expo/vector-icons';

const FoodEntryDetail = ({ 
  entry, 
  onClose, 
  onEdit, 
  onDelete,
  topInset = 0,
  bottomInset = 0,
  getTranslatedMealType,
  getMealTypeEmoji
}) => {
  const { t } = useLanguage();
  const { deleteFoodEntry } = useFood();
  const { getPeopleById } = usePeople();
  const { getPlaceById } = usePlaces();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load place data when entry changes
  useEffect(() => {
    const loadPlace = async () => {
      if (entry && entry.place) {
        setLoading(true);
        try {
          const placeData = await getPlaceById(entry.place);
          setPlace(placeData);
        } catch (error) {
          console.error('Error loading place data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadPlace();
  }, [entry, getPlaceById]);

  if (!entry) {
    return null;
  }

  // Format date for display
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get people names from IDs
  const getPeople = () => {
    if (!entry.people || !entry.people.length) return [];
    return getPeopleById(entry.people);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteFoodEntry(entry.id);
      if (onDelete) {
        onDelete(entry.id);
      }
      onClose();
    } catch (error) {
      console.error('Error deleting food entry:', error);
      Alert.alert(
        t('error') || 'Error',
        t('errorDeletingEntry') || 'Error deleting entry'
      );
    }
  };

  // Confirm delete
  const confirmDelete = () => {
    Alert.alert(
      t('confirmDelete') || 'Confirm Delete',
      t('deleteEntryConfirmation') || 'Are you sure you want to delete this entry? This cannot be undone.',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        { 
          text: t('delete') || 'Delete', 
          onPress: handleDelete,
          style: 'destructive'
        }
      ]
    );
  };

  // Get associated people
  const people = getPeople();

  // Render the mood rating if available
  const renderMoodRating = () => {
    if (!entry.mood_rating && !entry.mood_emotion) return null;
    
    return (
      <View style={styles.moodCard}>
        <Text style={styles.sectionTitle}>{t('moodAndEmotions') || 'Mood & Emotions'}</Text>
        <View style={styles.moodContainer}>
          {entry.mood_emotion && (
            <Text style={styles.moodEmoji}>
              {entry.mood_emotion === 'happy' ? '😊' : 
               entry.mood_emotion === 'sad' ? '😢' :
               entry.mood_emotion === 'neutral' ? '😐' : '😊'}
            </Text>
          )}
          {entry.mood_rating && (
            <Text style={styles.moodRating}>{entry.mood_rating}/5</Text>
          )}
          {entry.mood_emotion && (
            <Text style={styles.moodEmotion}>{entry.mood_emotion}</Text>
          )}
        </View>
      </View>
    );
  };

  // Render food rating if available
  const renderFoodRating = () => {
    if (!entry.food_rating) return null;
    
    return (
      <View style={styles.ratingCard}>
        <Text style={styles.sectionTitle}>{t('foodRating') || 'Food Rating'}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingValue}>{entry.food_rating}/5</Text>
          {[1, 2, 3, 4, 5].map(star => (
            <MaterialIcons 
              key={star}
              name="star" 
              size={24} 
              color={star <= entry.food_rating ? '#FFD700' : '#E0E0E0'} 
            />
          ))}
        </View>
      </View>
    );
  };

  // Render restaurant info if available
  const renderRestaurantInfo = () => {
    if (!entry.is_restaurant) return null;
    
    return (
      <View style={styles.restaurantCard}>
        <Text style={styles.sectionTitle}>{t('restaurant') || 'Restaurant'}</Text>
        <Text style={styles.restaurantName}>{entry.restaurant_name || t('unnamed') || 'Unnamed Restaurant'}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('foodDetails') || 'Food Details'}</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => onEdit && onEdit(entry)}
        >
          <Text style={styles.editButtonText}>{t('edit') || 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomInset + 20 }]}
      >
        {/* Image (if available) */}
        {entry.image_uri && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: entry.image_uri }} 
              style={styles.foodImage}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.mainInfo}>
          <Text style={styles.mealTypeEmoji}>{getMealTypeEmoji(entry.meal_type)}</Text>
          <Text style={styles.foodName}>{entry.name}</Text>
          <Text style={styles.mealType}>{getTranslatedMealType(entry.meal_type)}</Text>
          <Text style={styles.dateTime}>{formatDate(entry.date)}</Text>
        </View>

        <View style={styles.nutritionCard}>
          <Text style={styles.nutritionTitle}>{t('nutritionInfo') || 'Nutrition Information'}</Text>
          
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{entry.calories || 0}</Text>
              <Text style={styles.nutritionLabel}>{t('calories') || 'Calories'}</Text>
            </View>
            
            <View style={styles.nutritionDivider} />
            
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{entry.protein || 0}g</Text>
              <Text style={styles.nutritionLabel}>{t('protein') || 'Protein'}</Text>
            </View>
            
            <View style={styles.nutritionDivider} />
            
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{entry.carbs || 0}g</Text>
              <Text style={styles.nutritionLabel}>{t('carbs') || 'Carbs'}</Text>
            </View>
            
            <View style={styles.nutritionDivider} />
            
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{entry.fat || 0}g</Text>
              <Text style={styles.nutritionLabel}>{t('fat') || 'Fat'}</Text>
            </View>
          </View>
        </View>

        {/* Food rating */}
        {renderFoodRating()}

        {/* Mood */}
        {renderMoodRating()}

        {/* Restaurant info */}
        {renderRestaurantInfo()}

        {/* People */}
        {people && people.length > 0 && (
          <View style={styles.peopleCard}>
            <Text style={styles.sectionTitle}>{t('peopleSharing') || 'People Sharing This Meal'}</Text>
            <View style={styles.peopleList}>
              {people.map(person => (
                <View key={person.id} style={styles.personBadge}>
                  <Text style={styles.personEmoji}>{person.emoji || '👤'}</Text>
                  <Text style={styles.personName}>{person.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Place */}
        {place && (
          <View style={styles.placeCard}>
            <Text style={styles.sectionTitle}>{t('place') || 'Place'}</Text>
            <View style={styles.placeBadge}>
              <Text style={styles.placeEmoji}>📍</Text>
              <Text style={styles.placeName}>{place.name}</Text>
              {place.address && <Text style={styles.placeAddress}>{place.address}</Text>}
            </View>
          </View>
        )}

        {entry.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>{t('notes') || 'Notes'}</Text>
            <Text style={styles.notesContent}>{entry.notes}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={confirmDelete}
        >
          <Text style={styles.deleteButtonText}>{t('deleteEntry') || 'Delete Entry'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  mainInfo: {
    alignItems: 'center',
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
  mealTypeEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  mealType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 14,
    color: '#888',
  },
  nutritionCard: {
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
  nutritionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
  },
  nutritionDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  peopleCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  peopleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  personBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  personEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  personName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  placeCard: {
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
  placeBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
  },
  placeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  notesCard: {
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
  notesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  notesContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // New styles for mood, rating, and restaurant
  moodCard: {
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
  moodContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  moodRating: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  moodEmotion: {
    fontSize: 16,
    color: '#666',
  },
  ratingCard: {
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  restaurantCard: {
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
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FoodEntryDetail; 
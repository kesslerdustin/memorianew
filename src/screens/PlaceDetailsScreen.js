import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { usePlaces } from '../context/PlacesContext';
import { getMoodEntries } from '../database/database';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle } from '../context/VisualStyleContext';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 220;

const PlaceDetailsScreen = ({ place, onBack, onEdit, hideBackButton = false }) => {
  const { t } = useLanguage();
  const { getMoodIcon } = useVisualStyle();
  const { getPlaceMoods } = usePlaces();
  const [placeMoods, setPlaceMoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [showMoodModal, setShowMoodModal] = useState(false);

  // Load moods associated with this place
  useEffect(() => {
    loadPlaceMoods();
    
    // Set map region based on place
    if (place && place.latitude && place.longitude) {
      console.log('Setting up map with place:', place.name);
      console.log('Place has locations array:', place.locations ? place.locations.length : 'none');
      
      if (place.locations && place.locations.length > 0) {
        // Calculate center of all locations
        let sumLat = 0, sumLng = 0;
        place.locations.forEach(loc => {
          sumLat += Number(loc.latitude);
          sumLng += Number(loc.longitude);
        });
        
        const centerLat = sumLat / place.locations.length;
        const centerLng = sumLng / place.locations.length;
        
        // Calculate appropriate delta to show all markers
        let maxLat = -90, minLat = 90, maxLng = -180, minLng = 180;
        place.locations.forEach(loc => {
          maxLat = Math.max(maxLat, Number(loc.latitude));
          minLat = Math.min(minLat, Number(loc.latitude));
          maxLng = Math.max(maxLng, Number(loc.longitude));
          minLng = Math.min(minLng, Number(loc.longitude));
        });
        
        const latDelta = Math.max(0.01, (maxLat - minLat) * 1.5);
        const lngDelta = Math.max(0.01, (maxLng - minLng) * 1.5);
        
        setMapRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta
        });
      } else {
        setMapRegion({
          latitude: Number(place.latitude),
          longitude: Number(place.longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
      }
    }
  }, [place]);

  const loadPlaceMoods = async () => {
    try {
      setIsLoading(true);
      
      // If it's a mood place, show associated moods directly from mood_ids
      if (place.fromMood && place.mood_ids && place.mood_ids.length > 0) {
        // Get all moods and filter for the ones associated with this place
        const allMoods = await getMoodEntries(1000, 0);
        
        // Use Set for O(1) lookup
        const placeMoodIds = new Set(place.mood_ids);
        
        // Filter to only include moods that match our IDs
        const relevantMoods = allMoods.filter(mood => placeMoodIds.has(mood.id));
        
        console.log(`Found ${relevantMoods.length} moods for this location out of ${place.mood_ids.length} IDs`);
        
        if (relevantMoods.length === 0 && place.mood_count > 0) {
          console.log('Warning: No moods found despite mood_count > 0');
        }
        
        setPlaceMoods(relevantMoods);
      } else {
        // Regular place, fetch moods from database
        const moods = await getPlaceMoods(place.id);
        console.log(`Fetched ${moods.length} moods for regular place with ID ${place.id}`);
        setPlaceMoods(moods);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading place moods:', error);
      setIsLoading(false);
    }
  };

  // Get mood icon/color based on rating
  const getMoodColor = (rating) => {
    if (!rating) return '#888';
    
    const colors = {
      1: '#E57373', // Red
      2: '#FFB74D', // Orange
      3: '#FFD54F', // Yellow
      4: '#81C784', // Light Green
      5: '#4CAF50', // Green
    };
    
    return colors[rating] || '#FFD54F';
  };

  const getEmotionEmoji = (emotion) => {
    const emotions = {
      'happy': '😊',
      'sad': '😢',
      'angry': '😠',
      'anxious': '😰',
      'calm': '😌',
      'excited': '🤩',
      'tired': '😴',
      'bored': '😒',
      'grateful': '🙏',
      'confused': '😕',
      'hopeful': '🌟',
      'content': '🙂',
    };
    
    return emotions[emotion] || '❓';
  };

  // Format date in a more readable way
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle mood selection
  const handleMoodPress = (mood) => {
    setSelectedMood(mood);
    setShowMoodModal(true);
  };

  // Close mood detail modal
  const handleCloseMoodModal = () => {
    setShowMoodModal(false);
    setSelectedMood(null);
  };

  // Weather emoji helper
  const getWeatherEmoji = (weatherString) => {
    if (!weatherString) return '';
    
    const weatherLower = weatherString.toLowerCase();
    
    if (weatherLower.includes('clear') || weatherLower.includes('sunny')) return '☀️';
    if (weatherLower.includes('cloud')) return '☁️';
    if (weatherLower.includes('rain')) return '🌧️';
    if (weatherLower.includes('storm') || weatherLower.includes('thunder')) return '⛈️';
    if (weatherLower.includes('snow')) return '❄️';
    if (weatherLower.includes('fog') || weatherLower.includes('mist')) return '🌫️';
    
    return '🌡️'; // Default temperature
  };

  // Render mood detail modal
  const renderMoodDetailModal = () => {
    if (!selectedMood) return null;
    
    const emotion = selectedMood.emotion;
    const emoji = getEmotionEmoji(emotion);
    const weatherEmoji = selectedMood.weather ? getWeatherEmoji(selectedMood.weather) : null;
    const date = new Date(selectedMood.entry_time || selectedMood.date);
    
    return (
      <Modal
        visible={showMoodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseMoodModal}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('moodDetails')}</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={handleCloseMoodModal}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.moodDetailHeader}>
                <Text style={styles.moodDetailDate}>{formatDate(date)}</Text>
                <View style={[styles.moodDetailRating, { backgroundColor: getMoodColor(selectedMood.rating) }]}>
                  <Text style={styles.moodDetailRatingText}>{selectedMood.rating}/5</Text>
                </View>
              </View>
              
              <View style={styles.moodDetailEmotion}>
                <Text style={styles.moodDetailEmoji}>{emoji}</Text>
                <Text style={styles.moodDetailEmotionText}>
                  {t(emotion) || emotion}
                </Text>
              </View>
              
              {selectedMood.weather && (
                <View style={styles.moodDetailContext}>
                  <Text style={styles.moodDetailContextLabel}>{t('weather')}:</Text>
                  <Text style={styles.moodDetailContextValue}>
                    {weatherEmoji} {selectedMood.weather}
                  </Text>
                </View>
              )}
              
              {selectedMood.location && (
                <View style={styles.moodDetailContext}>
                  <Text style={styles.moodDetailContextLabel}>{t('location')}:</Text>
                  <Text style={styles.moodDetailContextValue}>
                    📍 {selectedMood.location}
                  </Text>
                </View>
              )}
              
              {selectedMood.notes && (
                <View style={styles.moodDetailNotes}>
                  <Text style={styles.moodDetailNotesLabel}>{t('notes')}:</Text>
                  <Text style={styles.moodDetailNotesText}>{selectedMood.notes}</Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCloseMoodModal}
              >
                <Text style={styles.modalButtonText}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          {!hideBackButton && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onBack}
              accessibilityLabel={t('back')}
            >
              <Text style={styles.backButtonText}>{t('back')}</Text>
            </TouchableOpacity>
          )}
          {hideBackButton && <View style={styles.placeholderView} />}
          <Text style={[styles.title, hideBackButton && styles.titleCentered]} numberOfLines={1}>{place.name}</Text>
          {!place.fromMood && (
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => onEdit(place)}
              accessibilityLabel={t('edit')}
            >
              <Text style={styles.editButtonText}>{t('edit')}</Text>
            </TouchableOpacity>
          )}
          {place.fromMood && <View style={styles.placeholderView} />}
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Map view */}
          {mapRegion ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
              >
                {/* Primary place marker */}
                <Marker
                  coordinate={{
                    latitude: Number(place.latitude),
                    longitude: Number(place.longitude)
                  }}
                  title={place.name}
                  pinColor="#3F51B5"
                />
                
                {/* Additional location markers for mood-related places */}
                {place.locations && place.locations.map((loc, index) => {
                  // Skip invalid coordinates
                  if (!loc.latitude || !loc.longitude || 
                      isNaN(Number(loc.latitude)) || isNaN(Number(loc.longitude))) {
                    return null;
                  }

                  // Skip if this is the exact same location as the primary marker
                  // Use small epsilon for floating point comparison
                  const isSameAsPrimary = 
                    Math.abs(Number(loc.latitude) - Number(place.latitude)) < 0.000001 && 
                    Math.abs(Number(loc.longitude) - Number(place.longitude)) < 0.000001;
                    
                  if (isSameAsPrimary) {
                    return null;
                  }
                  
                  // Use rating-based colors for the markers
                  let pinColor = '#888'; // Default gray
                  
                  if (loc.moodId && place.fromMood) {
                    const relatedMood = placeMoods.find(m => m.id === loc.moodId);
                    if (relatedMood && relatedMood.rating) {
                      pinColor = getMoodColor(relatedMood.rating);
                    }
                  }
                  
                  return (
                    <Marker
                      key={`loc-${index}-${loc.latitude}-${loc.longitude}`}
                      coordinate={{
                        latitude: Number(loc.latitude),
                        longitude: Number(loc.longitude)
                      }}
                      title={loc.date ? new Date(loc.date).toLocaleDateString() : 'Location'}
                      pinColor={pinColor}
                    />
                  );
                })}
              </MapView>
            </View>
          ) : (
            <View style={styles.noMapContainer}>
              <Text style={styles.noMapText}>{t('noLocationData')}</Text>
            </View>
          )}
        
          {place.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('address')}:</Text>
              <Text style={styles.detailValue}>{place.address}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('coordinates')}:</Text>
            <Text style={styles.detailValue}>
              {place.latitude?.toFixed(6)}, {place.longitude?.toFixed(6)}
            </Text>
          </View>

          {place.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('notes')}:</Text>
              <Text style={styles.detailValue}>{place.notes}</Text>
            </View>
          )}

          <Text style={styles.moodsTitle}>{t('associatedMoods')}:</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3F51B5" />
              <Text style={styles.loadingText}>{t('loadingMoods')}</Text>
            </View>
          ) : placeMoods.length > 0 ? (
            <View style={styles.moodsContainer}>
              {placeMoods.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.moodItem, { borderLeftColor: getMoodColor(item.rating) }]}
                  onPress={() => handleMoodPress(item)}
                >
                  <View style={styles.moodHeader}>
                    <Text style={styles.moodDate}>
                      {new Date(item.entry_time || item.date).toLocaleDateString()}
                    </Text>
                    <View style={styles.moodRating}>
                      <Text style={[styles.moodRatingText, { color: getMoodColor(item.rating) }]}>
                        {item.rating}/5
                      </Text>
                    </View>
                  </View>
                  <View style={styles.moodContent}>
                    <Text style={styles.moodEmoji}>
                      {getEmotionEmoji(item.emotion)}
                    </Text>
                    <Text style={styles.moodEmotion}>
                      {t(item.emotion) || item.emotion}
                    </Text>
                  </View>
                  {item.notes && <Text style={styles.moodText} numberOfLines={2}>{item.notes}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noMoodsText}>{t('noAssociatedMoods')}</Text>
          )}
        </ScrollView>
      </View>
      
      {/* Render mood detail modal */}
      {renderMoodDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3F51B5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e8eaf6',
    borderRadius: 8,
    marginLeft: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#3F51B5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    width: '100%',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  noMapContainer: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  noMapText: {
    fontSize: 16,
    color: '#666',
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#444',
  },
  moodsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  moodsContainer: {
    width: '100%',
  },
  noMoodsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  moodItem: {
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodDate: {
    fontSize: 14,
    color: '#666',
  },
  moodRating: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  moodRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  moodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  moodEmotion: {
    fontSize: 16,
    fontWeight: '500',
  },
  moodText: {
    fontSize: 14,
    color: '#444',
  },
  placeholderView: {
    width: 64,
    marginLeft: 8,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#666',
  },
  moodDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodDetailDate: {
    fontSize: 16,
    color: '#666',
  },
  moodDetailRating: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moodDetailRatingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  moodDetailEmotion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  moodDetailEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  moodDetailEmotionText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  moodDetailContext: {
    marginBottom: 12,
  },
  moodDetailContextLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  moodDetailContextValue: {
    fontSize: 16,
    color: '#444',
  },
  moodDetailNotes: {
    marginVertical: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  moodDetailNotesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  moodDetailNotesText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#3F51B5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleCentered: {
    textAlign: 'center',
  },
});

export default PlaceDetailsScreen; 
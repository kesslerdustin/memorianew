import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, TextInput, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { usePlaces } from '../context/PlacesContext';
import { useMoods } from '../context/MoodsContext';
import AddEditPlaceScreen from './AddEditPlaceScreen';
import PlaceDetailsScreen from './PlaceDetailsScreen';
import { getMoodEntries } from '../database/database';
import MapView, { Marker } from 'react-native-maps';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 220;

// Distance in kilometers to consider places as the same location
const PROXIMITY_THRESHOLD = 0.5;

// Calculate distance between two coordinates using haversine formula
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

const PlacesScreen = () => {
  const { places, loading, deletePlace, getPlaceMoods, addPlace, refreshPlaces } = usePlaces();
  const { moods } = useMoods();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [placeMoods, setPlaceMoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [moodPlaces, setMoodPlaces] = useState([]);
  const [combinedPlaces, setCombinedPlaces] = useState([]);
  const [mapRegion, setMapRegion] = useState(null);

  // Load mood entries with location data on component mount
  useEffect(() => {
    const loadMoodPlaces = async () => {
      try {
        setIsLoading(true);
        // Get all mood entries with location data
        const moodEntries = await getMoodEntries(1000, 0);
        
        // Filter to only entries with location data
        const entriesWithLocation = moodEntries.filter(entry => 
          entry.locationData && 
          entry.locationData.latitude && 
          entry.locationData.longitude
        );
        
        if (entriesWithLocation.length === 0) {
          setIsLoading(false);
          return;
        }
        
        // Create a map to avoid duplicates and group nearby locations
        const placeGroups = [];
        
        // Process each entry
        entriesWithLocation.forEach(entry => {
          const entryLat = entry.locationData.latitude;
          const entryLng = entry.locationData.longitude;
          
          // Check if this entry is close to an existing place group
          let foundGroup = false;
          
          for (const group of placeGroups) {
            const distance = getDistanceInKm(
              entryLat, entryLng, 
              group.latitude, group.longitude
            );
            
            // If within threshold, add to this group
            if (distance <= PROXIMITY_THRESHOLD) {
              group.mood_ids.push(entry.id);
              group.mood_count = group.mood_ids.length;
              
              // Keep track of all locations in this group
              group.locations.push({
                latitude: entryLat,
                longitude: entryLng,
                moodId: entry.id,
                date: entry.entry_time
              });
              
              // If this entry has a proper location name and the group doesn't, use it
              if (entry.location && (!group.address || group.address === '')) {
                group.name = entry.location;
                group.address = entry.location;
              }
              
              foundGroup = true;
              break;
            }
          }
          
          // If no nearby group found, create a new one
          if (!foundGroup) {
            const name = entry.location || `Location at ${entryLat.toFixed(4)}, ${entryLng.toFixed(4)}`;
            
            placeGroups.push({
              id: `mood_place_${entry.id}`,
              name: name,
              address: entry.location || '',
              latitude: entryLat,
              longitude: entryLng,
              notes: `From mood entries starting on ${new Date(entry.entry_time).toLocaleDateString()}`,
              created_at: new Date(entry.entry_time).toISOString(),
              updated_at: new Date().toISOString(),
              fromMood: true,
              mood_count: 1,
              mood_ids: [entry.id],
              locations: [{
                latitude: entryLat,
                longitude: entryLng,
                moodId: entry.id,
                date: entry.entry_time
              }]
            });
          }
        });
        
        setMoodPlaces(placeGroups);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading mood places:', error);
        setIsLoading(false);
      }
    };
    
    loadMoodPlaces();
  }, []);

  // Combine regular places and mood places
  useEffect(() => {
    // Filter out mood places that already exist in the places database
    // using approximate coordinate matching
    const existingCoords = new Set();
    places.forEach(place => {
      if (place.latitude && place.longitude) {
        existingCoords.add(`${place.latitude.toFixed(3)},${place.longitude.toFixed(3)}`);
      }
    });
    
    const uniqueMoodPlaces = moodPlaces.filter(moodPlace => {
      const coordKey = `${moodPlace.latitude.toFixed(3)},${moodPlace.longitude.toFixed(3)}`;
      return !existingCoords.has(coordKey);
    });
    
    setCombinedPlaces([...places, ...uniqueMoodPlaces]);
  }, [places, moodPlaces]);

  // Update filtered places based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPlaces(combinedPlaces);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = combinedPlaces.filter(place =>
        place.name.toLowerCase().includes(query) ||
        (place.address && place.address.toLowerCase().includes(query)) ||
        (place.notes && place.notes.toLowerCase().includes(query))
      );
      setFilteredPlaces(filtered);
    }
  }, [searchQuery, combinedPlaces]);

  useEffect(() => {
    if (selectedPlace) {
      loadPlaceMoods();
      
      // Set map region based on selected place
      if (selectedPlace.latitude && selectedPlace.longitude) {
        if (selectedPlace.locations && selectedPlace.locations.length > 0) {
          // Calculate center of all locations
          let sumLat = 0, sumLng = 0;
          selectedPlace.locations.forEach(loc => {
            sumLat += loc.latitude;
            sumLng += loc.longitude;
          });
          
          const centerLat = sumLat / selectedPlace.locations.length;
          const centerLng = sumLng / selectedPlace.locations.length;
          
          // Calculate appropriate delta to show all markers
          let maxLat = -90, minLat = 90, maxLng = -180, minLng = 180;
          selectedPlace.locations.forEach(loc => {
            maxLat = Math.max(maxLat, loc.latitude);
            minLat = Math.min(minLat, loc.latitude);
            maxLng = Math.max(maxLng, loc.longitude);
            minLng = Math.min(minLng, loc.longitude);
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
            latitude: selectedPlace.latitude,
            longitude: selectedPlace.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          });
        }
      }
    }
  }, [selectedPlace]);

  const loadPlaceMoods = async () => {
    try {
      // If it's a mood place, show associated moods directly
      if (selectedPlace.fromMood) {
        // We already have mood IDs, but we need to fetch the full mood data
        const allMoods = await getMoodEntries(1000, 0);
        const placeMoodIds = new Set(selectedPlace.mood_ids);
        const relevantMoods = allMoods.filter(mood => placeMoodIds.has(mood.id));
        setPlaceMoods(relevantMoods);
      } else {
        // Regular place, fetch moods from database
        const moods = await getPlaceMoods(selectedPlace.id);
        setPlaceMoods(moods);
      }
    } catch (error) {
      console.error('Error loading place moods:', error);
    }
  };

  const handlePlacePress = (place) => {
    setSelectedPlace(place);
  };

  const handleBack = () => {
    setSelectedPlace(null);
    setMapRegion(null);
  };

  const handleAddPlace = () => {
    setEditingPlace(null);
    setShowAddEditModal(true);
  };

  const handleEditPlace = (place) => {
    // For mood-generated places, we shouldn't show the modal from PlaceDetailsScreen
    // Only show it when clicked from the places list
    if (place.fromMood && selectedPlace) {
      console.log('Ignoring edit request for fromMood place from details screen');
      return;
    }
    
    setEditingPlace(place);
    setShowAddEditModal(true);
  };

  const handleDeletePlace = (place) => {
    // Only allow deletion of database places, not mood places
    if (place.fromMood) {
      Alert.alert(
        'Auto-generated Place',
        'This place was automatically generated from mood entries and cannot be deleted directly.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    Alert.alert(
      'Delete Place',
      `Are you sure you want to delete ${place.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlace(place.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete place');
            }
          }
        }
      ]
    );
  };

  const handleCloseModal = () => {
    setShowAddEditModal(false);
    setEditingPlace(null);
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

  const renderPlaceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.placeItem}
      onPress={() => handlePlacePress(item)}
    >
      <View style={styles.placeInfo}>
        <Text style={styles.placeName}>{item.name}</Text>
        {item.address && <Text style={styles.placeAddress}>{item.address}</Text>}
        {item.mood_count > 0 && (
          <Text style={styles.moodCount}>{item.mood_count} mood{item.mood_count !== 1 ? 's' : ''}</Text>
        )}
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditPlace(item)}
        >
          <Text style={styles.actionButtonText}>
            {item.fromMood ? 'View' : 'Edit'}
          </Text>
        </TouchableOpacity>
        {!item.fromMood && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeletePlace(item)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render empty state when no places exist
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Places Found</Text>
      <Text style={styles.emptyText}>You haven't added any places yet.</Text>
      
      <View style={styles.emptyActions}>
        <TouchableOpacity 
          style={styles.emptyActionButton}
          onPress={handleAddPlace}
        >
          <Text style={styles.emptyActionButtonText}>Add Place</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={styles.loadingText}>
          Loading places...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedPlace ? (
        <PlaceDetailsScreen 
          place={selectedPlace}
          onBack={handleBack}
          onEdit={handleEditPlace}
          hideBackButton={false}
        />
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search places..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {filteredPlaces.length > 0 ? (
            <FlatList
              data={filteredPlaces}
              renderItem={renderPlaceItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            renderEmptyState()
          )}
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPlace}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        visible={showAddEditModal}
        animationType="slide"
        onRequestClose={handleCloseModal}
        statusBarTranslucent={true}
        presentationStyle="formSheet"
      >
        <AddEditPlaceScreen
          place={editingPlace}
          onClose={handleCloseModal}
          readOnly={editingPlace?.fromMood} 
        />
      </Modal>
    </View>
  );
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
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  listContainer: {
    padding: 16,
  },
  placeItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  moodCount: {
    fontSize: 12,
    color: '#3F51B5',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#f44336',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  addButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  emptyActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emptyActionButton: {
    backgroundColor: '#3F51B5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  emptyActionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PlacesScreen; 
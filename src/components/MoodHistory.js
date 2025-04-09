import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions, SectionList, ScrollView, Animated, Platform } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle } from '../context/VisualStyleContext';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// Replace imported EMOTIONS with the one defined in MoodScreen
// import { EMOTIONS } from '../data/models';

// Use the same EMOTIONS definition as in MoodScreen.js
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = 200; // Fixed height instead of screen ratio

const MoodHistory = ({ 
  entries, 
  onEntryPress, 
  onEndReached, 
  onRefresh, 
  refreshing,
  isLoadingMore,
  bottomInset = 0,
  getTranslatedEmotion,
  getMoodIcon,
  visualStyle
}) => {
  const { t } = useLanguage();
  const localVisualStyle = useVisualStyle();
  const [showMap, setShowMap] = useState(false);
  const [visibleEntries, setVisibleEntries] = useState([]);
  const listRef = useRef(null);
  const mapHeight = useRef(new Animated.Value(0)).current;
  
  // Use provided visual style helpers or fallback to context
  const actualGetMoodIcon = getMoodIcon || localVisualStyle.getMoodIcon;
  const actualVisualStyle = visualStyle || localVisualStyle.visualStyle;

  const getEmotionDetails = (emotionValue) => {
    const emotion = EMOTIONS.find(e => e.value === emotionValue) || { label: 'Unknown', emoji: '❓' };
    return {
      ...emotion,
      label: getTranslatedEmotion ? getTranslatedEmotion(emotionValue) : t(emotion.value) || emotion.label
    };
  };

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

  // Toggle map view with animation
  const toggleMap = () => {
    if (showMap) {
      // Hide map
      Animated.timing(mapHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start(() => setShowMap(false));
    } else {
      // Show map
      setShowMap(true);
      Animated.timing(mapHeight, {
        toValue: MAP_HEIGHT,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
  };

  // Group entries by date section (Today, Yesterday, Last Week, etc.)
  const groupedEntries = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000; // Subtract one day in milliseconds
    const lastWeek = today - 7 * 86400000;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
    
    // Initialize sections
    const sections = [
      { title: t('today'), data: [] },
      { title: t('yesterday'), data: [] },
      { title: t('lastWeek'), data: [] },
      { title: t('lastMonth'), data: [] },
      { title: t('older'), data: [] }
    ];
    
    // Categorize entries into sections
    entries.forEach(entry => {
      const entryTime = entry.entry_time;
      
      if (entryTime >= today) {
        sections[0].data.push(entry);
      } else if (entryTime >= yesterday) {
        sections[1].data.push(entry);
      } else if (entryTime >= lastWeek) {
        sections[2].data.push(entry);
      } else if (entryTime >= lastMonth) {
        sections[3].data.push(entry);
      } else {
        sections[4].data.push(entry);
      }
    });
    
    // Remove empty sections
    return sections.filter(section => section.data.length > 0);
  }, [entries, t]);

  // Add memory management optimization
  useEffect(() => {
    return () => {
      // Clean up resources when component unmounts
      setVisibleEntries([]);
      setShowMap(false);
    };
  }, []);

  // Track visible items for map display with improved memory management
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    try {
      if (!Array.isArray(viewableItems)) {
        console.warn('viewableItems is not an array');
        return;
      }
      
      // Limit the number of visible entries to prevent memory issues
      const MAX_VISIBLE_ENTRIES = 15;
      const validItems = viewableItems
        .filter(viewableItem => viewableItem && viewableItem.item)
        .map(viewableItem => viewableItem.item)
        .slice(0, MAX_VISIBLE_ENTRIES);
      
      // Only update if there's a meaningful change to prevent unnecessary renders
      if (JSON.stringify(validItems.map(item => item.id)) !== 
          JSON.stringify(visibleEntries.map(item => item.id))) {
        setVisibleEntries(validItems);
      }
    } catch (error) {
      console.error('Error in onViewableItemsChanged:', error);
      // Don't update state on error to prevent potential crashes
    }
  }).current;

  // Calculate map region based on visible entries
  const getMapRegion = () => {
    try {
      if (!visibleEntries || visibleEntries.length === 0) {
        // Default to US/World if no entries
        return {
          latitude: 37.0902,
          longitude: -95.7129,
          latitudeDelta: 60,
          longitudeDelta: 60,
        };
      }

      const validEntries = visibleEntries.filter(entry => 
        entry && 
        entry.locationData && 
        !isNaN(Number(entry.locationData.latitude)) && 
        !isNaN(Number(entry.locationData.longitude))
      );

      if (validEntries.length === 0) {
        // Default to US/World if no valid entries
        return {
          latitude: 37.0902,
          longitude: -95.7129,
          latitudeDelta: 60,
          longitudeDelta: 60,
        };
      }

      // If only one valid entry, center on it with reasonable zoom
      if (validEntries.length === 1) {
        const entry = validEntries[0];
        return {
          latitude: Number(entry.locationData.latitude),
          longitude: Number(entry.locationData.longitude),
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
      }

      // Calculate bounds for multiple entries
      let minLat = Number.MAX_VALUE;
      let maxLat = -Number.MAX_VALUE;
      let minLng = Number.MAX_VALUE;
      let maxLng = -Number.MAX_VALUE;

      validEntries.forEach(entry => {
        const lat = Number(entry.locationData.latitude);
        const lng = Number(entry.locationData.longitude);
        
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });

      const midLat = (minLat + maxLat) / 2;
      const midLng = (minLng + maxLng) / 2;
      
      // Add padding to the region
      const latDelta = (maxLat - minLat) * 1.5 || 0.02;
      const lngDelta = (maxLng - minLng) * 1.5 || 0.02;

      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: Math.max(0.02, latDelta),
        longitudeDelta: Math.max(0.02, lngDelta),
      };
    } catch (error) {
      console.error('Error calculating map region:', error);
      // Fallback to default region
      return {
        latitude: 37.0902,
        longitude: -95.7129,
        latitudeDelta: 60,
        longitudeDelta: 60,
      };
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('noMoodEntries')}</Text>
      <Text style={styles.emptySubtext}>{t('moodHistoryAppearHere')}</Text>
    </View>
  );

  // Helper to get weather emoji
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

  const renderMoodEntry = ({ item }) => {
    const emotion = getEmotionDetails(item.emotion);
    const weatherEmoji = item.weather ? getWeatherEmoji(item.weather) : null;
    
    return (
      <TouchableOpacity 
        style={styles.entryContainer}
        onPress={() => onEntryPress && onEntryPress(item)}
      >
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>{formatDate(item.entry_time)}</Text>
          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.rating) }]}>
            <Text style={styles.ratingText}>{item.rating}/5</Text>
          </View>
        </View>
        
        <View style={styles.emotionContainer}>
          <Text style={styles.emotionEmoji}>
            {actualVisualStyle ? actualGetMoodIcon(item.rating) : emotion.emoji}
          </Text>
          <Text style={styles.emotionLabel}>{emotion.label}</Text>
        </View>
        
        {/* Context info row with weather and location */}
        {(item.weather || item.location) && (
          <View style={styles.contextContainer}>
            {item.weather && (
              <View style={styles.contextItem}>
                <Text style={styles.contextEmoji}>{weatherEmoji}</Text>
                <Text style={styles.contextText} numberOfLines={1}>{item.weather}</Text>
              </View>
            )}
            
            {item.location && (
              <View style={styles.contextItem}>
                <Text style={styles.contextEmoji}>📍</Text>
                <Text style={styles.contextText} numberOfLines={1}>{item.location}</Text>
              </View>
            )}
          </View>
        )}
        
        {item.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  // Render section header
  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  // Render footer with loading indicator when loading more entries
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#FFD54F" />
        <Text style={styles.footerText}>{t('loadingMore')}</Text>
      </View>
    );
  };

  // Get color based on rating
  const getRatingColor = (rating) => {
    const colors = {
      1: '#E57373', // Red
      2: '#FFB74D', // Orange
      3: '#FFD54F', // Yellow
      4: '#81C784', // Light Green
      5: '#4CAF50', // Green
    };
    return colors[rating] || '#FFD54F';
  };

  // Render map markers with better validation and memory management
  const renderMapMarkers = () => {
    // Limit number of markers to prevent memory issues
    const MAX_MARKERS = 10;
    
    try {
      const validEntries = visibleEntries
        .filter(entry => 
          entry && 
          entry.locationData && 
          Number.isFinite(Number(entry.locationData.latitude)) && 
          Number.isFinite(Number(entry.locationData.longitude))
        )
        .slice(0, MAX_MARKERS);
      
      return validEntries.map(entry => {
        try {
          const coordinate = {
            latitude: Number(entry.locationData.latitude),
            longitude: Number(entry.locationData.longitude)
          };
          
          // Validate coordinate bounds
          if (coordinate.latitude < -90 || coordinate.latitude > 90 || 
              coordinate.longitude < -180 || coordinate.longitude > 180) {
            console.warn('Invalid coordinate:', coordinate);
            return null;
          }
          
          return (
            <Marker
              key={entry.id}
              coordinate={coordinate}
              title={getEmotionDetails(entry.emotion).label}
              description={formatDate(entry.entry_time)}
              pinColor={getRatingColor(entry.rating)}
              tracksViewChanges={false} // Performance improvement
              onPress={() => onEntryPress && onEntryPress(entry)}
              stopPropagation={true}
              zIndex={1}
            />
          );
        } catch (error) {
          console.error('Error rendering marker:', error);
          return null;
        }
      }).filter(Boolean); // Filter out null markers
    } catch (error) {
      console.error('Error in renderMapMarkers:', error);
      return [];
    }
  };

  // Add state to track if any entries have location data
  const [hasLocationData, setHasLocationData] = useState(false);

  // Check for location data when entries change
  useEffect(() => {
    const hasAnyLocationData = entries.some(entry => 
      entry && 
      entry.locationData && 
      Number.isFinite(Number(entry.locationData.latitude)) && 
      Number.isFinite(Number(entry.locationData.longitude))
    );
    setHasLocationData(hasAnyLocationData);
  }, [entries]);

  // Render map container with error handling
  const renderMap = () => {
    if (!showMap || !hasLocationData) return null;

    try {
      // Calculate initial region with defensive coding
      let initialRegion = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      try {
        // Find first valid entry with location data from all entries
        const validEntry = entries.find(entry => 
          entry && entry.locationData && 
          Number.isFinite(Number(entry.locationData.latitude)) && 
          Number.isFinite(Number(entry.locationData.longitude))
        );

        if (validEntry) {
          initialRegion = {
            latitude: Number(validEntry.locationData.latitude),
            longitude: Number(validEntry.locationData.longitude),
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
        }
      } catch (error) {
        console.error('Error calculating map region:', error);
      }

      return (
        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            initialRegion={initialRegion}
            onError={(error) => console.error('MapView error:', error)}
            maxZoomLevel={19}
            minZoomLevel={1}
            rotateEnabled={false}
            cacheEnabled={Platform.OS === 'android'}
            loadingEnabled={true}
            loadingIndicatorColor="#666666"
            loadingBackgroundColor="#eeeeee"
            onMapReady={() => console.log('Map ready')}
            onMapError={(error) => console.error('Map error:', error)}
            onRegionChangeComplete={() => {}}
            moveOnMarkerPress={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            showsTraffic={false}
            showsBuildings={false}
            showsIndoors={false}
            showsPointsOfInterest={false}
          >
            {renderMapMarkers()}
          </MapView>
        </View>
      );
    } catch (error) {
      console.error('Error rendering map:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('moodHistory')}</Text>
        {hasLocationData && (
          <TouchableOpacity
            style={[styles.mapToggle, showMap && styles.mapToggleActive]}
            onPress={toggleMap}
          >
            <Text style={styles.mapToggleText}>{showMap ? t('hideMap') : t('showMap')} 🗺️</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        {/* Map View */}
        {showMap && hasLocationData && (
          <View style={styles.mapContainer}>
            {renderMap()}
          </View>
        )}
        
        <View style={styles.listContainer}>
          {entries.length === 0 ? (
            renderEmptyState()
          ) : (
            <SectionList
              ref={listRef}
              sections={groupedEntries}
              renderItem={renderMoodEntry}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={item => item.id || String(item.entry_time)}
              ListEmptyComponent={renderEmptyState}
              ListFooterComponent={renderFooter}
              contentContainerStyle={{ 
                paddingBottom: Math.max(20, bottomInset)
              }}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.3}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#FFD54F']}
                  tintColor="#FFD54F"
                />
              }
              stickySectionHeadersEnabled={true}
              onViewableItemsChanged={onViewableItemsChanged}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 0,
    marginTop: 0,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  mapToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  mapToggleActive: {
    backgroundColor: '#FFD54F',
  },
  mapToggleText: {
    fontWeight: '500',
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  entryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emotionEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  emotionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 8,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    maxWidth: '48%',
  },
  contextEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  contextText: {
    fontSize: 12,
    color: '#555',
  },
  notes: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  listContainer: {
    flex: 1,
  },
  mapWrapper: {
    height: MAP_HEIGHT,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});

export default MoodHistory; 
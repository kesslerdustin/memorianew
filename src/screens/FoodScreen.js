import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle } from '../context/VisualStyleContext';
import { useFood } from '../context/FoodContext';
import FoodEntryForm from '../components/FoodEntryForm';
import FoodHistory from '../components/FoodHistory';
import FoodEntryDetail from '../components/FoodEntryDetail';
import FoodAnalytics from '../components/FoodAnalytics';
import FoodSettingsScreen from './FoodSettingsScreen';

// Define meal types for display
const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { value: 'lunch', label: 'Lunch', emoji: '🥪' },
  { value: 'dinner', label: 'Dinner', emoji: '🍲' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
  { value: 'drink', label: 'Drink', emoji: '🥤' },
];

const FoodScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { visualStyle } = useVisualStyle();
  const { 
    foodEntries, 
    isLoading, 
    loadFoodEntries, 
    addFoodEntry, 
    updateFoodEntry, 
    deleteFoodEntry 
  } = useFood();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [activeView, setActiveView] = useState('quick'); // 'quick', 'history', 'analytics', 'settings'
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Helper function to get translated meal type label
  const getTranslatedMealType = (mealTypeValue) => {
    const mealType = MEAL_TYPES.find(m => m.value === mealTypeValue);
    return mealType ? t(mealType.value) : mealTypeValue;
  };

  // Helper function to get emoji for meal type
  const getMealTypeEmoji = (mealType) => {
    const meal = MEAL_TYPES.find(m => m.value === mealType);
    return meal ? meal.emoji : '🍽️';
  };

  // Reload entries when switching to history view
  useEffect(() => {
    if (activeView === 'history') {
      loadFoodEntries();
    }
  }, [activeView]);

  // Handle saving a new food entry
  const handleSaveFoodEntry = async (newEntry) => {
    try {
      await addFoodEntry(newEntry);
      setIsFormVisible(false);
      
      // Switch to history view
      setActiveView('history');
    } catch (error) {
      console.error('Error saving food entry:', error);
      Alert.alert(
        t('error') || 'Error',
        t('errorSavingEntry') || 'There was an error saving your food entry.'
      );
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadFoodEntries();
  };

  // Handle canceling food entry
  const handleCancel = () => {
    setIsFormVisible(false);
  };

  // Handle opening food entry details
  const handleViewFoodDetails = (entry) => {
    setSelectedEntry(entry);
    setIsDetailVisible(true);
  };

  // Handle closing food entry details
  const handleCloseDetails = () => {
    setIsDetailVisible(false);
    setSelectedEntry(null);
  };

  // Handle closing settings screen
  const handleCloseSettings = () => {
    setIsSettingsVisible(false);
  };

  // Function to clear demo data
  const clearDemoEntries = async () => {
    Alert.alert(
      'Clear Demo Data', 
      'This will remove all pre-generated demo entries and keep only the ones you have added.',
      [
        { text: 'Cancel', style: "cancel" },
        { 
          text: 'Clear Demo Data', 
          style: "destructive",
          onPress: async () => {
            // This would be implemented in the context
            alert('Demo data clearing is not implemented yet.');
          }
        }
      ]
    );
  };

  // Render the main content based on active view
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>{t('loadingFoodData') || 'Loading food data...'}</Text>
        </View>
      );
    }
    
    switch (activeView) {
      case 'quick':
        return (
          <ScrollView 
            style={styles.quickViewContainer}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.quickEntryWrapper}>
              <Text style={styles.sectionTitle}>{t('quickEntry') || 'Quick Entry'}</Text>
              <Text style={styles.sectionSubtitle}>{t('addQuickFood') || 'Add what you\'re eating now'}</Text>
              
              <View style={styles.mealTypeContainer}>
                {MEAL_TYPES.map((mealType) => (
                  <TouchableOpacity
                    key={mealType.value}
                    style={styles.mealTypeButton}
                    onPress={() => {
                      setIsFormVisible(true);
                    }}
                  >
                    <Text style={styles.mealTypeEmoji}>{mealType.emoji}</Text>
                    <Text style={styles.mealTypeLabel}>{t(mealType.value) || mealType.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Recent food entries */}
            {foodEntries.length > 0 && (
              <View style={styles.recentEntries}>
                <Text style={styles.sectionTitle}>{t('recentMeals') || 'Recent Meals'}</Text>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setActiveView('history')}
                >
                  <Text style={styles.viewAllText}>{t('viewAll') || 'View All'}</Text>
                </TouchableOpacity>
                
                <View style={styles.foodTiles}>
                  {foodEntries.slice(0, 3).map((entry) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={styles.foodTile}
                      onPress={() => handleViewFoodDetails(entry)}
                    >
                      <Text style={styles.foodTileEmoji}>{getMealTypeEmoji(entry.meal_type)}</Text>
                      <Text style={styles.foodTileName}>{entry.name}</Text>
                      <Text style={styles.foodTileCalories}>{entry.calories} kcal</Text>
                      <Text style={styles.foodTileDate}>
                        {new Date(entry.date).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* "Clear Demo Data" button */}
            <TouchableOpacity
              style={styles.clearDemoButton}
              onPress={clearDemoEntries}
            >
              <Text style={styles.clearDemoText}>Clear Demo Data</Text>
            </TouchableOpacity>
          </ScrollView>
        );
        
      case 'history':
        return (
          <FoodHistory
            entries={foodEntries}
            onEntryPress={handleViewFoodDetails}
            onEndReached={() => {}} // Pagination not implemented yet
            onRefresh={handleRefresh}
            refreshing={isLoading}
            isLoadingMore={false}
            bottomInset={insets.bottom}
            getTranslatedMealType={getTranslatedMealType}
            getMealTypeEmoji={getMealTypeEmoji}
          />
        );
        
      case 'analytics':
        return <FoodAnalytics />;
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'white', paddingTop: 0 }]} edges={['left', 'right']}>
      {/* Modal for adding a new food entry */}
      <Modal
        visible={isFormVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
        statusBarTranslucent={true}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
          <View style={styles.modalContainer}>
            <FoodEntryForm
              onClose={(savedEntry) => {
                setIsFormVisible(false);
                if (savedEntry) {
                  // If a food entry was saved, switch to history view
                  setActiveView('history');
                }
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal for viewing food entry details */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseDetails}
      >
        <FoodEntryDetail 
          entry={selectedEntry}
          onClose={handleCloseDetails}
          onDelete={(deletedId) => {
            // Removal from state is handled by the context
            handleCloseDetails();
          }}
          bottomInset={insets.bottom}
          topInset={insets.top}
          getTranslatedMealType={getTranslatedMealType}
          getMealTypeEmoji={getMealTypeEmoji}
        />
      </Modal>

      {/* Modal for settings */}
      <Modal
        visible={isSettingsVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseSettings}
      >
        <FoodSettingsScreen 
          onClose={handleCloseSettings}
          topInset={insets.top}
          bottomInset={insets.bottom}
        />
      </Modal>

      {/* Main content */}
      {renderContent()}
      
      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(22, insets.bottom / 2) }]}>
        <TouchableOpacity
          style={[styles.navButton, activeView === 'quick' && styles.activeNavButton]}
          onPress={() => setActiveView('quick')}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>{t('home') || 'Home'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, activeView === 'history' && styles.activeNavButton]}
          onPress={() => setActiveView('history')}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navText}>{t('history') || 'History'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.addEntryButton}
          onPress={() => setIsFormVisible(true)}
        >
          <Text style={styles.addEntryButtonText}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, activeView === 'analytics' && styles.activeNavButton]}
          onPress={() => setActiveView('analytics')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navText}>{t('insights') || 'Insights'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setIsSettingsVisible(true)}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navText}>{t('settings') || 'Settings'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 16,
    height: '90%',
    width: '100%',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 12,
    paddingTop: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
  },
  addEntryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addEntryButtonText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  quickViewContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 12,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  quickEntryWrapper: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  mealTypeButton: {
    width: '48%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  mealTypeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  mealTypeLabel: {
    fontWeight: 'bold',
  },
  recentEntries: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viewAllButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  viewAllText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  foodTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  foodTile: {
    width: '31%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    margin: '1%',
    alignItems: 'center',
  },
  foodTileEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  foodTileName: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  foodTileCalories: {
    fontSize: 12,
    color: '#666',
  },
  foodTileDate: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  clearDemoButton: {
    marginTop: 24,
    marginBottom: 36,
    alignSelf: 'center',
    padding: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  clearDemoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FoodScreen; 
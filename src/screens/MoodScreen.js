import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMoodEntries, initDatabase, resetDatabase } from '../database/database';
import MoodEntryForm from '../components/MoodEntryForm';
import MoodHistory from '../components/MoodHistory';
import QuickMoodEntry from '../components/QuickMoodEntry';
import ScientificSurvey from '../components/ScientificSurvey';
import MoodAnalytics from '../components/MoodAnalytics';
import MoodEntryDetail from '../components/MoodEntryDetail';
import MoodSettingsScreen from './MoodSettingsScreen';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle } from '../context/VisualStyleContext';

// Define emotions for display
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

const MoodScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { getMoodIcon, visualStyle } = useVisualStyle();
  const [moodEntries, setMoodEntries] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMoreEntries, setHasMoreEntries] = useState(true);
  const [activeView, setActiveView] = useState('quick'); // 'quick', 'history', 'analytics', 'survey'
  const [selectedRating, setSelectedRating] = useState(null);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const PAGE_SIZE = 20;

  // Helper function to get translated emotion label
  const getTranslatedEmotion = (emotionValue) => {
    const emotion = EMOTIONS.find(e => e.value === emotionValue);
    return emotion ? t(emotion.value) : emotionValue;
  };

  // Helper function to get appropriate mood icon based on visual style
  const getMoodIndicator = (rating) => {
    return getMoodIcon(rating);
  };

  // Initialize database when component mounts
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        // Try to use existing database
        await initDatabase();
        loadMoodEntries(true);
      } catch (error) {
        console.error('Error setting up database:', error);
        setIsLoading(false);
      }
    };
    
    setupDatabase();
    
    // Show a survey prompt if it's been a while
    const maybeSuggestSurvey = async () => {
      // We'll implement this logic later
      // if (shouldSuggestSurvey()) {
      //   setActiveSurvey('WHO5');
      //   setActiveView('survey');
      // }
    };
    
    maybeSuggestSurvey();
  }, []);

  // Reload entries when switching to history view
  useEffect(() => {
    if (activeView === 'history') {
      loadMoodEntries(true);
    }
  }, [activeView]);

  // Handle database reset
  const handleResetDatabase = async () => {
    Alert.alert(
      t('resetDatabase'), 
      t('resetConfirmation'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('reset'), 
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await resetDatabase();
              loadMoodEntries(true);
            } catch (error) {
              console.error('Error resetting database:', error);
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Function to load mood entries from database
  const loadMoodEntries = async (refresh = false) => {
    if (refresh) {
      console.log('Refreshing entries, resetting to page 0');
      setIsLoading(true);
      setPage(0);
      setHasMoreEntries(true);
    } else if (!hasMoreEntries) {
      console.log('No more entries to load');
      return;
    } else if (page > 0) {
      console.log(`Loading more entries from page ${page}`);
      setIsLoadingMore(true);
    }

    try {
      const currentPage = refresh ? 0 : page;
      // Make sure we're getting newest entries first
      const entries = await getMoodEntries(PAGE_SIZE, currentPage * PAGE_SIZE, true);
      
      console.log(`Loaded ${entries.length} mood entries from database (page ${currentPage})`);
      console.log('Current total entries:', moodEntries.length);
      
      if (entries.length < PAGE_SIZE) {
        console.log('No more entries available');
        setHasMoreEntries(false);
      }
      
      if (refresh) {
        console.log('Replacing mood entries with fresh data');
        setMoodEntries(entries);
      } else {
        // Check for duplicates before merging arrays
        const existingIds = new Set(moodEntries.map(entry => entry.id));
        const uniqueNewEntries = entries.filter(entry => !existingIds.has(entry.id));
        console.log(`Adding ${uniqueNewEntries.length} new entries to existing ${moodEntries.length}`);
        setMoodEntries(prevEntries => [...prevEntries, ...uniqueNewEntries]);
      }
      
      if (!refresh) {
        const nextPage = currentPage + 1;
        console.log(`Advancing to page ${nextPage}`);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading mood entries:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Handle saving a new mood entry
  const handleSaveMoodEntry = (newEntry) => {
    // Add to state for immediate feedback
    setMoodEntries(prevEntries => [newEntry, ...prevEntries]);
    setIsFormVisible(false);
    setSelectedRating(null);
    setSelectedEmotion(null);
    
    // Switch to history view without triggering a full reload
    setActiveView('history');
  };

  // Handle quick mood entry completion
  const handleQuickMoodEntry = (newEntry) => {
    // Add to state for immediate feedback
    setMoodEntries([newEntry, ...moodEntries]);
    setSelectedRating(null);
    
    // If we're already on the history view, do a full refresh to make sure it appears
    if (activeView === 'history') {
      loadMoodEntries(true);
    }
  };

  // Handle add details for a quick mood entry
  const handleAddDetails = (rating, emotion) => {
    setSelectedRating(rating);
    // Store the selected emotion
    setSelectedEmotion(emotion);
    setIsFormVisible(true);
  };

  // Handle survey completion
  const handleSurveyComplete = (results) => {
    // Reload entries to get the survey entry
    loadMoodEntries(true);
    setActiveSurvey(null);
    setActiveView('analytics'); // Show analytics after completing a survey
    
    // Show insight from the survey
    Alert.alert(
      t('surveyResults'),
      results.interpretation,
      [{ text: t('ok') }]
    );
  };

  // Handle loading more entries
  const handleLoadMore = () => {
    console.log('handleLoadMore called');
    console.log('isLoadingMore:', isLoadingMore);
    console.log('hasMoreEntries:', hasMoreEntries);
    if (!isLoadingMore && hasMoreEntries) {
      console.log('Loading more entries...');
      loadMoodEntries();
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadMoodEntries(true);
  };

  // Handle canceling mood entry or survey
  const handleCancel = () => {
    setIsFormVisible(false);
    setSelectedRating(null);
    setSelectedEmotion(null);
    if (activeView === 'survey') {
      setActiveView('quick');
      setActiveSurvey(null);
    }
  };

  // Handle opening mood entry details
  const handleViewMoodDetails = (entry) => {
    setSelectedEntry(entry);
    setIsDetailVisible(true);
  };

  // Handle closing mood entry details
  const handleCloseDetails = () => {
    setIsDetailVisible(false);
    setSelectedEntry(null);
  };

  // Handle closing settings screen
  const handleCloseSettings = () => {
    setIsSettingsVisible(false);
  };

  // Function to remove all mock data and keep only user entries
  const clearMockEntries = async () => {
    Alert.alert(
      'Clear Demo Data', 
      'This will remove all pre-generated demo entries and keep only the ones you have added.',
      [
        { text: 'Cancel', style: "cancel" },
        { 
          text: 'Clear Demo Data', 
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              // Create a temporary table with only user entries (from the last day)
              const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
              
              // Delete all entries older than 1 day
              await db.execAsync(`
                DELETE FROM mood_entries
                WHERE entry_time < ?
              `, [oneDayAgo]);
              
              loadMoodEntries(true);
              Alert.alert('Success', 'All demo data has been cleared.');
            } catch (error) {
              console.error('Error clearing mock data:', error);
              Alert.alert('Error', 'Failed to clear demo data.');
              setIsLoading(false);
            }
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
          <ActivityIndicator size="large" color="#FFD54F" />
          <Text style={styles.loadingText}>{t('loadingMoodData')}</Text>
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
            <View style={styles.quickMoodEntryWrapper}>
              <QuickMoodEntry 
                onMoodAdded={handleQuickMoodEntry}
                onDetailedEntry={handleAddDetails}
                visualStyle={visualStyle}
                getMoodIcon={getMoodIcon}
              />
            </View>
            
            {/* Survey prompts */}
            <View style={styles.surveyPrompts}>
              <Text style={styles.sectionTitle}>{t('psychologicalSurveys')}</Text>
              <Text style={styles.sectionSubtitle}>{t('surveyInsights')}</Text>
              
              <View style={styles.surveyButtons}>
                <TouchableOpacity
                  style={styles.surveyButton}
                  onPress={() => {
                    setActiveSurvey('WHO5');
                    setActiveView('survey');
                  }}
                >
                  <Text style={styles.surveyButtonTitle}>{t('who5')}</Text>
                  <Text style={styles.surveyButtonSubtitle}>{t('wellbeingIndex')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.surveyButton}
                  onPress={() => {
                    setActiveSurvey('PANAS');
                    setActiveView('survey');
                  }}
                >
                  <Text style={styles.surveyButtonTitle}>{t('panas')}</Text>
                  <Text style={styles.surveyButtonSubtitle}>{t('emotionScale')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.surveyButton}
                  onPress={() => {
                    setActiveSurvey('PHQ9');
                    setActiveView('survey');
                  }}
                >
                  <Text style={styles.surveyButtonTitle}>{t('phq9')}</Text>
                  <Text style={styles.surveyButtonSubtitle}>{t('depressionScreen')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Recent moods */}
            {moodEntries.length > 0 && (
              <View style={styles.recentMoods}>
                <Text style={styles.sectionTitle}>{t('recentMoods')}</Text>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setActiveView('history')}
                >
                  <Text style={styles.viewAllText}>{t('viewAll')}</Text>
                </TouchableOpacity>
                
                <View style={styles.moodTiles}>
                  {moodEntries.slice(0, 3).map((entry) => {
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        style={styles.moodTile}
                        onPress={() => handleViewMoodDetails(entry)}
                      >
                        <Text style={styles.moodTileEmoji}>{getMoodIndicator(entry.rating)}</Text>
                        <Text style={styles.moodTileRating}>{entry.rating}/5</Text>
                        <Text style={styles.moodTileDate}>
                          {new Date(entry.entry_time).toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            
            {/* "Clear Demo Data" button */}
            <TouchableOpacity
              style={styles.clearDemoButton}
              onPress={clearMockEntries}
            >
              <Text style={styles.clearDemoText}>Clear Demo Data</Text>
            </TouchableOpacity>
            
          </ScrollView>
        );
        
      case 'history':
        return (
          <MoodHistory
            entries={moodEntries}
            onEntryPress={handleViewMoodDetails}
            onEndReached={handleLoadMore}
            onRefresh={handleRefresh}
            refreshing={isLoading}
            isLoadingMore={isLoadingMore}
            bottomInset={insets.bottom}
            getTranslatedEmotion={getTranslatedEmotion}
            getMoodIcon={getMoodIcon}
            visualStyle={visualStyle}
          />
        );
        
      case 'analytics':
        return <MoodAnalytics />;
        
      case 'survey':
        return (
          <ScientificSurvey
            surveyType={activeSurvey}
            onComplete={handleSurveyComplete}
            onCancel={handleCancel}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'white', paddingTop: 0 }]} edges={['left', 'right']}>
      {/* Modal for adding a new mood entry */}
      <Modal
        visible={isFormVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
        statusBarTranslucent={true}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
          <View style={styles.modalContainer}>
            <MoodEntryForm
              onSave={handleSaveMoodEntry}
              onCancel={handleCancel}
              initialRating={selectedRating || 3}
              initialEmotion={selectedEmotion}
              visualStyle={visualStyle}
              getMoodIcon={getMoodIcon}
            />
          </View>
        </View>
      </Modal>

      {/* Modal for viewing mood entry details */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseDetails}
      >
        <MoodEntryDetail 
          entry={selectedEntry}
          onClose={handleCloseDetails}
          bottomInset={insets.bottom}
          topInset={insets.top}
          getTranslatedEmotion={getTranslatedEmotion}
          getMoodIcon={getMoodIcon}
        />
      </Modal>

      {/* Modal for settings */}
      <Modal
        visible={isSettingsVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseSettings}
      >
        <MoodSettingsScreen 
          onClose={handleCloseSettings}
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
          <Text style={styles.navText}>{t('home')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, activeView === 'history' && styles.activeNavButton]}
          onPress={() => setActiveView('history')}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navText}>{t('history')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.addEntryButton}
          onPress={() => {
            setSelectedRating(null);
            setIsFormVisible(true);
          }}
        >
          <Text style={styles.addEntryButtonText}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, activeView === 'analytics' && styles.activeNavButton]}
          onPress={() => setActiveView('analytics')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navText}>{t('insights')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setIsSettingsVisible(true)}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navText}>{t('settings')}</Text>
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
    height: '90%', // Set a specific height to ensure it takes most of the screen
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
    borderBottomColor: '#FFD54F',
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
    backgroundColor: '#FFD54F',
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
    paddingBottom: 80, // Add paddingBottom to ensure content isn't cut off by the bottom navigation bar
  },
  quickMoodEntryWrapper: {
    marginBottom: 40,
  },
  surveyPrompts: {
    marginTop: 20,
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
  surveyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  surveyButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    alignItems: 'center',
  },
  surveyButtonTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  surveyButtonSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recentMoods: {
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
    color: '#FFD54F',
    fontWeight: 'bold',
  },
  moodTiles: {
    flexDirection: 'row',
    marginTop: 8,
  },
  moodTile: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    alignItems: 'center',
  },
  moodTileEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodTileRating: {
    fontWeight: 'bold',
  },
  moodTileDate: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  resetButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    padding: 10,
    backgroundColor: '#FFD54F',
    borderRadius: 5,
  },
  resetButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  detailModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    width: '100%',
    paddingBottom: 20,
  },
  clearDemoButton: {
    marginTop: 24,
    marginBottom: 36,
    alignSelf: 'center',
    padding: 12,
    backgroundColor: '#FFD54F',
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

export default MoodScreen; 
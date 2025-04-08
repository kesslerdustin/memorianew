import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMoodEntries, initDatabase, resetDatabase } from '../utils/database';
import MoodEntryForm from '../components/MoodEntryForm';
import MoodHistory from '../components/MoodHistory';
import QuickMoodEntry from '../components/QuickMoodEntry';
import ScientificSurvey from '../components/ScientificSurvey';
import MoodAnalytics from '../components/MoodAnalytics';
import MoodEntryDetail from '../components/MoodEntryDetail';

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
  const insets = useSafeAreaInsets();
  const PAGE_SIZE = 20;

  // Initialize database when component mounts
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        // Try to use existing database
        await initDatabase();
        loadMoodEntries();
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

  // Handle database reset
  const handleResetDatabase = async () => {
    Alert.alert(
      "Reset Database", 
      "This will delete all your data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
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
      setIsLoading(true);
      setPage(0);
      setHasMoreEntries(true);
    } else if (!hasMoreEntries) {
      return;
    } else if (page > 0) {
      setIsLoadingMore(true);
    }

    try {
      const currentPage = refresh ? 0 : page;
      const entries = await getMoodEntries(PAGE_SIZE, currentPage * PAGE_SIZE);
      
      if (entries.length < PAGE_SIZE) {
        setHasMoreEntries(false);
      }
      
      if (refresh || currentPage === 0) {
        setMoodEntries(entries);
      } else {
        setMoodEntries([...moodEntries, ...entries]);
      }
      
      if (!refresh) {
        setPage(currentPage + 1);
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
    setMoodEntries([newEntry, ...moodEntries]);
    setIsFormVisible(false);
    setSelectedRating(null);
    setSelectedEmotion(null);
    setActiveView('history'); // Switch to history view after saving
  };

  // Handle quick mood entry completion
  const handleQuickMoodEntry = (newEntry) => {
    setMoodEntries([newEntry, ...moodEntries]);
    setSelectedRating(null);
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
      "Survey Results",
      results.interpretation,
      [{ text: "OK" }]
    );
  };

  // Handle loading more entries
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreEntries) {
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

  // Render the main content based on active view
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD54F" />
          <Text style={styles.loadingText}>Loading mood data...</Text>
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
              />
            </View>
            
            {/* Survey prompts */}
            <View style={styles.surveyPrompts}>
              <Text style={styles.sectionTitle}>Psychological Surveys</Text>
              <Text style={styles.sectionSubtitle}>Get deeper insights into your well-being</Text>
              
              <View style={styles.surveyButtons}>
                <TouchableOpacity
                  style={styles.surveyButton}
                  onPress={() => {
                    setActiveSurvey('WHO5');
                    setActiveView('survey');
                  }}
                >
                  <Text style={styles.surveyButtonTitle}>WHO-5</Text>
                  <Text style={styles.surveyButtonSubtitle}>Well-being Index</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.surveyButton}
                  onPress={() => {
                    setActiveSurvey('PANAS');
                    setActiveView('survey');
                  }}
                >
                  <Text style={styles.surveyButtonTitle}>PANAS</Text>
                  <Text style={styles.surveyButtonSubtitle}>Emotion Scale</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.surveyButton}
                  onPress={() => {
                    setActiveSurvey('PHQ9');
                    setActiveView('survey');
                  }}
                >
                  <Text style={styles.surveyButtonTitle}>PHQ-9</Text>
                  <Text style={styles.surveyButtonSubtitle}>Depression Screen</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Recent moods */}
            {moodEntries.length > 0 && (
              <View style={styles.recentMoods}>
                <Text style={styles.sectionTitle}>Recent Moods</Text>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setActiveView('history')}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
                
                <View style={styles.moodTiles}>
                  {moodEntries.slice(0, 3).map((entry) => {
                    const emotion = EMOTIONS.find(e => e.value === entry.emotion) || 
                      { label: entry.emotion, emoji: '😐' };
                    
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        style={styles.moodTile}
                        onPress={() => handleViewMoodDetails(entry)}
                      >
                        <Text style={styles.moodTileEmoji}>{emotion.emoji}</Text>
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
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(20, insets.bottom) }]}>
            <MoodEntryForm
              onSave={handleSaveMoodEntry}
              onCancel={handleCancel}
              initialRating={selectedRating || 3}
              initialEmotion={selectedEmotion}
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
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, activeView === 'history' && styles.activeNavButton]}
          onPress={() => setActiveView('history')}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navText}>History</Text>
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
          <Text style={styles.navText}>Insights</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleResetDatabase}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navText}>Reset</Text>
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
    paddingBottom: 20,
    maxHeight: '90%',
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
});

export default MoodScreen; 
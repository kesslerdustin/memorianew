import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MoodScreen from './src/screens/MoodScreen';

export default function App() {
  const [selectedSection, setSelectedSection] = useState(null);
  const [activeScreen, setActiveScreen] = useState(null);

  const sections = [
    { id: 'memories', title: 'Memories', color: '#FF8A65' },
    { id: 'diary', title: 'Diary', color: '#64B5F6' },
    { id: 'food', title: 'Food Tracker', color: '#81C784' },
    { id: 'health', title: 'Health', color: '#BA68C8' },
    { id: 'mood', title: 'Mood', color: '#FFD54F' },
    { id: 'hobbies', title: 'Hobbies', color: '#4DD0E1' },
    { id: 'skills', title: 'Skills', color: '#F06292' },
    { id: 'biography', title: 'Biography', color: '#9575CD' },
  ];

  const handleSectionPress = (sectionId) => {
    setSelectedSection(sectionId);
    
    // Set the active screen based on the selected section
    if (sectionId === 'mood') {
      setActiveScreen('mood');
    } else {
      setActiveScreen(null);
      console.log(`Navigating to ${sectionId}`);
    }
  };

  const renderPlaceholderContent = () => {
    if (!selectedSection) return null;
    
    const section = sections.find(s => s.id === selectedSection);
    return (
      <View style={[styles.placeholderContent, { backgroundColor: section.color + '33' }]}>
        <Text style={styles.placeholderText}>
          {section.title} content will be implemented here
        </Text>
      </View>
    );
  };

  // Back button handler
  const handleBack = () => {
    setActiveScreen(null);
    setSelectedSection(null);
  };

  // Render the appropriate screen based on the active screen state
  const renderScreen = () => {
    if (activeScreen === 'mood') {
      return (
        <View style={styles.screenContainer}>
          <View style={styles.screenHeader}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Mood Tracker</Text>
            <View style={{ width: 70 }} />
          </View>
          <MoodScreen />
        </View>
      );
    }
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Memoria</Text>
          <Text style={styles.subtitle}>Your life, all in one place</Text>
        </View>
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.sectionsGrid}>
            {sections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={[styles.sectionButton, { backgroundColor: section.color }]}
                onPress={() => handleSectionPress(section.id)}
              >
                <Text style={styles.sectionButtonText}>{section.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {renderPlaceholderContent()}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <View style={styles.mainContainer}>
        {renderScreen()}
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionButton: {
    width: '48%',
    height: 100,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholderContent: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
  },
  // Screen styles
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFD54F',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MoodScreen from './src/screens/MoodScreen';
import FoodScreen from './src/screens/FoodScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GlossarScreen from './src/screens/GlossarScreen';
import { LanguageProvider } from './src/context/LanguageContext';
import { VisualStyleProvider } from './src/context/VisualStyleContext';
import { PeopleProvider } from './src/context/PeopleContext';
import { MemoriesProvider } from './src/context/MemoriesContext';
import { MoodsProvider } from './src/context/MoodsContext';
import { PlacesProvider } from './src/context/PlacesContext';
import { FoodProvider } from './src/context/FoodContext';

export default function App() {
  const [selectedSection, setSelectedSection] = useState(null);
  const [activeScreen, setActiveScreen] = useState(null);
  const [isAppSettingsVisible, setIsAppSettingsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('you');

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
    
    if (sectionId === 'mood') {
      setActiveScreen('mood');
    } else if (sectionId === 'food') {
      setActiveScreen('food');
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

  const handleBack = () => {
    setActiveScreen(null);
    setSelectedSection(null);
  };

  const handleOpenSettings = () => {
    setIsAppSettingsVisible(true);
  };

  const handleCloseSettings = () => {
    setIsAppSettingsVisible(false);
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'you':
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Memoria</Text>
              <Text style={styles.subtitle}>Your life, all in one place</Text>
              <TouchableOpacity 
                style={styles.headerSettingsButton}
                onPress={handleOpenSettings}
              >
                <Text style={styles.headerSettingsIcon}>⚙️</Text>
              </TouchableOpacity>
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
      case 'world':
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>World content coming soon</Text>
          </View>
        );
      case 'glossar':
        return (
          <View style={[styles.glossarContainer, { paddingTop: 0 }]}>
            <GlossarScreen />
          </View>
        );
      default:
        return null;
    }
  };

  const renderScreen = () => {
    if (activeScreen === 'mood') {
      return (
        <View style={styles.screenContainer}>
          <View style={[styles.screenHeader, { backgroundColor: '#FFD54F' }]}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Mood Tracker</Text>
            <TouchableOpacity onPress={handleOpenSettings} style={styles.settingsButton}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <MoodScreen />
        </View>
      );
    } else if (activeScreen === 'food') {
      return (
        <View style={styles.screenContainer}>
          <View style={[styles.screenHeader, { backgroundColor: '#81C784' }]}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Food Tracker</Text>
            <TouchableOpacity onPress={handleOpenSettings} style={styles.settingsButton}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <FoodScreen />
        </View>
      );
    }
    
    return (
      <View style={styles.mainContainer}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'you' && styles.activeTab]}
            onPress={() => setActiveTab('you')}
          >
            <Text style={[styles.tabText, activeTab === 'you' && styles.activeTabText]}>
              You
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'world' && styles.activeTab]}
            onPress={() => setActiveTab('world')}
          >
            <Text style={[styles.tabText, activeTab === 'world' && styles.activeTabText]}>
              World
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'glossar' && styles.activeTab]}
            onPress={() => setActiveTab('glossar')}
          >
            <Text style={[styles.tabText, activeTab === 'glossar' && styles.activeTabText]}>
              Glossar
            </Text>
          </TouchableOpacity>
        </View>
        {renderMainContent()}
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <VisualStyleProvider>
          <PeopleProvider>
            <MemoriesProvider>
              <MoodsProvider>
                <PlacesProvider>
                  <FoodProvider>
                    <View style={styles.mainContainer}>
                      {renderScreen()}
                      <StatusBar style="auto" />
                      
                      {isAppSettingsVisible && (
                        <Modal
                          visible={isAppSettingsVisible}
                          animationType="slide"
                          transparent={false}
                          onRequestClose={handleCloseSettings}
                          statusBarTranslucent={false}
                        >
                          <SettingsScreen 
                            onClose={handleCloseSettings}
                          />
                        </Modal>
                      )}
                    </View>
                  </FoodProvider>
                </PlacesProvider>
              </MoodsProvider>
            </MemoriesProvider>
          </PeopleProvider>
        </VisualStyleProvider>
      </LanguageProvider>
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
  headerSettingsButton: {
    position: 'absolute',
    right: 16,
    top: 60,
    padding: 8,
  },
  headerSettingsIcon: {
    fontSize: 24,
    color: 'white',
  },
  settingsButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3F51B5',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#3F51B5',
    fontWeight: 'bold',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glossarContainer: {
    flex: 1, 
    backgroundColor: '#fff',
    paddingTop: 0,
  },
});

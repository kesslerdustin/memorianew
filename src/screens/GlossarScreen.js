import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle } from '../context/VisualStyleContext';
import PeopleScreen from './PeopleScreen';
import PlacesScreen from './PlacesScreen';
import ContextsScreen from './ContextsScreen';
import PersonDetailsScreen from './PersonDetailsScreen';
import AddEditPersonScreen from './AddEditPersonScreen';

const GlossarScreen = () => {
  const { t } = useLanguage();
  const { getMoodIcon } = useVisualStyle();
  const [activeTab, setActiveTab] = useState('people');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
  };

  const handleBack = () => {
    setSelectedPerson(null);
  };

  const handleAddPerson = () => {
    setEditingPerson(null);
    setShowAddEditModal(true);
  };

  const handleEditPerson = (person) => {
    setEditingPerson(person);
    setShowAddEditModal(true);
  };

  const handleCloseModal = () => {
    setShowAddEditModal(false);
    setEditingPerson(null);
  };

  const renderContent = () => {
    if (selectedPerson) {
      return (
        <PersonDetailsScreen
          person={selectedPerson}
          onBack={handleBack}
          onEdit={handleEditPerson}
        />
      );
    }

    switch (activeTab) {
      case 'people':
        return (
          <PeopleScreen
            onPersonSelect={handlePersonSelect}
            onAddPerson={handleAddPerson}
            onEditPerson={handleEditPerson}
          />
        );
      case 'places':
        return <PlacesScreen />;
      case 'contexts':
        return <ContextsScreen />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'people' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('people')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'people' ? '#3F51B5' : '#666' }
            ]}>
              {t('people')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'places' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('places')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'places' ? '#3F51B5' : '#666' }
            ]}>
              {t('places')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'contexts' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('contexts')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'contexts' ? '#3F51B5' : '#666' }
            ]}>
              {t('contexts')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>

      <Modal
        visible={showAddEditModal}
        animationType="slide"
        onRequestClose={handleCloseModal}
        statusBarTranslucent={true}
      >
        <AddEditPersonScreen
          person={editingPerson}
          onClose={handleCloseModal}
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
  header: {
    paddingTop: 0,
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3F51B5',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});

export default GlossarScreen; 
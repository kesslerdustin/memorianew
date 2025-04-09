import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useVisualStyle } from '../context/VisualStyleContext';
import PeopleScreen from './PeopleScreen';
import PlacesScreen from './PlacesScreen';
import ContextsScreen from './ContextsScreen';
import PersonDetailsScreen from './PersonDetailsScreen';
import AddEditPersonScreen from './AddEditPersonScreen';
import { 
  getPlacesGlossary, 
  getPeopleGlossary, 
  getMoodsGlossary,
  getFoodsGlossary
} from '../services/GlossaryService';

const GlossarScreen = () => {
  const { t } = useLanguage();
  const { getMoodIcon } = useVisualStyle();
  const [activeTab, setActiveTab] = useState('people');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [placesData, setPlacesData] = useState([]);
  const [peopleData, setPeopleData] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Load glossary data when tab changes
  useEffect(() => {
    loadGlossaryData();
  }, [activeTab]);

  const loadGlossaryData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'places':
          const placesGlossary = await getPlacesGlossary();
          setPlacesData(placesGlossary);
          break;
        case 'people':
          const peopleGlossary = await getPeopleGlossary();
          setPeopleData(peopleGlossary);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${activeTab} glossary:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
  };

  const handleBack = () => {
    setSelectedPerson(null);
    setSelectedPlace(null);
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

  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
  };

  const renderRelatedEntities = (entities, title) => {
    if (!entities || entities.length === 0) {
      return null;
    }

    return (
      <View style={styles.relatedSection}>
        <Text style={styles.relatedTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {entities.map((entity, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.relatedItem}
              onPress={() => {
                if (entity.entityType === 'place') {
                  handlePlaceSelect(entity.entityData);
                } else if (entity.entityType === 'person') {
                  handlePersonSelect(entity.entityData);
                }
              }}
            >
              <Text style={styles.relatedItemText}>
                {entity.entityType === 'mood' 
                  ? `${entity.entityData.emotion} (${entity.entityData.rating}/5)` 
                  : entity.entityData.name}
              </Text>
              <Text style={styles.relatedItemSubtext}>{entity.relationship}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPlaceDetails = () => {
    if (!selectedPlace) return null;

    const moods = selectedPlace.related?.mood || [];
    const foods = selectedPlace.related?.food || [];
    const people = selectedPlace.related?.person || [];

    return (
      <View style={styles.detailsContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.detailsTitle}>{selectedPlace.name}</Text>
        {selectedPlace.address && (
          <Text style={styles.detailsSubtitle}>{selectedPlace.address}</Text>
        )}
        
        {selectedPlace.notes && (
          <Text style={styles.detailsNotes}>{selectedPlace.notes}</Text>
        )}
        
        {renderRelatedEntities(moods, 'Moods at this place')}
        {renderRelatedEntities(foods, 'Food at this place')}
        {renderRelatedEntities(people, 'People at this place')}
      </View>
    );
  };

  const renderPlacesList = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#3F51B5" style={styles.loader} />;
    }

    return (
      <ScrollView style={styles.listContainer}>
        {placesData.map((place) => (
          <TouchableOpacity 
            key={place.id} 
            style={styles.listItem}
            onPress={() => handlePlaceSelect(place)}
          >
            <Text style={styles.listItemTitle}>{place.name}</Text>
            {place.address && (
              <Text style={styles.listItemSubtitle}>{place.address}</Text>
            )}
            <View style={styles.relatedCount}>
              {place.related?.mood && place.related.mood.length > 0 && (
                <Text style={styles.countTag}>
                  {place.related.mood.length} mood{place.related.mood.length !== 1 ? 's' : ''}
                </Text>
              )}
              {place.related?.food && place.related.food.length > 0 && (
                <Text style={styles.countTag}>
                  {place.related.food.length} food{place.related.food.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
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

    if (selectedPlace) {
      return renderPlaceDetails();
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
        return renderPlacesList();
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
  loader: {
    marginTop: 50,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listItem: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3F51B5',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  relatedCount: {
    flexDirection: 'row',
    marginTop: 8,
  },
  countTag: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#3F51B5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3F51B5',
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  detailsNotes: {
    fontSize: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  relatedSection: {
    marginBottom: 24,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  relatedItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 120,
  },
  relatedItemText: {
    fontWeight: 'bold',
  },
  relatedItemSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default GlossarScreen; 
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFood } from '../context/FoodContext';
import { usePeople } from '../context/PeopleContext';
import { usePlaces } from '../context/PlacesContext';
import { formatDate } from '../utils/dateUtils';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

const FoodDetailScreen = ({ route }) => {
  const { foodId } = route.params;
  const { getFoodEntry, deleteFoodEntry } = useFood();
  const { people } = usePeople();
  const { places } = usePlaces();
  const navigation = useNavigation();
  
  const foodEntry = getFoodEntry(foodId);
  
  if (!foodEntry) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Food entry not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleEdit = () => {
    navigation.navigate('EditFoodEntry', { editEntry: foodEntry });
  };

  const handleDelete = async () => {
    await deleteFoodEntry(foodId);
    navigation.goBack();
  };

  const getPeopleNames = () => {
    if (!foodEntry.people || foodEntry.people.length === 0) {
      return 'None';
    }
    
    return foodEntry.people.map(personId => {
      const person = people.find(p => p.id === personId);
      return person ? person.name : 'Unknown';
    }).join(', ');
  };

  const getPlaceName = () => {
    if (!foodEntry.place) return 'None';
    
    const place = places.find(p => p.id === foodEntry.place);
    return place ? place.name : 'Unknown';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{foodEntry.name}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleEdit}>
            <FontAwesome name="edit" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
            <FontAwesome name="trash" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      {foodEntry.image_uri && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: foodEntry.image_uri }} 
            style={styles.foodImage}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{formatDate(new Date(foodEntry.date))}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Meal Type:</Text>
          <Text style={styles.infoValue}>{foodEntry.mealType}</Text>
        </View>
      </View>

      <View style={styles.nutritionCard}>
        <Text style={styles.cardTitle}>Nutrition Information</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{foodEntry.calories || 0}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{foodEntry.protein || 0}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{foodEntry.carbs || 0}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{foodEntry.fat || 0}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.iconLabelContainer}>
            <MaterialIcons name="people" size={20} color="#666" />
            <Text style={styles.infoLabel}>People:</Text>
          </View>
          <Text style={styles.infoValue}>{getPeopleNames()}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.iconLabelContainer}>
            <MaterialIcons name="place" size={20} color="#666" />
            <Text style={styles.infoLabel}>Place:</Text>
          </View>
          <Text style={styles.infoValue}>{getPlaceName()}</Text>
        </View>
      </View>

      {foodEntry.notes && (
        <View style={styles.notesCard}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.notes}>{foodEntry.notes}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Food Journal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
    padding: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#e1e1e1',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    maxWidth: '60%',
    textAlign: 'right',
  },
  nutritionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  notes: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default FoodDetailScreen; 
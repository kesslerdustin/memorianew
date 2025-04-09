import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, TextInput } from 'react-native';
import { usePeople } from '../context/PeopleContext';

const PeopleScreen = ({ onPersonSelect, onAddPerson, onEditPerson }) => {
  const { people, loading, deletePerson } = usePeople();
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPeople(people);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = people.filter(person =>
        person.name.toLowerCase().includes(query) ||
        (person.context && person.context.toLowerCase().includes(query)) ||
        (person.status && person.status.toLowerCase().includes(query)) ||
        (person.hobbies && person.hobbies.some(hobby => hobby.toLowerCase().includes(query))) ||
        (person.interests && person.interests.some(interest => interest.toLowerCase().includes(query)))
      );
      setFilteredPeople(filtered);
    }
  }, [searchQuery, people]);

  const handlePersonPress = (person) => {
    onPersonSelect(person);
  };

  const handleDelete = (person) => {
    Alert.alert(
      'Delete Person',
      `Are you sure you want to delete ${person.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePerson(person.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete person');
            }
          }
        }
      ]
    );
  };

  const renderPersonItem = ({ item }) => (
    <TouchableOpacity
      style={styles.personItem}
      onPress={() => handlePersonPress(item)}
    >
      <View style={styles.personInfo}>
        <Text style={styles.personName}>{item.name}</Text>
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.context}</Text>
          </View>
          {item.status && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.status}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEditPerson(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search people..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredPeople}
        renderItem={renderPersonItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={onAddPerson}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  },
  listContainer: {
    padding: 16,
  },
  personItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#3F51B5',
    fontSize: 14,
  },
  deleteButton: {
    marginLeft: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default PeopleScreen; 
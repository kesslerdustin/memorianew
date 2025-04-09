import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useMemories } from '../context/MemoriesContext';
import { useMoods } from '../context/MoodsContext';

const PersonDetailsScreen = ({ person, onBack }) => {
  const { memories } = useMemories();
  const { moods } = useMoods();

  const personMemories = memories.filter(memory => 
    memory.people.some(p => p.id === person.id)
  );

  const personMoods = moods.filter(mood => 
    mood.people.some(p => p.id === person.id)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.name}>{person.name}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Context:</Text>
            <Text style={styles.value}>{person.context}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{person.status}</Text>
          </View>
          {person.birthDate && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Birth Date:</Text>
              <Text style={styles.value}>{new Date(person.birthDate).toLocaleDateString()}</Text>
            </View>
          )}
          {person.isDeceased && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Deceased Date:</Text>
              <Text style={styles.value}>{new Date(person.deceasedDate).toLocaleDateString()}</Text>
            </View>
          )}
        </View>

        {person.hobbies && person.hobbies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hobbies</Text>
            <View style={styles.tagsContainer}>
              {person.hobbies.map((hobby, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{hobby}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {person.interests && person.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.tagsContainer}>
              {person.interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {personMemories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shared Memories</Text>
            {personMemories.map(memory => (
              <View key={memory.id} style={styles.memoryCard}>
                <Text style={styles.memoryTitle}>{memory.title}</Text>
                <Text style={styles.memoryDate}>
                  {new Date(memory.date).toLocaleDateString()}
                </Text>
                <Text style={styles.memoryDescription}>{memory.description}</Text>
                {memory.photos && memory.photos.length > 0 && (
                  <ScrollView horizontal style={styles.photosContainer}>
                    {memory.photos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.photo}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}
          </View>
        )}

        {personMoods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood History</Text>
            {personMoods.map(mood => (
              <View key={mood.id} style={styles.moodCard}>
                <Text style={styles.moodDate}>
                  {new Date(mood.date).toLocaleDateString()}
                </Text>
                <Text style={styles.moodValue}>{mood.value}</Text>
                {mood.notes && (
                  <Text style={styles.moodNotes}>{mood.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3F51B5',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
    color: '#666',
  },
  value: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
  },
  memoryCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memoryDate: {
    color: '#666',
    marginBottom: 8,
  },
  memoryDescription: {
    marginBottom: 8,
  },
  photosContainer: {
    marginTop: 8,
  },
  photo: {
    width: 200,
    height: 200,
    marginRight: 8,
    borderRadius: 8,
  },
  moodCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  moodDate: {
    color: '#666',
    marginBottom: 4,
  },
  moodValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  moodNotes: {
    color: '#666',
  },
});

export default PersonDetailsScreen; 
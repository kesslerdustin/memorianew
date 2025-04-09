import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlaces } from '../context/PlacesContext';

const AddEditPlaceScreen = ({ place, onClose, readOnly = false }) => {
  const { addPlace, updatePlace } = usePlaces();
  const [name, setName] = useState(place?.name || '');
  const [address, setAddress] = useState(place?.address || '');
  const [latitude, setLatitude] = useState(place?.latitude ? String(place.latitude) : '');
  const [longitude, setLongitude] = useState(place?.longitude ? String(place.longitude) : '');
  const [notes, setNotes] = useState(place?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statusBarHeight = StatusBar.currentHeight || 0;

  const validateCoordinate = (value, type) => {
    if (!value.trim()) return null;
    
    const num = parseFloat(value);
    if (isNaN(num)) {
      Alert.alert('Error', `Invalid ${type} format. Must be a number.`);
      return false;
    }
    
    if (type === 'latitude' && (num < -90 || num > 90)) {
      Alert.alert('Error', 'Latitude must be between -90 and 90');
      return false;
    }
    
    if (type === 'longitude' && (num < -180 || num > 180)) {
      Alert.alert('Error', 'Longitude must be between -180 and 180');
      return false;
    }
    
    return num;
  };

  const handleSubmit = async () => {
    if (readOnly) return;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a place name');
      return;
    }

    // Validate coordinates if provided
    const validatedLat = validateCoordinate(latitude, 'latitude');
    if (validatedLat === false) return;
    
    const validatedLng = validateCoordinate(longitude, 'longitude');
    if (validatedLng === false) return;

    setIsSubmitting(true);
    try {
      const placeData = {
        id: place?.id || Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        address: address.trim(),
        latitude: validatedLat,
        longitude: validatedLng,
        notes: notes.trim(),
        created_at: place?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (place) {
        await updatePlace(placeData);
      } else {
        await addPlace(placeData);
      }
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save place');
      console.error('Error saving place:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView 
      style={[
        styles.safeArea, 
        Platform.OS === 'android' ? {paddingTop: statusBarHeight} : null
      ]} 
      edges={['top', 'bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{readOnly ? 'View Place' : (place ? 'Edit Place' : 'Add Place')}</Text>
          {!readOnly && (
            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
              <Text style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          )}
          {readOnly && <View style={{ width: 50 }} />}
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, readOnly && styles.readOnlyInput]}
              value={name}
              onChangeText={setName}
              placeholder="Enter place name"
              placeholderTextColor="#999"
              editable={!readOnly}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, readOnly && styles.readOnlyInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address"
              placeholderTextColor="#999"
              editable={!readOnly}
            />
          </View>

          <View style={styles.coordinatesContainer}>
            <View style={styles.coordinateInput}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={[styles.input, readOnly && styles.readOnlyInput]}
                value={latitude}
                onChangeText={setLatitude}
                placeholder="e.g. 37.7749"
                placeholderTextColor="#999"
                keyboardType="numbers-and-punctuation"
                editable={!readOnly}
              />
            </View>
            
            <View style={styles.coordinateInput}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={[styles.input, readOnly && styles.readOnlyInput]}
                value={longitude}
                onChangeText={setLongitude}
                placeholder="e.g. -122.4194"
                placeholderTextColor="#999"
                keyboardType="numbers-and-punctuation"
                editable={!readOnly}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput, readOnly && styles.readOnlyInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter notes"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!readOnly}
            />
          </View>
          
          {readOnly && place?.fromMood && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                This place was automatically created from a mood entry with location data.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    fontSize: 16,
    color: '#3F51B5',
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  coordinateInput: {
    width: '48%',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
    borderColor: '#eee',
  },
  notesInput: {
    height: 120,
  },
  infoContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoText: {
    color: '#2E7D32',
    fontSize: 14,
  },
});

export default AddEditPlaceScreen; 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePeople } from '../context/PeopleContext';

const CONTEXT_OPTIONS = [
  'Family',
  'Friend',
  'Colleague',
  'Acquaintance',
  'Relationship',
  'Other'
];

const STATUS_OPTIONS = {
  Family: ['Father', 'Mother', 'Brother', 'Sister', 'Step-Father', 'Step-Mother', 'Step-Brother', 'Step-Sister', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Cousin', 'Child', 'Step-Child'],
  Friend: ['Close Friend', 'Best Friend', 'Childhood Friend', 'Work Friend', 'School Friend'],
  Colleague: ['Manager', 'Team Lead', 'Team Member', 'Client', 'Vendor'],
  Relationship: ['Active', 'Ex', 'Complicated', 'Dating', 'Engaged', 'Married'],
  Acquaintance: ['Neighbor', 'Classmate', 'Gym Buddy', 'Club Member'],
  Other: ['Other']
};

const AddEditPersonScreen = ({ person, onClose }) => {
  const { addPerson, updatePerson } = usePeople();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeceasedDatePicker, setShowDeceasedDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    context: '',
    status: '',
    birthDate: new Date(),
    isDeceased: false,
    hobbies: [],
    interests: [],
    phoneNumber: '',
    email: '',
    socials: '',
    deceasedDate: null
  });
  const [newTag, setNewTag] = useState('');
  const [tagType, setTagType] = useState('hobbies');

  useEffect(() => {
    if (person) {
      setFormData({
        ...person,
        birthDate: person.birthDate ? new Date(person.birthDate) : new Date(),
        deceasedDate: person.deceasedDate ? new Date(person.deceasedDate) : null
      });
    }
  }, [person]);

  const handleSave = async () => {
    if (formData.name) {
      if (person) {
        await updatePerson({ ...person, ...formData });
      } else {
        await addPerson(formData);
      }
      onClose();
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        [tagType]: [...prev[tagType], newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag, type) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(t => t !== tag)
    }));
  };

  const getStatusOptions = () => {
    return STATUS_OPTIONS[formData.context] || [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {person ? 'Edit Person' : 'Add Person'}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Context</Text>
          <View style={styles.optionsContainer}>
            {CONTEXT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  formData.context === option && styles.selectedOption
                ]}
                onPress={() => {
                  setFormData({ ...formData, context: option, status: '' });
                }}
              >
                <Text style={[
                  styles.optionText,
                  formData.context === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.optionsContainer}>
            {getStatusOptions().map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  formData.status === option && styles.selectedOption
                ]}
                onPress={() => setFormData({ ...formData, status: option })}
              >
                <Text style={[
                  styles.optionText,
                  formData.status === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Deceased</Text>
          <Switch
            value={formData.isDeceased}
            onValueChange={(value) => {
              setFormData({ ...formData, isDeceased: value, status: '' });
            }}
          />
        </View>

        {formData.isDeceased && (
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDeceasedDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              Deceased Date: {formData.deceasedDate ? new Date(formData.deceasedDate).toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>
        )}

        {showDeceasedDatePicker && (
          <DateTimePicker
            value={formData.deceasedDate ? new Date(formData.deceasedDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDeceasedDatePicker(false);
              if (date) {
                setFormData({ ...formData, deceasedDate: date });
              }
            }}
          />
        )}

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            Birth Date: {formData.birthDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={formData.birthDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setFormData({ ...formData, birthDate: date });
              }
            }}
          />
        )}

        <View style={styles.tagsContainer}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add new tag"
              value={newTag}
              onChangeText={setNewTag}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={addTag}
            >
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagTypeContainer}>
            <TouchableOpacity
              style={[
                styles.tagTypeButton,
                tagType === 'hobbies' && styles.selectedTagType
              ]}
              onPress={() => setTagType('hobbies')}
            >
              <Text style={[
                styles.tagTypeText,
                tagType === 'hobbies' && styles.selectedTagTypeText
              ]}>
                Hobbies
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tagTypeButton,
                tagType === 'interests' && styles.selectedTagType
              ]}
              onPress={() => setTagType('interests')}
            >
              <Text style={[
                styles.tagTypeText,
                tagType === 'interests' && styles.selectedTagTypeText
              ]}>
                Interests
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagsList}>
            {formData.hobbies.map((tag, index) => (
              <View key={index} style={[styles.tag, styles.hobbyTag]}>
                <Text style={[styles.tagText, styles.hobbyText]}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag, 'hobbies')}>
                  <Text style={styles.removeTag}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {formData.interests.map((tag, index) => (
              <View key={index} style={[styles.tag, styles.interestTag]}>
                <Text style={[styles.tagText, styles.interestText]}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag, 'interests')}>
                  <Text style={styles.removeTag}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Social Media"
          value={formData.socials}
          onChangeText={(text) => setFormData({ ...formData, socials: text })}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>{person ? 'Update' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    padding: 8,
    margin: 4,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  selectedOption: {
    backgroundColor: '#3F51B5',
  },
  optionText: {
    color: '#666',
  },
  selectedOptionText: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  dateButtonText: {
    color: '#666',
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: '#3F51B5',
    padding: 8,
    borderRadius: 4,
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tagTypeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tagTypeButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedTagType: {
    backgroundColor: '#3F51B5',
  },
  tagTypeText: {
    color: '#666',
  },
  selectedTagTypeText: {
    color: 'white',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    padding: 4,
    margin: 4,
  },
  hobbyTag: {
    backgroundColor: '#E3F2FD',
  },
  interestTag: {
    backgroundColor: '#F3E5F5',
  },
  tagText: {
    marginRight: 4,
  },
  hobbyText: {
    color: '#1976D2',
  },
  interestText: {
    color: '#7B1FA2',
  },
  removeTag: {
    color: '#666',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    padding: 12,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#3F51B5',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default AddEditPersonScreen; 
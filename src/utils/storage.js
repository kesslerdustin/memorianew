/**
 * Storage utilities for persisting data in Memoria
 * 
 * Note: This is a temporary implementation using AsyncStorage.
 * In the future, this will be replaced with encrypted storage
 * as specified in the technical documentation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  MOOD_ENTRIES: 'memoria_mood_entries',
};

/**
 * Save a mood entry to storage
 * 
 * @param {Object} moodEntry - The mood entry to save
 * @returns {Promise<void>}
 */
export async function saveMoodEntry(moodEntry) {
  try {
    // Get existing entries
    const existingEntries = await getMoodEntries();
    
    // Add new entry to the beginning of the array (most recent first)
    const updatedEntries = [moodEntry, ...existingEntries];
    
    // Save the updated array
    await AsyncStorage.setItem(
      STORAGE_KEYS.MOOD_ENTRIES, 
      JSON.stringify(updatedEntries)
    );
    
    console.log('Mood entry saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving mood entry:', error);
    return false;
  }
}

/**
 * Get all mood entries from storage
 * 
 * @returns {Promise<Array>} Array of mood entries
 */
export async function getMoodEntries() {
  try {
    const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.MOOD_ENTRIES);
    return entriesJson ? JSON.parse(entriesJson) : [];
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    return [];
  }
}

/**
 * Update an existing mood entry
 * 
 * @param {string} id - ID of the entry to update
 * @param {Object} updatedEntry - Updated entry data
 * @returns {Promise<boolean>} Success status
 */
export async function updateMoodEntry(id, updatedEntry) {
  try {
    const entries = await getMoodEntries();
    const index = entries.findIndex(entry => entry.id === id);
    
    if (index === -1) {
      console.error('Entry not found');
      return false;
    }
    
    entries[index] = { ...entries[index], ...updatedEntry };
    await AsyncStorage.setItem(
      STORAGE_KEYS.MOOD_ENTRIES, 
      JSON.stringify(entries)
    );
    
    console.log('Mood entry updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating mood entry:', error);
    return false;
  }
}

/**
 * Delete a mood entry
 * 
 * @param {string} id - ID of the entry to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMoodEntry(id) {
  try {
    const entries = await getMoodEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.MOOD_ENTRIES, 
      JSON.stringify(filteredEntries)
    );
    
    console.log('Mood entry deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    return false;
  }
}

/**
 * Clear all mood entries (for testing/debugging)
 * 
 * @returns {Promise<boolean>} Success status
 */
export async function clearMoodEntries() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.MOOD_ENTRIES);
    console.log('All mood entries cleared');
    return true;
  } catch (error) {
    console.error('Error clearing mood entries:', error);
    return false;
  }
} 
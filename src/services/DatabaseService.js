/**
 * DatabaseService.js
 * 
 * Central service for all database operations in Memoria
 * Provides unified access to entity data and relationships
 */

import { initAllDatabases } from '../database/UnifiedDB';
import { addFoodEntryWithReferences, getAllFoodEntriesWithRelated, resetFoodDB } from '../database/FoodDB';
import { saveMoodEntryWithReferences, getMoodEntriesWithRelated, resetDatabase as resetMoodsDB } from '../database/MoodsDB';
import { addPlaceWithReferences, getPlaceWithRelated, mergeDuplicatePlaces } from '../database/PlacesDB';
import { getAllPeople } from '../database/PeopleDB';
import { getAllMemories } from '../database/MemoriesDB';
import * as FileSystem from 'expo-file-system';

/**
 * Initialize all databases
 */
export const initDatabase = async () => {
  try {
    await initAllDatabases();
    console.log('All databases initialized successfully');
    
    // Run initial maintenance tasks
    await cleanupDuplicatePlaces();
  } catch (error) {
    console.error('Error initializing databases:', error);
    throw error;
  }
};

/**
 * Add a food entry with all cross-references
 */
export const addFood = async (foodEntry) => {
  try {
    return await addFoodEntryWithReferences(foodEntry);
  } catch (error) {
    console.error('Error adding food:', error);
    throw error;
  }
};

/**
 * Add a mood entry with all cross-references
 */
export const addMood = async (moodEntry) => {
  try {
    return await saveMoodEntryWithReferences(moodEntry);
  } catch (error) {
    console.error('Error adding mood:', error);
    throw error;
  }
};

/**
 * Add a place with all cross-references
 */
export const addPlace = async (placeEntry) => {
  try {
    return await addPlaceWithReferences(placeEntry);
  } catch (error) {
    console.error('Error adding place:', error);
    throw error;
  }
};

/**
 * Get food entries with related moods
 */
export const getFoodsWithRelated = async (limit = 100, offset = 0) => {
  try {
    return await getAllFoodEntriesWithRelated(limit, offset);
  } catch (error) {
    console.error('Error getting foods with related entities:', error);
    throw error;
  }
};

/**
 * Get mood entries with related foods
 */
export const getMoodsWithRelated = async (limit = 20, offset = 0) => {
  try {
    return await getMoodEntriesWithRelated(limit, offset);
  } catch (error) {
    console.error('Error getting moods with related entities:', error);
    throw error;
  }
};

/**
 * Get place details with all related entities
 */
export const getPlaceDetails = async (placeId) => {
  try {
    return await getPlaceWithRelated(placeId);
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
};

/**
 * Find and merge duplicate places
 */
export const cleanupDuplicatePlaces = async () => {
  try {
    const mergedCount = await mergeDuplicatePlaces();
    console.log(`Merged ${mergedCount} duplicate places`);
    return mergedCount;
  } catch (error) {
    console.error('Error cleaning up duplicate places:', error);
    return 0;
  }
};

/**
 * Get all entity data (for developing the glossary view)
 */
export const getAllEntityData = async () => {
  try {
    const [foods, moods, places, people, memories] = await Promise.all([
      getAllFoodEntriesWithRelated(),
      getMoodEntriesWithRelated(),
      getAllPlaces(),
      getAllPeople(),
      getAllMemories()
    ]);
    
    return {
      foods,
      moods,
      places,
      people,
      memories
    };
  } catch (error) {
    console.error('Error getting all entity data:', error);
    throw error;
  }
};

/**
 * Reset ALL databases in the application
 * This will delete all data from all databases and reinitialize them
 */
export const resetAllDatabases = async () => {
  try {
    console.log('Resetting all databases...');
    
    // Close and delete all database files
    const dbFiles = [
      'memoria.db',     // Moods database
      'food.db',        // Food database 
      'places.db',      // Places database
      'people.db',      // People database
      'memories.db',    // Memories database
      'relationships.db' // Relationships database
    ];
    
    // Force close all database connections first
    await Promise.all([
      resetMoodsDB(),
      resetFoodDB()
      // Other reset functions as they become available
    ]).catch(err => console.warn('Error closing some database connections:', err));
    
    // Small delay to ensure connections are closed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now delete the database files
    for (const dbFile of dbFiles) {
      try {
        const dbPath = FileSystem.documentDirectory + 'SQLite/' + dbFile;
        const fileInfo = await FileSystem.getInfoAsync(dbPath);
        
        if (fileInfo.exists) {
          console.log(`Deleting database file: ${dbFile}`);
          await FileSystem.deleteAsync(dbPath, { idempotent: true });
        }
      } catch (error) {
        console.error(`Error deleting database file ${dbFile}:`, error);
        // Continue with other files even if one fails
      }
    }
    
    // Ensure SQLite directory exists
    const sqliteDir = FileSystem.documentDirectory + 'SQLite/';
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }
    
    // Reinitialize all databases but skip the cleanupDuplicatePlaces call
    // This avoids the readonly database issue
    await initAllDatabases();
    
    // We're skipping the cleanupDuplicatePlaces call here since there's no data to clean up after a reset
    // The next time the app starts normally, it will run the cleanup task
    
    console.log('All databases reset and reinitialized successfully');
    
    return true;
  } catch (error) {
    console.error('Error resetting all databases:', error);
    throw error;
  }
}; 
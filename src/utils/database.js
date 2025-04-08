/**
 * Database utilities for persisting data in Memoria
 * 
 * This implements a SQLite-based local database for efficient
 * storage and retrieval of large amounts of data.
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Database connection
let db = null;

/**
 * Reset the database by closing it and deleting the file
 * Sometimes necessary when schema changes cause conflicts
 * @returns {Promise<void>}
 */
export async function resetDatabase() {
  console.log("Attempting to reset database...");
  try {
    // First close the database if it's open
    if (db) {
      console.log("Closing database connection");
      await db.closeAsync();
      db = null;
    }
    
    // Try to delete the database file
    try {
      const dbPath = FileSystem.documentDirectory + 'SQLite/memoria.db';
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      if (fileInfo.exists) {
        console.log("Database file exists, deleting it");
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
        console.log("Database file deleted");
      } else {
        console.log("Database file does not exist at:", dbPath);
      }
    } catch (deleteError) {
      console.log("Error deleting database file:", deleteError);
      // Continue anyway
    }
    
    // Reinitialize the database
    console.log("Reinitializing database");
    await initDatabase();
    console.log("Database reset completed");
  } catch (error) {
    console.error("Failed to reset database:", error);
  }
}

/**
 * Initialize the database
 * @returns {Promise<void>}
 */
export async function initDatabase() {
  if (db !== null) {
    return;
  }
  
  try {
    console.log("Opening database...");
    // Open database
    db = await SQLite.openDatabaseAsync('memoria.db');
    console.log("Database connection established");
    
    // Create tables if they don't exist
    try {
      console.log("Creating user profile table...");
      // Create user profile table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_profile (
          id TEXT PRIMARY KEY,
          name TEXT,
          birthdate TEXT,
          profile_image TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      
      console.log("Creating mood entries table...");
      // Create mood entries table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS mood_entries (
          id TEXT PRIMARY KEY,
          entry_time INTEGER NOT NULL,
          rating INTEGER NOT NULL,
          emotion TEXT NOT NULL,
          notes TEXT,
          location TEXT,
          social_context TEXT,
          weather TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      
      console.log("Creating tags table...");
      // Create tags for mood entries (many-to-many)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS mood_tags (
          id TEXT PRIMARY KEY,
          mood_id TEXT NOT NULL,
          tag_name TEXT NOT NULL,
          FOREIGN KEY (mood_id) REFERENCES mood_entries (id) 
            ON DELETE CASCADE
        );
      `);
      
      console.log("Creating activities table...");
      // Create activities for mood entries (many-to-many)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS mood_activities (
          id TEXT PRIMARY KEY,
          mood_id TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          activity_name TEXT NOT NULL,
          FOREIGN KEY (mood_id) REFERENCES mood_entries (id) 
            ON DELETE CASCADE
        );
      `);
      
      console.log("Creating indexes...");
      // Create indexes for better performance
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS mood_entries_timestamp 
        ON mood_entries (entry_time);
      `);
      
      console.log('Database initialized successfully');
    } catch (tableError) {
      console.error('Error creating tables:', tableError);
      if (tableError.message) {
        console.error('Error message:', tableError.message);
      }
      if (tableError.cause) {
        console.error('Error cause:', tableError.cause);
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    throw error;
  }
}

/**
 * Create media directories
 * @returns {Promise<void>}
 */
export async function initMediaStorage() {
  const mediaDir = FileSystem.documentDirectory + 'media/';
  const mediaDirInfo = await FileSystem.getInfoAsync(mediaDir);
  
  if (!mediaDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });
  }
  
  // Create subdirectories for different media types
  const dirs = ['images', 'audio', 'videos', 'documents'];
  
  for (const dir of dirs) {
    const fullPath = mediaDir + dir;
    const dirInfo = await FileSystem.getInfoAsync(fullPath);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(fullPath, { intermediates: true });
    }
  }
  
  console.log('Media storage initialized');
}

/**
 * Generates a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

// MOOD ENTRIES OPERATIONS

/**
 * Validate a mood entry before saving
 * @param {Object} entry - Mood entry to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateMoodEntry(entry) {
  if (!entry.id) return "Missing id";
  if (entry.entry_time === undefined || entry.entry_time === null) return "Missing entry_time";
  if (entry.rating === undefined || entry.rating === null) return "Missing rating";
  if (!entry.emotion) return "Missing emotion";
  return null;
}

/**
 * Save a mood entry to the database
 * @param {Object} moodEntry - Mood entry data
 * @returns {Promise<Object>} Saved mood entry object
 */
export async function saveMoodEntry(moodEntry) {
  if (!db) {
    await initDatabase();
  }
  
  // Create a complete entry with all required fields
  const entryWithTimestamps = {
    id: moodEntry.id || generateId(),
    entry_time: moodEntry.entry_time ? Number(moodEntry.entry_time) : Date.now(), // Ensure it's a number and always has a value
    rating: moodEntry.rating || 3, // Default to neutral
    emotion: moodEntry.emotion || "neutral", // Default emotion
    notes: moodEntry.notes || "",
    location: moodEntry.location || null,
    socialContext: moodEntry.socialContext || null,
    weather: moodEntry.weather || null,
    tags: moodEntry.tags || [],
    activities: moodEntry.activities || {},
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
  };
  
  // Validate that this entry has all required fields
  const validationError = validateMoodEntry(entryWithTimestamps);
  if (validationError) {
    const error = new Error(`Invalid mood entry: ${validationError}`);
    console.error('Validation failed:', error);
    console.error('Mood entry data:', entryWithTimestamps);
    throw error;
  }
  
  try {
    console.log("Saving mood entry with entry_time:", entryWithTimestamps.entry_time);
    
    // Debug the entry values
    console.log("Entry values:", {
      id: entryWithTimestamps.id,
      entry_time: entryWithTimestamps.entry_time,
      rating: entryWithTimestamps.rating,
      emotion: entryWithTimestamps.emotion
    });
    
    // Use a direct SQL construction approach to debug the issue
    // Explicitly cast all values to their proper types to avoid binding issues
    const insertQuery = `
      INSERT INTO mood_entries (
        id, entry_time, rating, emotion, notes, location, social_context, weather, created_at, updated_at
      ) VALUES (
        '${entryWithTimestamps.id}', 
        ${parseInt(entryWithTimestamps.entry_time)}, 
        ${parseInt(entryWithTimestamps.rating)}, 
        '${entryWithTimestamps.emotion}', 
        '${entryWithTimestamps.notes || ""}',
        ${entryWithTimestamps.location ? `'${entryWithTimestamps.location}'` : 'NULL'},
        ${entryWithTimestamps.socialContext ? `'${entryWithTimestamps.socialContext}'` : 'NULL'},
        ${entryWithTimestamps.weather ? `'${entryWithTimestamps.weather}'` : 'NULL'},
        '${entryWithTimestamps.created_at}',
        '${entryWithTimestamps.updated_at}'
      );
    `;
    
    console.log("Executing SQL:", insertQuery);
    
    await db.execAsync(insertQuery);
    
    // Now that the entry is definitely created, add tags if any
    if (entryWithTimestamps.tags && entryWithTimestamps.tags.length > 0) {
      for (const tag of entryWithTimestamps.tags) {
        if (tag && tag.trim() !== '') {
          try {
            console.log("Inserting tag:", tag, "for mood entry:", entryWithTimestamps.id);
            const tagId = generateId();
            const tagInsertQuery = `
              INSERT INTO mood_tags (id, mood_id, tag_name)
              VALUES ('${tagId}', '${entryWithTimestamps.id}', '${tag.trim()}');
            `;
            await db.execAsync(tagInsertQuery);
          } catch (tagError) {
            console.error('Error inserting tag:', tagError);
            // Continue with other tags even if one fails
          }
        }
      }
    }
    
    // Add activities if any
    if (entryWithTimestamps.activities && Object.keys(entryWithTimestamps.activities).length > 0) {
      for (const [type, name] of Object.entries(entryWithTimestamps.activities)) {
        if (type && name) {
          try {
            console.log("Inserting activity:", type, name, "for mood entry:", entryWithTimestamps.id);
            const activityId = generateId();
            const activityInsertQuery = `
              INSERT INTO mood_activities (id, mood_id, activity_type, activity_name)
              VALUES ('${activityId}', '${entryWithTimestamps.id}', '${type}', '${name}');
            `;
            await db.execAsync(activityInsertQuery);
          } catch (activityError) {
            console.error('Error inserting activity:', activityError);
            // Continue with other activities even if one fails
          }
        }
      }
    }
    
    return entryWithTimestamps;
  } catch (error) {
    console.error('Error saving mood entry:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    console.error('Failed entry data:', {
      id: entryWithTimestamps.id,
      entry_time: entryWithTimestamps.entry_time,
      entry_time_type: typeof entryWithTimestamps.entry_time,
      rating: entryWithTimestamps.rating,
      emotion: entryWithTimestamps.emotion,
      notes: entryWithTimestamps.notes
    });
    throw error;
  }
}

/**
 * Get mood entries with pagination
 * @param {number} limit - Maximum number of entries to return
 * @param {number} offset - Number of entries to skip
 * @returns {Promise<Array>} Array of mood entries
 */
export async function getMoodEntries(limit = 20, offset = 0) {
  if (!db) {
    await initDatabase();
  }
  
  try {
    // Get entries with tags and activities
    const result = await db.getAllAsync(`
      SELECT 
        e.id, e.entry_time, e.rating, e.emotion, e.notes,
        e.location, e.social_context as socialContext, e.weather,
        e.created_at, e.updated_at
      FROM 
        mood_entries e
      ORDER BY 
        e.entry_time DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    const entries = [];
    
    for (const entry of result) {
      // Get tags for this entry
      const tagResult = await db.getAllAsync(
        `SELECT tag_name FROM mood_tags
        WHERE mood_id = ?;`,
        [entry.id]
      );
      
      const tags = tagResult.map(row => row.tag_name);
      
      // Get activities for this entry
      const activityResult = await db.getAllAsync(
        `SELECT activity_type, activity_name FROM mood_activities
        WHERE mood_id = ?;`,
        [entry.id]
      );
      
      const activities = {};
      for (const item of activityResult) {
        activities[item.activity_type] = item.activity_name;
      }
      
      // Combine data and add to entries
      entries.push({
        id: entry.id,
        entry_time: entry.entry_time,
        rating: entry.rating,
        emotion: entry.emotion,
        notes: entry.notes,
        location: entry.location,
        socialContext: entry.socialContext,
        weather: entry.weather,
        tags,
        activities
      });
    }
    
    return entries;
  } catch (error) {
    console.error("Error getting mood entries:", error);
    return [];
  }
}

/**
 * Get a specific mood entry by id
 * @param {string} id - Entry ID
 * @returns {Promise<Object|null>} Mood entry or null if not found
 */
export async function getMoodEntryById(id) {
  if (!db) {
    await initDatabase();
  }
  
  try {
    // Get the entry
    const result = await db.getAllAsync(`
      SELECT 
        e.id, e.entry_time, e.rating, e.emotion, e.notes,
        e.location, e.social_context as socialContext, e.weather,
        e.created_at, e.updated_at
      FROM 
        mood_entries e
      WHERE 
        e.id = ?
    `, [id]);
    
    if (result.length === 0) {
      return null;
    }
    
    const entry = result[0];
    
    // Get tags for this entry
    const tagResult = await db.getAllAsync(
      `SELECT tag_name FROM mood_tags
      WHERE mood_id = ?;`,
      [entry.id]
    );
    
    const tags = tagResult.map(row => row.tag_name);
    
    // Get activities for this entry
    const activityResult = await db.getAllAsync(
      `SELECT activity_type, activity_name FROM mood_activities
      WHERE mood_id = ?;`,
      [entry.id]
    );
    
    const activities = {};
    for (const item of activityResult) {
      activities[item.activity_type] = item.activity_name;
    }
    
    // Combine data
    return {
      id: entry.id,
      entry_time: entry.entry_time,
      rating: entry.rating,
      emotion: entry.emotion,
      notes: entry.notes,
      location: entry.location,
      socialContext: entry.socialContext,
      weather: entry.weather,
      tags,
      activities
    };
  } catch (error) {
    console.error(`Error getting mood entry ${id}:`, error);
    return null;
  }
}

/**
 * Update a mood entry
 * @param {string} id - Entry ID
 * @param {Object} updatedData - Updated entry data
 * @returns {Promise<Object>} Updated entry
 */
export async function updateMoodEntry(id, updatedData) {
  if (!db) {
    await initDatabase();
  }
  
  try {
    // First get the current entry
    const result = await db.getAllAsync(
      `SELECT * FROM mood_entries WHERE id = ?;`,
      [id]
    );
    
    if (result.length === 0) {
      throw new Error('Entry not found');
    }
    
    const currentEntry = result[0];
    const entry_time = updatedData.entry_time ?? currentEntry.entry_time;
    
    // Update the mood entry
    await db.execAsync(
      `UPDATE mood_entries
      SET entry_time = ?, rating = ?, emotion = ?, notes = ?, location = ?, social_context = ?, weather = ?, updated_at = ?
      WHERE id = ?;`,
      [
        entry_time,
        updatedData.rating ?? currentEntry.rating,
        updatedData.emotion ?? currentEntry.emotion,
        updatedData.notes ?? currentEntry.notes,
        updatedData.location ?? currentEntry.location,
        updatedData.socialContext ?? currentEntry.social_context,
        updatedData.weather ?? currentEntry.weather,
        getTimestamp(),
        id
      ]
    );
    
    // If updating tags
    if (updatedData.tags) {
      // Delete existing tags
      await db.execAsync(
        `DELETE FROM mood_tags WHERE mood_id = ?;`,
        [id]
      );
      
      // Insert new tags
      for (const tag of updatedData.tags) {
        await db.execAsync(
          `INSERT INTO mood_tags (id, mood_id, tag_name)
          VALUES (?, ?, ?);`,
          [generateId(), id, tag]
        );
      }
    }
    
    // If updating activities
    if (updatedData.activities) {
      // Delete existing activities
      await db.execAsync(
        `DELETE FROM mood_activities WHERE mood_id = ?;`,
        [id]
      );
      
      // Insert new activities
      for (const [type, name] of Object.entries(updatedData.activities)) {
        await db.execAsync(
          `INSERT INTO mood_activities (id, mood_id, activity_type, activity_name)
          VALUES (?, ?, ?, ?);`,
          [generateId(), id, type, name]
        );
      }
    }
    
    // Return the updated entry
    return await getMoodEntryById(id);
  } catch (error) {
    console.error('Error updating mood entry:', error);
    throw error;
  }
}

/**
 * Delete a mood entry
 * @param {string} id - Entry ID to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMoodEntry(id) {
  if (!db) {
    await initDatabase();
  }
  
  try {
    // Delete the mood entry
    const result = await db.execAsync(
      `DELETE FROM mood_entries WHERE id = ?;`,
      [id]
    );
    
    // Related tags and activities will be deleted via ON DELETE CASCADE
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    throw error;
  }
}

// MEDIA OPERATIONS

/**
 * Save a media file
 * @param {string} uri - Local URI of the file
 * @param {string} type - Media type (images, audio, videos, documents)
 * @param {string} filename - Optional filename, generated if not provided
 * @returns {Promise<string>} Saved file path
 */
export async function saveMediaFile(uri, type, filename = null) {
  if (!['images', 'audio', 'videos', 'documents'].includes(type)) {
    throw new Error('Invalid media type');
  }
  
  await initMediaStorage();
  
  const mediaDir = FileSystem.documentDirectory + 'media/';
  const fileExt = uri.split('.').pop();
  const fileName = filename || `${generateId()}.${fileExt}`;
  const filePath = `${mediaDir}${type}/${fileName}`;
  
  await FileSystem.copyAsync({
    from: uri,
    to: filePath
  });
  
  return filePath;
}

/**
 * Get media file info
 * @param {string} filePath - Path to the media file
 * @returns {Promise<Object>} File info
 */
export async function getMediaFileInfo(filePath) {
  return await FileSystem.getInfoAsync(filePath);
}

/**
 * Delete a media file
 * @param {string} filePath - Path to the media file
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMediaFile(filePath) {
  const fileInfo = await FileSystem.getInfoAsync(filePath);
  
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(filePath);
    return true;
  }
  
  return false;
}

/**
 * Database statistics
 * @returns {Promise<Object>} Statistics about the database
 */
export async function getDatabaseStats() {
  if (!db) {
    await initDatabase();
  }
  
  try {
    const stats = {};
    
    // Count mood entries
    const moodEntriesResult = await db.getAllAsync(
      `SELECT COUNT(*) as count FROM mood_entries;`
    );
    stats.moodEntries = moodEntriesResult[0].count;
    
    // Get oldest entry date
    const oldestResult = await db.getAllAsync(
      `SELECT MIN(entry_time) as oldest FROM mood_entries;`
    );
    stats.oldestEntry = oldestResult[0].oldest ? new Date(oldestResult[0].oldest) : null;
    
    // Get newest entry date
    const newestResult = await db.getAllAsync(
      `SELECT MAX(entry_time) as newest FROM mood_entries;`
    );
    stats.newestEntry = newestResult[0].newest ? new Date(newestResult[0].newest) : null;
    
    // Count tags
    const tagsResult = await db.getAllAsync(
      `SELECT COUNT(*) as count FROM mood_tags;`
    );
    stats.tags = tagsResult[0].count;
    
    // Count activities
    const activitiesResult = await db.getAllAsync(
      `SELECT COUNT(*) as count FROM mood_activities;`
    );
    stats.activities = activitiesResult[0].count;
    
    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
}
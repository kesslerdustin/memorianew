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
    
    // Generate mock data after reset
    await generateMockData();
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
      
      console.log("Creating metadata table for extended mood data...");
      // Create metadata table for extended data (location coords, weather details, etc.)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS mood_entry_metadata (
          id TEXT PRIMARY KEY,
          mood_id TEXT NOT NULL,
          metadata_type TEXT NOT NULL,
          metadata_value TEXT NOT NULL,
          created_at TEXT NOT NULL,
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
      
      // Check if we need to generate mock data (if no entries exist)
      const entriesCount = await getDatabaseStats();
      if (!entriesCount.moodEntries || entriesCount.moodEntries === 0) {
        console.log('No entries found, generating mock data...');
        await generateMockData();
      }
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
 * Generate mock data for testing
 * Creates a set of mood entries spanning the last year
 * with various ratings, emotions, locations, etc.
 * @returns {Promise<void>}
 */
export async function generateMockData() {
  if (!db) {
    await initDatabase();
  }

  try {
    console.log("Generating mock mood entries...");
    
    // Define possible values for emotions, locations, etc.
    const emotions = [
      'happy', 'sad', 'angry', 'anxious', 'calm', 
      'excited', 'tired', 'bored', 'grateful', 'confused',
      'hopeful', 'content'
    ];
    
    const locations = [
      'Home', 'Work', 'School', 'Coffee Shop', 'Gym', 
      'Park', 'Restaurant', 'Friends Place', 'Library'
    ];
    
    const socialContexts = [
      'Alone', 'With Friends', 'With Family', 'With Partner', 
      'In a Crowd', 'With Colleagues', 'With Strangers'
    ];
    
    const weatherConditions = [
      'Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Snowy', 'Foggy', 'Hot', 'Cold'
    ];
    
    const tags = [
      'work', 'study', 'exercise', 'relaxation', 'social', 'health', 
      'stress', 'achievement', 'disappointment', 'excitement', 'boredom'
    ];
    
    const activityTypes = {
      'physical': ['Running', 'Yoga', 'Gym', 'Walking', 'Cycling', 'Swimming'],
      'social': ['Party', 'Dinner', 'Coffee', 'Call', 'Meeting'],
      'leisure': ['Reading', 'Movies', 'Gaming', 'Music', 'Cooking'],
      'work': ['Meeting', 'Project', 'Deadline', 'Presentation'],
      'self_care': ['Meditation', 'Journaling', 'Therapy', 'Rest']
    };
    
    const notesTemplates = [
      "Feeling [emotion] today because of [event].",
      "Had a [adjective] day at [location].",
      "Spent time [activity] which made me feel [emotion].",
      "Woke up feeling [emotion] and it [improved/stayed the same/got worse].",
      "[Weather] weather affected my mood today.",
      "Had an interaction with [person] that left me feeling [emotion].",
      "Taking some time for self-care today.",
      "Stressed about [stressor] but trying to stay positive.",
      "Celebrated a small win today!",
      "Feeling overwhelmed with tasks and responsibilities.",
      "Had a productive day and feeling accomplished.",
      "Tired but satisfied with how the day went."
    ];
    
    const adjectives = [
      'great', 'terrible', 'okay', 'busy', 'relaxing', 
      'stressful', 'exciting', 'boring', 'unusual', 'ordinary'
    ];
    
    const events = [
      'work', 'a conversation', 'the news', 'family matters', 
      'achievements', 'setbacks', 'unexpected changes', 'health issues'
    ];
    
    const activities = [
      'exercising', 'reading', 'watching TV', 'working', 'socializing', 
      'cooking', 'cleaning', 'shopping', 'studying', 'meditating'
    ];
    
    const people = [
      'a friend', 'a family member', 'a colleague', 'my partner', 
      'a stranger', 'my boss', 'an old friend', 'a neighbor'
    ];
    
    const stressors = [
      'work deadlines', 'financial concerns', 'relationship issues', 
      'health problems', 'family matters', 'personal projects'
    ];
    
    // Function to generate random note
    const generateNote = () => {
      let template = notesTemplates[Math.floor(Math.random() * notesTemplates.length)];
      
      // Replace placeholders with random values
      template = template.replace('[emotion]', emotions[Math.floor(Math.random() * emotions.length)]);
      template = template.replace('[adjective]', adjectives[Math.floor(Math.random() * adjectives.length)]);
      template = template.replace('[location]', locations[Math.floor(Math.random() * locations.length)]);
      template = template.replace('[activity]', activities[Math.floor(Math.random() * activities.length)]);
      template = template.replace('[improved/stayed the same/got worse]', ['improved', 'stayed the same', 'got worse'][Math.floor(Math.random() * 3)]);
      template = template.replace('[Weather]', weatherConditions[Math.floor(Math.random() * weatherConditions.length)]);
      template = template.replace('[person]', people[Math.floor(Math.random() * people.length)]);
      template = template.replace('[stressor]', stressors[Math.floor(Math.random() * stressors.length)]);
      template = template.replace('[event]', events[Math.floor(Math.random() * events.length)]);
      
      return template;
    };
    
    // Generate entries for a year
    const now = Date.now();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    
    // Create varying density of entries
    // More entries in recent months, fewer in older months
    const entryCountsByMonth = [
      2,  // 1 year ago
      2,
      2,
      3,
      3,
      4,
      4,
      5,
      5,
      5,
      6,
      6,  // 1 month ago
      8   // Current month
    ];
    
    let allEntries = [];
    
    // Generate entries for each month
    for (let i = 0; i < entryCountsByMonth.length; i++) {
      const entryCount = entryCountsByMonth[i];
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - (12 - i));
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date();
      if (i < entryCountsByMonth.length - 1) {
        monthEnd.setMonth(monthEnd.getMonth() - (11 - i));
        monthEnd.setDate(0); // Last day of the previous month
      }
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthDuration = monthEnd.getTime() - monthStart.getTime();
      
      for (let j = 0; j < entryCount; j++) {
        // Distribute entries throughout the month
        const entryTime = monthStart.getTime() + Math.random() * monthDuration;
        const date = new Date(entryTime);
        
        // Generate some patterns in the data:
        // - Mood tends to be better on weekends
        // - Mood tends to be worse in the morning for some days
        // - Some days have multiple entries showing mood swings
        
        let rating;
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const hour = date.getHours();
        const isMorning = hour < 12;
        
        // Weekend bias: tend to be happier
        if (isWeekend) {
          rating = Math.floor(Math.random() * 3) + 3; // 3-5
        } 
        // Morning bias: some people are grumpier in the morning
        else if (isMorning && Math.random() < 0.4) {
          rating = Math.floor(Math.random() * 2) + 1; // 1-2
        } 
        // Normal distribution
        else {
          rating = Math.floor(Math.random() * 5) + 1; // 1-5
        }
        
        // Select an emotion that somewhat matches the rating
        let emotionPool;
        if (rating >= 4) {
          emotionPool = ['happy', 'excited', 'grateful', 'content', 'hopeful', 'calm'];
        } else if (rating === 3) {
          emotionPool = ['calm', 'content', 'bored', 'tired'];
        } else {
          emotionPool = ['sad', 'angry', 'anxious', 'tired', 'bored', 'confused'];
        }
        
        const emotion = emotionPool[Math.floor(Math.random() * emotionPool.length)];
        
        // Randomly assign location, social context, and weather
        const location = Math.random() < 0.8 ? locations[Math.floor(Math.random() * locations.length)] : null;
        const socialContext = Math.random() < 0.7 ? socialContexts[Math.floor(Math.random() * socialContexts.length)] : null;
        const weather = Math.random() < 0.6 ? weatherConditions[Math.floor(Math.random() * weatherConditions.length)] : null;
        
        // Generate 0-3 random tags
        const entryTags = [];
        const tagCount = Math.floor(Math.random() * 4); // 0-3 tags
        for (let k = 0; k < tagCount; k++) {
          const tag = tags[Math.floor(Math.random() * tags.length)];
          if (!entryTags.includes(tag)) {
            entryTags.push(tag);
          }
        }
        
        // Generate 0-2 random activities
        const entryActivities = {};
        const activityCount = Math.floor(Math.random() * 3); // 0-2 activities
        const activityTypeKeys = Object.keys(activityTypes);
        for (let k = 0; k < activityCount; k++) {
          const activityType = activityTypeKeys[Math.floor(Math.random() * activityTypeKeys.length)];
          if (!entryActivities[activityType]) {
            const activities = activityTypes[activityType];
            entryActivities[activityType] = activities[Math.floor(Math.random() * activities.length)];
          }
        }
        
        // Create the entry
        const entry = {
          id: generateId(),
          entry_time: entryTime,
          rating,
          emotion,
          notes: Math.random() < 0.8 ? generateNote() : "",
          location,
          socialContext,
          weather,
          tags: entryTags,
          activities: entryActivities,
          created_at: new Date(entryTime).toISOString(),
          updated_at: new Date(entryTime).toISOString()
        };
        
        allEntries.push(entry);
      }
    }
    
    // Sort entries by time (newest first) - simulates the natural order from the DB
    allEntries.sort((a, b) => b.entry_time - a.entry_time);
    
    // Add entries to database
    for (const entry of allEntries) {
      await saveMoodEntry(entry);
    }
    
    console.log(`Generated ${allEntries.length} mock mood entries`);
  } catch (error) {
    console.error('Error generating mock data:', error);
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
    // Add metadata for weather and location if available
    weatherData: moodEntry.weatherData || null,
    locationData: moodEntry.locationData || null
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
    
    // Use parameterized query to avoid SQL injection
    await db.runAsync(
      `INSERT INTO mood_entries (
        id, entry_time, rating, emotion, notes, location, social_context, weather, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entryWithTimestamps.id,
        entryWithTimestamps.entry_time,
        entryWithTimestamps.rating,
        entryWithTimestamps.emotion,
        entryWithTimestamps.notes,
        entryWithTimestamps.location,
        entryWithTimestamps.socialContext,
        entryWithTimestamps.weather,
        entryWithTimestamps.created_at,
        entryWithTimestamps.updated_at
      ]
    );
    
    // Now that the entry is definitely created, add tags if any
    if (entryWithTimestamps.tags && entryWithTimestamps.tags.length > 0) {
      for (const tag of entryWithTimestamps.tags) {
        if (tag && tag.trim() !== '') {
          try {
            console.log("Inserting tag:", tag, "for mood entry:", entryWithTimestamps.id);
            const tagId = generateId();
            await db.runAsync(
              `INSERT INTO mood_tags (id, mood_id, tag_name) VALUES (?, ?, ?)`,
              [tagId, entryWithTimestamps.id, tag.trim()]
            );
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
            await db.runAsync(
              `INSERT INTO mood_activities (id, mood_id, activity_type, activity_name) VALUES (?, ?, ?, ?)`,
              [activityId, entryWithTimestamps.id, type, name]
            );
          } catch (activityError) {
            console.error('Error inserting activity:', activityError);
            // Continue with other activities even if one fails
          }
        }
      }
    }
    
    // Save additional weather and location metadata if provided
    if (entryWithTimestamps.weatherData || entryWithTimestamps.locationData) {
      try {
        // Create metadata table if it doesn't exist
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS mood_entry_metadata (
            id TEXT PRIMARY KEY,
            mood_id TEXT NOT NULL,
            metadata_type TEXT NOT NULL,
            metadata_value TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (mood_id) REFERENCES mood_entries (id) 
              ON DELETE CASCADE
          );
        `);
        
        // Store weather data
        if (entryWithTimestamps.weatherData) {
          const weatherMetadataId = generateId();
          await db.runAsync(
            `INSERT INTO mood_entry_metadata (id, mood_id, metadata_type, metadata_value, created_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              weatherMetadataId,
              entryWithTimestamps.id,
              'weather',
              JSON.stringify(entryWithTimestamps.weatherData),
              getTimestamp()
            ]
          );
        }
        
        // Store location data
        if (entryWithTimestamps.locationData) {
          const locationMetadataId = generateId();
          await db.runAsync(
            `INSERT INTO mood_entry_metadata (id, mood_id, metadata_type, metadata_value, created_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              locationMetadataId,
              entryWithTimestamps.id,
              'location',
              JSON.stringify(entryWithTimestamps.locationData),
              getTimestamp()
            ]
          );
        }
      } catch (metadataError) {
        console.error('Error storing metadata:', metadataError);
        // Proceed even if metadata saving fails
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
 * @param {boolean} newestFirst - Sort by entry_time DESC (true) or ASC (false)
 * @returns {Promise<Array>} Array of mood entries
 */
export async function getMoodEntries(limit = 20, offset = 0, newestFirst = true) {
  if (!db) {
    await initDatabase();
  }
  
  try {
    console.log(`Fetching mood entries with limit ${limit}, offset ${offset}`);
    // Get entries with tags and activities
    const result = await db.getAllAsync(`
      SELECT 
        e.id, e.entry_time, e.rating, e.emotion, e.notes,
        e.location, e.social_context as socialContext, e.weather,
        e.created_at, e.updated_at
      FROM 
        mood_entries e
      ORDER BY 
        e.entry_time ${newestFirst ? 'DESC' : 'ASC'}
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    console.log(`Database returned ${result.length} entries`);
    
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
      
      // Get metadata for this entry (location, weather details)
      const metadataResult = await db.getAllAsync(
        `SELECT metadata_type, metadata_value FROM mood_entry_metadata
        WHERE mood_id = ?;`,
        [entry.id]
      );
      
      let weatherData = null;
      let locationData = null;
      
      // Parse metadata items
      for (const metadata of metadataResult) {
        try {
          if (metadata.metadata_type === 'weather') {
            weatherData = JSON.parse(metadata.metadata_value);
          } else if (metadata.metadata_type === 'location') {
            locationData = JSON.parse(metadata.metadata_value);
          }
        } catch (parseError) {
          console.error('Error parsing metadata:', parseError);
        }
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
        activities,
        weatherData,
        locationData
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
      [id]
    );
    
    const tags = tagResult.map(row => row.tag_name);
    
    // Get activities for this entry
    const activityResult = await db.getAllAsync(
      `SELECT activity_type, activity_name FROM mood_activities
      WHERE mood_id = ?;`,
      [id]
    );
    
    const activities = {};
    for (const item of activityResult) {
      activities[item.activity_type] = item.activity_name;
    }
    
    // Get metadata for this entry
    const metadataResult = await db.getAllAsync(
      `SELECT metadata_type, metadata_value FROM mood_entry_metadata
      WHERE mood_id = ?;`,
      [id]
    );
    
    let weatherData = null;
    let locationData = null;
    
    // Parse metadata items
    for (const metadata of metadataResult) {
      try {
        if (metadata.metadata_type === 'weather') {
          weatherData = JSON.parse(metadata.metadata_value);
        } else if (metadata.metadata_type === 'location') {
          locationData = JSON.parse(metadata.metadata_value);
        }
      } catch (parseError) {
        console.error('Error parsing metadata:', parseError);
      }
    }
    
    // Combine data and return
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
      activities,
      weatherData,
      locationData
    };
  } catch (error) {
    console.error("Error getting mood entry by id:", error);
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
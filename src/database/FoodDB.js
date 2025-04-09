import * as SQLite from 'expo-sqlite';

// Import the UnifiedDB functions
import { saveFoodEntryWithReferences, createRelationship, getMoodHistoryForFood } from './UnifiedDB';

// Database connection
let db = null;

export async function initFoodDB() {
  if (db !== null) {
    return;
  }
  
  try {
    console.log("Opening food database...");
    db = await SQLite.openDatabaseAsync('food.db');
    console.log("Food database connection established");
    
    try {
      console.log("Creating food table...");
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS food_entries (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          calories INTEGER,
          protein REAL,
          carbs REAL,
          fat REAL,
          meal_type TEXT,
          date TEXT NOT NULL,
          notes TEXT,
          image_uri TEXT,
          people TEXT,
          place TEXT,
          mood_rating INTEGER,
          mood_emotion TEXT,
          food_rating INTEGER,
          is_restaurant INTEGER,
          restaurant_name TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      
      // Check if people column exists and add it if not
      try {
        console.log("Checking for missing columns...");
        // Add all potentially missing columns - will fail silently if they already exist
        const missingColumns = [
          "ALTER TABLE food_entries ADD COLUMN people TEXT;",
          "ALTER TABLE food_entries ADD COLUMN place TEXT;",
          "ALTER TABLE food_entries ADD COLUMN mood_rating INTEGER;",
          "ALTER TABLE food_entries ADD COLUMN mood_emotion TEXT;",
          "ALTER TABLE food_entries ADD COLUMN food_rating INTEGER;",
          "ALTER TABLE food_entries ADD COLUMN is_restaurant INTEGER;",
          "ALTER TABLE food_entries ADD COLUMN restaurant_name TEXT;"
        ];
        
        for (const alterStatement of missingColumns) {
          try {
            await db.execAsync(alterStatement);
            console.log("Migration completed:", alterStatement);
          } catch (columnError) {
            // Column might already exist, which is fine
            console.log("Migration note:", columnError.message);
          }
        }
      } catch (migrationError) {
        // Log the overall migration error but continue
        console.log("Migration warning:", migrationError.message);
      }
      
      console.log('Food database initialized successfully');
    } catch (tableError) {
      console.error('Error creating food table:', tableError);
      throw tableError;
    }
  } catch (error) {
    console.error('Error initializing food database:', error);
    throw error;
  }
}

// Ensure database is initialized before any operation
const ensureDatabase = async () => {
  if (db === null) {
    await initFoodDB();
  }
};

// Reset food database
export async function resetFoodDB() {
  try {
    // First close the database if it's open
    if (db) {
      console.log("Closing food database connection");
      await db.closeAsync();
      db = null;
    }
    
    // Try to delete the database file
    try {
      const { FileSystem } = await import('expo-file-system');
      const dbPath = FileSystem.documentDirectory + 'SQLite/food.db';
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      if (fileInfo.exists) {
        console.log("Food database file exists, deleting it");
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
        console.log("Food database file deleted");
      } else {
        console.log("Food database file does not exist at:", dbPath);
      }
    } catch (deleteError) {
      console.log("Error deleting food database file:", deleteError);
      // Continue anyway
    }
    
    // Reinitialize the database
    console.log("Reinitializing food database");
    await initFoodDB();
    console.log("Food database reset completed");
  } catch (error) {
    console.error("Failed to reset food database:", error);
  }
}

export const addFoodEntry = async (foodEntry) => {
  await ensureDatabase();
  try {
    const result = await db.runAsync(
      `INSERT INTO food_entries (
        id, name, calories, protein, carbs, fat, meal_type, date, 
        notes, image_uri, people, place, mood_rating, mood_emotion,
        food_rating, is_restaurant, restaurant_name, created_at, updated_at
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        foodEntry.id || Math.random().toString(36).substr(2, 9),
        foodEntry.name,
        foodEntry.calories,
        foodEntry.protein,
        foodEntry.carbs,
        foodEntry.fat,
        foodEntry.meal_type,
        foodEntry.date?.toISOString(),
        foodEntry.notes,
        foodEntry.image_uri,
        JSON.stringify(foodEntry.people || []),
        foodEntry.place,
        foodEntry.mood_rating,
        foodEntry.mood_emotion,
        foodEntry.food_rating,
        foodEntry.is_restaurant ? 1 : 0,
        foodEntry.restaurant_name
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding food entry:', error);
    throw error;
  }
};

export const updateFoodEntry = async (foodEntry) => {
  await ensureDatabase();
  try {
    await db.runAsync(
      `UPDATE food_entries 
       SET name = ?, calories = ?, protein = ?, carbs = ?, fat = ?, meal_type = ?, 
           date = ?, notes = ?, image_uri = ?, people = ?, place = ?, 
           mood_rating = ?, mood_emotion = ?, food_rating = ?,
           is_restaurant = ?, restaurant_name = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        foodEntry.name,
        foodEntry.calories,
        foodEntry.protein,
        foodEntry.carbs,
        foodEntry.fat,
        foodEntry.meal_type,
        foodEntry.date?.toISOString(),
        foodEntry.notes,
        foodEntry.image_uri,
        JSON.stringify(foodEntry.people || []),
        foodEntry.place,
        foodEntry.mood_rating,
        foodEntry.mood_emotion,
        foodEntry.food_rating,
        foodEntry.is_restaurant ? 1 : 0,
        foodEntry.restaurant_name,
        foodEntry.id
      ]
    );
  } catch (error) {
    console.error('Error updating food entry:', error);
    throw error;
  }
};

export const deleteFoodEntry = async (foodEntryId) => {
  await ensureDatabase();
  try {
    await db.runAsync('DELETE FROM food_entries WHERE id = ?', [foodEntryId]);
  } catch (error) {
    console.error('Error deleting food entry:', error);
    throw error;
  }
};

export const getAllFoodEntries = async (limit = 100, offset = 0, descending = true) => {
  await ensureDatabase();
  try {
    const orderDir = descending ? 'DESC' : 'ASC';
    const result = await db.getAllAsync(`
      SELECT * FROM food_entries
      ORDER BY date ${orderDir}
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return result.map(entry => ({
      ...entry,
      date: entry.date ? new Date(entry.date) : null,
      calories: entry.calories || 0,
      protein: entry.protein || 0,
      carbs: entry.carbs || 0,
      fat: entry.fat || 0,
      people: entry.people ? JSON.parse(entry.people) : [],
      mood_rating: entry.mood_rating || null,
      mood_emotion: entry.mood_emotion || null,
      food_rating: entry.food_rating || 0,
      is_restaurant: entry.is_restaurant === 1,
      restaurant_name: entry.restaurant_name || null
    }));
  } catch (error) {
    console.error('Error getting all food entries:', error);
    throw error;
  }
};

export const getFoodEntriesByDate = async (startDate, endDate) => {
  await ensureDatabase();
  try {
    const result = await db.getAllAsync(`
      SELECT * FROM food_entries
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC
    `, [startDate.toISOString(), endDate.toISOString()]);

    return result.map(entry => ({
      ...entry,
      date: entry.date ? new Date(entry.date) : null,
      calories: entry.calories || 0,
      protein: entry.protein || 0,
      carbs: entry.carbs || 0,
      fat: entry.fat || 0,
      people: entry.people ? JSON.parse(entry.people) : [],
      mood_rating: entry.mood_rating || null,
      mood_emotion: entry.mood_emotion || null,
      food_rating: entry.food_rating || 0,
      is_restaurant: entry.is_restaurant === 1,
      restaurant_name: entry.restaurant_name || null
    }));
  } catch (error) {
    console.error('Error getting food entries by date:', error);
    throw error;
  }
};

// Enhanced version of addFoodEntry that maintains cross-database references
export const addFoodEntryWithReferences = async (foodEntry) => {
  return await saveFoodEntryWithReferences(foodEntry);
};

// Enhanced version of getAllFoodEntries that includes related entities
export const getAllFoodEntriesWithRelated = async (limit = 100, offset = 0, descending = true) => {
  const foodEntries = await getAllFoodEntries(limit, offset, descending);
  
  // For each food entry, fetch related moods
  const enhancedEntries = await Promise.all(foodEntries.map(async (entry) => {
    try {
      const relatedMoods = await getMoodHistoryForFood(entry.id);
      return {
        ...entry,
        relatedMoods
      };
    } catch (error) {
      console.error('Error fetching related moods for food entry:', error);
      return {
        ...entry,
        relatedMoods: []
      };
    }
  }));
  
  return enhancedEntries;
}; 
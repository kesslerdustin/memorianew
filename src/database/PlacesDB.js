import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

// Database connection
let db = null;

export async function initPlacesDB() {
  if (db !== null) {
    return;
  }
  
  try {
    console.log("Opening places database...");
    // Open database
    db = await SQLite.openDatabaseAsync('places.db');
    console.log("Places database connection established");
    
    // Create tables if they don't exist
    try {
      console.log("Creating places table...");
      // Create places table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS places (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          latitude REAL,
          longitude REAL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      
      console.log("Creating place_moods table...");
      // Create place_moods table to track which moods are associated with which places
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS place_moods (
          id TEXT PRIMARY KEY,
          place_id TEXT NOT NULL,
          mood_id TEXT NOT NULL,
          FOREIGN KEY (place_id) REFERENCES places (id) ON DELETE CASCADE,
          FOREIGN KEY (mood_id) REFERENCES moods (id) ON DELETE CASCADE
        );
      `);
      
      console.log('Places database initialized successfully');
    } catch (tableError) {
      console.error('Error creating tables:', tableError);
      throw tableError;
    }
  } catch (error) {
    console.error('Error initializing places database:', error);
    throw error;
  }
}

// Ensure database is initialized before any operation
const ensureDatabase = async () => {
  if (db === null) {
    await initPlacesDB();
  }
};

export const addPlace = async (place) => {
  await ensureDatabase();
  try {
    const result = await db.runAsync(
      `INSERT INTO places (id, name, address, latitude, longitude, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        place.id || Math.random().toString(36).substr(2, 9),
        place.name,
        place.address || null,
        place.latitude || null,
        place.longitude || null,
        place.notes || null,
        place.created_at || new Date().toISOString(),
        place.updated_at || new Date().toISOString()
      ]
    );
    
    // If there are associated mood IDs, add them to place_moods
    if (place.mood_ids && Array.isArray(place.mood_ids) && place.mood_ids.length > 0) {
      for (const moodId of place.mood_ids) {
        await addPlaceMood(place.id, moodId);
      }
    }
    
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding place:', error);
    throw error;
  }
};

export const updatePlace = async (place) => {
  await ensureDatabase();
  try {
    await db.runAsync(
      `UPDATE places 
       SET name = ?, address = ?, latitude = ?, longitude = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        place.name,
        place.address || null,
        place.latitude || null,
        place.longitude || null,
        place.notes || null,
        place.updated_at || new Date().toISOString(),
        place.id
      ]
    );
    
    // If there are associated mood IDs to update, we could implement that here
    // For now, we'll just leave existing associations as is
  } catch (error) {
    console.error('Error updating place:', error);
    throw error;
  }
};

export const deletePlace = async (placeId) => {
  await ensureDatabase();
  try {
    await db.runAsync('DELETE FROM places WHERE id = ?', [placeId]);
    // Associated place_moods will be deleted automatically due to CASCADE
  } catch (error) {
    console.error('Error deleting place:', error);
    throw error;
  }
};

export const getAllPlaces = async () => {
  await ensureDatabase();
  try {
    const result = await db.getAllAsync(`
      SELECT p.*, 
             COUNT(pm.mood_id) as mood_count
      FROM places p
      LEFT JOIN place_moods pm ON p.id = pm.place_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    return result;
  } catch (error) {
    console.error('Error getting all places:', error);
    throw error;
  }
};

export const getPlaceById = async (placeId) => {
  await ensureDatabase();
  try {
    const result = await db.getAsync(`
      SELECT p.*, 
             GROUP_CONCAT(pm.mood_id) as mood_ids
      FROM places p
      LEFT JOIN place_moods pm ON p.id = pm.place_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [placeId]);
    return result;
  } catch (error) {
    console.error('Error getting place by id:', error);
    throw error;
  }
};

export const addPlaceMood = async (placeId, moodId) => {
  await ensureDatabase();
  try {
    // Check if this association already exists to avoid duplicates
    const existing = await db.getAsync(
      'SELECT id FROM place_moods WHERE place_id = ? AND mood_id = ?',
      [placeId, moodId]
    );
    
    if (!existing) {
      await db.runAsync(
        'INSERT INTO place_moods (id, place_id, mood_id) VALUES (?, ?, ?)',
        [Math.random().toString(36).substr(2, 9), placeId, moodId]
      );
    }
  } catch (error) {
    console.error('Error adding place mood:', error);
    throw error;
  }
};

export const getPlaceMoods = async (placeId) => {
  await ensureDatabase();
  try {
    const result = await db.getAllAsync(`
      SELECT m.*
      FROM moods m
      JOIN place_moods pm ON m.id = pm.mood_id
      WHERE pm.place_id = ?
      ORDER BY m.date DESC
    `, [placeId]);
    return result;
  } catch (error) {
    console.error('Error getting place moods:', error);
    throw error;
  }
};

// Function to get places near a location
export const getNearbyPlaces = async (latitude, longitude, radiusKm = 5) => {
  await ensureDatabase();
  try {
    // Simple proximity calculation based on latitude/longitude
    // Convert radius to approx. degrees (very simplified)
    const approxDegreesPerKm = 0.01; // Very rough approximation
    const radiusDegrees = radiusKm * approxDegreesPerKm;
    
    const result = await db.getAllAsync(`
      SELECT p.*, 
             COUNT(pm.mood_id) as mood_count,
             (p.latitude - ?) * (p.latitude - ?) + 
             (p.longitude - ?) * (p.longitude - ?) as distance_squared
      FROM places p
      LEFT JOIN place_moods pm ON p.id = pm.place_id
      WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      AND p.latitude BETWEEN ? - ? AND ? + ?
      AND p.longitude BETWEEN ? - ? AND ? + ?
      GROUP BY p.id
      ORDER BY distance_squared ASC
    `, [
      latitude, latitude, 
      longitude, longitude,
      latitude, radiusDegrees, latitude, radiusDegrees,
      longitude, radiusDegrees, longitude, radiusDegrees
    ]);
    
    return result;
  } catch (error) {
    console.error('Error getting nearby places:', error);
    throw error;
  }
}; 
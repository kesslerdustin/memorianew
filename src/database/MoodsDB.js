import * as SQLite from 'expo-sqlite';

// Database connection
let db = null;

export async function initMoodsDB() {
  if (db !== null) {
    return;
  }
  
  try {
    console.log("Opening moods database...");
    db = await SQLite.openDatabaseAsync('moods.db');
    console.log("Moods database connection established");
    
    try {
      console.log("Creating moods table...");
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS moods (
          id TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          date TEXT NOT NULL,
          notes TEXT,
          people TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      
      console.log('Moods database initialized successfully');
    } catch (tableError) {
      console.error('Error creating moods table:', tableError);
      throw tableError;
    }
  } catch (error) {
    console.error('Error initializing moods database:', error);
    throw error;
  }
}

// Ensure database is initialized before any operation
const ensureDatabase = async () => {
  if (db === null) {
    await initMoodsDB();
  }
};

export const addMood = async (mood) => {
  await ensureDatabase();
  try {
    const result = await db.runAsync(
      `INSERT INTO moods (id, value, date, notes, people, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        mood.id || Math.random().toString(36).substr(2, 9),
        mood.value,
        mood.date?.toISOString(),
        mood.notes,
        JSON.stringify(mood.people || [])
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding mood:', error);
    throw error;
  }
};

export const updateMood = async (mood) => {
  await ensureDatabase();
  try {
    await db.runAsync(
      `UPDATE moods 
       SET value = ?, date = ?, notes = ?, people = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        mood.value,
        mood.date?.toISOString(),
        mood.notes,
        JSON.stringify(mood.people || []),
        mood.id
      ]
    );
  } catch (error) {
    console.error('Error updating mood:', error);
    throw error;
  }
};

export const deleteMood = async (moodId) => {
  await ensureDatabase();
  try {
    await db.runAsync('DELETE FROM moods WHERE id = ?', [moodId]);
  } catch (error) {
    console.error('Error deleting mood:', error);
    throw error;
  }
};

export const getAllMoods = async () => {
  await ensureDatabase();
  try {
    const result = await db.getAllAsync(`
      SELECT * FROM moods
      ORDER BY date DESC
    `);

    return result.map(mood => ({
      ...mood,
      date: mood.date ? new Date(mood.date) : null,
      people: mood.people ? JSON.parse(mood.people) : []
    }));
  } catch (error) {
    console.error('Error getting all moods:', error);
    throw error;
  }
}; 
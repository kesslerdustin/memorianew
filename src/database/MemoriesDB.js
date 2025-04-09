import * as SQLite from 'expo-sqlite';

// Database connection
let db = null;

export async function initMemoriesDB() {
  if (db !== null) {
    return;
  }
  
  try {
    console.log("Opening memories database...");
    db = await SQLite.openDatabaseAsync('memories.db');
    console.log("Memories database connection established");
    
    try {
      console.log("Creating memories table...");
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          date TEXT NOT NULL,
          location TEXT,
          people TEXT,
          photos TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      
      console.log('Memories database initialized successfully');
    } catch (tableError) {
      console.error('Error creating memories table:', tableError);
      throw tableError;
    }
  } catch (error) {
    console.error('Error initializing memories database:', error);
    throw error;
  }
}

// Ensure database is initialized before any operation
const ensureDatabase = async () => {
  if (db === null) {
    await initMemoriesDB();
  }
};

export const addMemory = async (memory) => {
  await ensureDatabase();
  try {
    const result = await db.runAsync(
      `INSERT INTO memories (id, title, description, date, location, people, photos, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        memory.id || Math.random().toString(36).substr(2, 9),
        memory.title,
        memory.description,
        memory.date?.toISOString(),
        memory.location,
        JSON.stringify(memory.people || []),
        JSON.stringify(memory.photos || [])
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding memory:', error);
    throw error;
  }
};

export const updateMemory = async (memory) => {
  await ensureDatabase();
  try {
    await db.runAsync(
      `UPDATE memories 
       SET title = ?, description = ?, date = ?, location = ?, people = ?, photos = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        memory.title,
        memory.description,
        memory.date?.toISOString(),
        memory.location,
        JSON.stringify(memory.people || []),
        JSON.stringify(memory.photos || []),
        memory.id
      ]
    );
  } catch (error) {
    console.error('Error updating memory:', error);
    throw error;
  }
};

export const deleteMemory = async (memoryId) => {
  await ensureDatabase();
  try {
    await db.runAsync('DELETE FROM memories WHERE id = ?', [memoryId]);
  } catch (error) {
    console.error('Error deleting memory:', error);
    throw error;
  }
};

export const getAllMemories = async () => {
  await ensureDatabase();
  try {
    const result = await db.getAllAsync(`
      SELECT * FROM memories
      ORDER BY date DESC
    `);

    return result.map(memory => ({
      ...memory,
      date: memory.date ? new Date(memory.date) : null,
      people: memory.people ? JSON.parse(memory.people) : [],
      photos: memory.photos ? JSON.parse(memory.photos) : []
    }));
  } catch (error) {
    console.error('Error getting all memories:', error);
    throw error;
  }
}; 
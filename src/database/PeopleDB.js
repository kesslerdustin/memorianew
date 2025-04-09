import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

// Database connection
let db = null;

/**
 * Initialize the database
 * @returns {Promise<void>}
 */
export async function initPeopleDB() {
  if (db !== null) {
    return;
  }
  
  try {
    console.log("Opening people database...");
    // Open database
    db = await SQLite.openDatabaseAsync('people.db');
    console.log("People database connection established");
    
    // Create tables if they don't exist
    try {
      console.log("Creating people table...");
      // Create people table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS people (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          context TEXT,
          status TEXT,
          birthDate TEXT,
          isDeceased INTEGER,
          deceasedDate TEXT,
          phoneNumber TEXT,
          email TEXT,
          socials TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      
      // Add deceasedDate column if it doesn't exist
      try {
        await db.execAsync('ALTER TABLE people ADD COLUMN deceasedDate TEXT');
        console.log("Added deceasedDate column to people table");
      } catch (error) {
        // Column might already exist, which is fine
        console.log("deceasedDate column already exists or error adding it:", error);
      }
      
      console.log("Creating tags table...");
      // Create tags table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          person_id TEXT NOT NULL,
          type TEXT NOT NULL,
          value TEXT NOT NULL,
          FOREIGN KEY (person_id) REFERENCES people (id) 
            ON DELETE CASCADE
        );
      `);
      
      console.log('People database initialized successfully');
    } catch (tableError) {
      console.error('Error creating tables:', tableError);
      throw tableError;
    }
  } catch (error) {
    console.error('Error initializing people database:', error);
    throw error;
  }
}

// Ensure database is initialized before any operation
const ensureDatabase = async () => {
  if (db === null) {
    await initPeopleDB();
  }
};

export const addPerson = async (person) => {
  await ensureDatabase();
  try {
    // Insert person
    const result = await db.runAsync(
      `INSERT INTO people (id, name, context, status, birthDate, isDeceased, deceasedDate, phoneNumber, email, socials, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        person.id || Math.random().toString(36).substr(2, 9),
        person.name,
        person.context,
        person.status,
        person.birthDate?.toISOString(),
        person.isDeceased ? 1 : 0,
        person.deceasedDate?.toISOString(),
        person.phoneNumber,
        person.email,
        person.socials
      ]
    );
    
    const personId = result.lastInsertRowId;

    // Add hobbies
    if (person.hobbies) {
      for (const hobby of person.hobbies) {
        await db.runAsync(
          'INSERT INTO tags (id, person_id, type, value) VALUES (?, ?, ?, ?)',
          [Math.random().toString(36).substr(2, 9), personId, 'hobby', hobby]
        );
      }
    }

    // Add interests
    if (person.interests) {
      for (const interest of person.interests) {
        await db.runAsync(
          'INSERT INTO tags (id, person_id, type, value) VALUES (?, ?, ?, ?)',
          [Math.random().toString(36).substr(2, 9), personId, 'interest', interest]
        );
      }
    }

    return personId;
  } catch (error) {
    console.error('Error adding person:', error);
    throw error;
  }
};

export const updatePerson = async (person) => {
  await ensureDatabase();
  try {
    // Update person
    await db.runAsync(
      `UPDATE people 
       SET name = ?, context = ?, status = ?, birthDate = ?, isDeceased = ?, 
           deceasedDate = ?, phoneNumber = ?, email = ?, socials = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        person.name,
        person.context,
        person.status,
        person.birthDate?.toISOString(),
        person.isDeceased ? 1 : 0,
        person.isDeceased ? person.deceasedDate?.toISOString() : null,
        person.phoneNumber,
        person.email,
        person.socials,
        person.id
      ]
    );

    // Delete existing tags
    await db.runAsync('DELETE FROM tags WHERE person_id = ?', [person.id]);

    // Add updated hobbies
    if (person.hobbies) {
      for (const hobby of person.hobbies) {
        await db.runAsync(
          'INSERT INTO tags (id, person_id, type, value) VALUES (?, ?, ?, ?)',
          [Math.random().toString(36).substr(2, 9), person.id, 'hobby', hobby]
        );
      }
    }

    // Add updated interests
    if (person.interests) {
      for (const interest of person.interests) {
        await db.runAsync(
          'INSERT INTO tags (id, person_id, type, value) VALUES (?, ?, ?, ?)',
          [Math.random().toString(36).substr(2, 9), person.id, 'interest', interest]
        );
      }
    }
  } catch (error) {
    console.error('Error updating person:', error);
    throw error;
  }
};

export const deletePerson = async (personId) => {
  await ensureDatabase();
  try {
    await db.runAsync('DELETE FROM people WHERE id = ?', [personId]);
  } catch (error) {
    console.error('Error deleting person:', error);
    throw error;
  }
};

export const getAllPeople = async () => {
  await ensureDatabase();
  try {
    const result = await db.getAllAsync(`
      SELECT p.*, 
             GROUP_CONCAT(CASE WHEN t.type = 'hobby' THEN t.value END) as hobbies,
             GROUP_CONCAT(CASE WHEN t.type = 'interest' THEN t.value END) as interests
      FROM people p
      LEFT JOIN tags t ON p.id = t.person_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    return result.map(person => ({
      ...person,
      birthDate: person.birthDate ? new Date(person.birthDate) : null,
      isDeceased: person.isDeceased === 1,
      hobbies: person.hobbies ? person.hobbies.split(',') : [],
      interests: person.interests ? person.interests.split(',') : []
    }));
  } catch (error) {
    console.error('Error getting all people:', error);
    throw error;
  }
}; 
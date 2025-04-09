/**
 * UnifiedDB.js - Cross-database integration layer for Memoria
 * 
 * This module provides:
 * 1. Cross-database references and relationships
 * 2. Unified query interface for entity history
 * 3. Relationship maintenance functions
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { initDatabase as initMoodsDB, saveMoodEntry, getMoodEntries, getMoodEntryById } from './MoodsDB';
import { initFoodDB, addFoodEntry, updateFoodEntry, getAllFoodEntries } from './FoodDB';
import { initPlacesDB, addPlace, updatePlace, getAllPlaces, getPlaceById, addPlaceMood } from './PlacesDB';
import { initPeopleDB, addPerson, updatePerson, getAllPeople } from './PeopleDB';
import { initMemoriesDB, addMemory, updateMemory, getAllMemories } from './MemoriesDB';

// Database connection for relationships
let relationshipsDB = null;

/**
 * Initialize the relationships database
 */
export async function initRelationshipsDB() {
  if (relationshipsDB !== null) {
    return;
  }
  
  try {
    console.log("Opening relationships database...");
    relationshipsDB = await SQLite.openDatabaseAsync('relationships.db');
    console.log("Relationships database connection established");
    
    // Create tables for cross-entity relationships
    await relationshipsDB.execAsync(`
      CREATE TABLE IF NOT EXISTS entity_relationships (
        id TEXT PRIMARY KEY,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    
    // Create indexes for faster lookups
    await relationshipsDB.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_source ON entity_relationships (source_type, source_id);
      CREATE INDEX IF NOT EXISTS idx_target ON entity_relationships (target_type, target_id);
    `);
    
    console.log('Relationships database initialized successfully');
  } catch (error) {
    console.error('Error initializing relationships database:', error);
    throw error;
  }
}

/**
 * Initialize all databases
 */
export async function initAllDatabases() {
  await Promise.all([
    initMoodsDB(),
    initFoodDB(),
    initPlacesDB(),
    initPeopleDB(),
    initMemoriesDB(),
    initRelationshipsDB()
  ]);
  console.log("All databases initialized");
}

/**
 * Generate a unique ID
 */
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36).substring(0, 4);
  const random = Math.random().toString(36).substring(2, 6);
  const id = timestamp + random;
  
  // Apply prefix if provided
  return prefix ? `${prefix}_${id}` : id;
}

// Helper function to generate a place-specific ID
export function generatePlaceId() {
  return generateId('pl');
}

/**
 * Create a relationship between two entities
 */
export async function createRelationship(sourceType, sourceId, targetType, targetId, relationshipType) {
  await initRelationshipsDB();
  
  try {
    // Check if relationship already exists
    const existing = await relationshipsDB.getAllAsync(
      `SELECT id FROM entity_relationships 
       WHERE source_type = ? AND source_id = ? 
       AND target_type = ? AND target_id = ?
       AND relationship_type = ?`,
      [sourceType, sourceId, targetType, targetId, relationshipType]
    );
    
    if (existing.length === 0) {
      // Create new relationship
      await relationshipsDB.runAsync(
        `INSERT INTO entity_relationships (
          id, source_type, source_id, target_type, target_id, relationship_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(),
          sourceType,
          sourceId,
          targetType,
          targetId,
          relationshipType,
          new Date().toISOString()
        ]
      );
      console.log(`Created relationship: ${sourceType}:${sourceId} -> ${targetType}:${targetId} (${relationshipType})`);
    } else {
      console.log(`Relationship already exists: ${sourceType}:${sourceId} -> ${targetType}:${targetId} (${relationshipType})`);
    }
  } catch (error) {
    console.error('Error creating relationship:', error);
    throw error;
  }
}

/**
 * Save food entry with cross-database references
 */
export async function saveFoodEntryWithReferences(foodEntry) {
  // First, save the food entry
  const foodId = await addFoodEntry(foodEntry);
  
  // Create relationships based on associated entities
  try {
    // If mood is associated, create relationship
    if (foodEntry.mood_rating && foodEntry.mood_emotion) {
      // For simplicity, we'll create a virtual mood ID
      // In a real implementation, you would save a proper mood entry or link to an existing one
      const virtualMoodId = `virtual_mood_${generateId()}`;
      
      // Create a basic mood entry with minimal data
      const moodEntry = {
        id: virtualMoodId,
        entry_time: foodEntry.date ? foodEntry.date.getTime() : Date.now(),
        rating: foodEntry.mood_rating,
        emotion: foodEntry.mood_emotion,
        notes: `Added while tracking food: ${foodEntry.name}`,
        tags: ['food-related']
      };
      
      // Save the mood entry
      await saveMoodEntry(moodEntry);
      
      // Create bidirectional relationships
      await createRelationship('food', foodEntry.id, 'mood', virtualMoodId, 'has_mood');
      await createRelationship('mood', virtualMoodId, 'food', foodEntry.id, 'associated_with_food');
    }
    
    // If place is associated, create relationship
    if (foodEntry.place) {
      // Try to get place by name to avoid duplicates
      const places = await getAllPlaces();
      const existingPlace = places.find(p => p.name.toLowerCase() === foodEntry.place.toLowerCase());
      
      let placeId;
      if (existingPlace) {
        placeId = existingPlace.id;
      } else {
        // Create a new place with minimal data
        const placeEntry = {
          id: generatePlaceId(),
          name: foodEntry.place,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        placeId = await addPlace(placeEntry);
      }
      
      // Create bidirectional relationships
      await createRelationship('food', foodEntry.id, 'place', placeId, 'at_place');
      await createRelationship('place', placeId, 'food', foodEntry.id, 'has_food');
    }
    
    // If people are associated, create relationships
    if (foodEntry.people && foodEntry.people.length > 0) {
      const allPeople = await getAllPeople();
      
      for (const personName of foodEntry.people) {
        let personId;
        const existingPerson = allPeople.find(p => p.name.toLowerCase() === personName.toLowerCase());
        
        if (existingPerson) {
          personId = existingPerson.id;
        } else {
          // Create a new person with minimal data
          const personEntry = {
            id: generateId(),
            name: personName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          personId = await addPerson(personEntry);
        }
        
        // Create bidirectional relationships
        await createRelationship('food', foodEntry.id, 'person', personId, 'with_person');
        await createRelationship('person', personId, 'food', foodEntry.id, 'ate_food');
      }
    }
  } catch (error) {
    console.error('Error creating relationships for food entry:', error);
    // The food entry was saved, so we don't throw here
  }
  
  return foodId;
}

/**
 * Save mood entry with cross-database references
 */
export async function saveMoodEntryWithReferences(moodEntry) {
  // First, save the mood entry
  await saveMoodEntry(moodEntry);
  
  // Create relationships based on associated entities
  try {
    // If location is associated, create relationship with place
    if (moodEntry.location) {
      // Try to get place by name to avoid duplicates
      const places = await getAllPlaces();
      const existingPlace = places.find(p => p.name.toLowerCase() === moodEntry.location.toLowerCase());
      
      let placeId;
      if (existingPlace) {
        placeId = existingPlace.id;
      } else {
        // Create a new place with minimal data
        const placeEntry = {
          id: generatePlaceId(),
          name: moodEntry.location,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        placeId = await addPlace(placeEntry);
      }
      
      // Add mood to place in places database with better error handling
      try {
        console.log(`Attempting to add place mood relationship: placeId=${placeId}, moodId=${moodEntry.id}`);
        await addPlaceMood(placeId, moodEntry.id);
        console.log('Successfully added place mood relationship');
      } catch (placeMoodError) {
        console.error('Error adding place mood:', placeMoodError);
        console.error('Place ID:', placeId);
        console.error('Mood ID:', moodEntry.id);
        // Continue with relationship creation even if this fails
      }
      
      // Create bidirectional relationships
      try {
        await createRelationship('mood', moodEntry.id, 'place', placeId, 'at_place');
        await createRelationship('place', placeId, 'mood', moodEntry.id, 'has_mood');
      } catch (relationshipError) {
        console.error('Error creating place-mood relationships:', relationshipError);
        // Continue execution even if relationship creation fails
      }
    }
    
    // If people are associated, create relationships
    if (moodEntry.people && Array.isArray(moodEntry.people) && moodEntry.people.length > 0) {
      try {
        console.log(`Creating people relationships for mood entry: ${moodEntry.id}`);
        console.log(`People IDs:`, moodEntry.people);
        
        for (const personId of moodEntry.people) {
          // Create bidirectional relationships
          await createRelationship('mood', moodEntry.id, 'person', personId, 'with_person');
          await createRelationship('person', personId, 'mood', moodEntry.id, 'experienced_with');
          console.log(`Created relationship between mood ${moodEntry.id} and person ${personId}`);
        }
      } catch (peopleError) {
        console.error('Error creating person-mood relationships:', peopleError);
        // Continue execution even if relationship creation fails
      }
    }
    
    // If socialContext mentions people, create relationships
    if (moodEntry.socialContext && moodEntry.socialContext.includes('With')) {
      const contextParts = moodEntry.socialContext.split(' ');
      if (contextParts.length > 1) {
        const relationshipType = contextParts[0].toLowerCase(); // "with"
        const personType = contextParts[1].toLowerCase(); // "friends", "family", etc.
        
        // For now, we'll just create a generic person entry
        // In a real implementation, you might parse this differently
        if (personType !== 'strangers' && personType !== 'crowd') {
          const personEntry = {
            id: generateId(),
            name: moodEntry.socialContext.substring(5), // Remove "With " prefix
            context: 'Generated from mood entry',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const personId = await addPerson(personEntry);
          
          // Create bidirectional relationships
          await createRelationship('mood', moodEntry.id, 'person', personId, 'with_person');
          await createRelationship('person', personId, 'mood', moodEntry.id, 'associated_with_mood');
        }
      }
    }
  } catch (error) {
    console.error('Error creating relationships for mood entry:', error);
    if (error.message) console.error('Error message:', error.message);
    if (error.stack) console.error('Error stack:', error.stack);
    // The mood entry was saved, so we don't throw here
  }
  
  return moodEntry.id;
}

/**
 * Get entity history - returns all related entities for a given entity
 */
export async function getEntityHistory(entityType, entityId) {
  await initRelationshipsDB();
  
  try {
    // Get all relationships where this entity is the source
    const sourceRelationships = await relationshipsDB.getAllAsync(
      `SELECT * FROM entity_relationships WHERE source_type = ? AND source_id = ?`,
      [entityType, entityId]
    );
    
    // Get all relationships where this entity is the target
    const targetRelationships = await relationshipsDB.getAllAsync(
      `SELECT * FROM entity_relationships WHERE target_type = ? AND target_id = ?`,
      [entityType, entityId]
    );
    
    // Combine all relationships
    const allRelationships = [...sourceRelationships, ...targetRelationships];
    
    // Fetch actual entity data for each relationship
    const relatedEntities = await Promise.all(allRelationships.map(async rel => {
      // Determine which side of the relationship to fetch
      const fetchType = rel.source_id === entityId && rel.source_type === entityType 
        ? { type: rel.target_type, id: rel.target_id, direction: 'outgoing' } 
        : { type: rel.source_type, id: rel.source_id, direction: 'incoming' };
      
      // Fetch the actual entity data
      let entityData = null;
      try {
        switch(fetchType.type) {
          case 'mood':
            entityData = await getMoodEntryById(fetchType.id);
            break;
          case 'food':
            const foodEntries = await getAllFoodEntries();
            entityData = foodEntries.find(f => f.id === fetchType.id);
            break;
          case 'place':
            entityData = await getPlaceById(fetchType.id);
            break;
          case 'person':
            const people = await getAllPeople();
            entityData = people.find(p => p.id === fetchType.id);
            break;
          case 'memory':
            const memories = await getAllMemories();
            entityData = memories.find(m => m.id === fetchType.id);
            break;
        }
      } catch (error) {
        console.error(`Error fetching ${fetchType.type} entity:`, error);
      }
      
      return {
        relationship: rel.relationship_type,
        direction: fetchType.direction,
        entityType: fetchType.type,
        entityId: fetchType.id,
        entityData,
        createdAt: rel.created_at
      };
    }));
    
    // Filter out any null entities (in case of fetch errors)
    const validEntities = relatedEntities.filter(entity => entity.entityData !== null);
    
    // Sort by creation date, newest first
    validEntities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return validEntities;
  } catch (error) {
    console.error('Error getting entity history:', error);
    throw error;
  }
}

/**
 * Get place details with all related entities
 */
export async function getPlaceDetails(placeId) {
  // Get the basic place data
  const place = await getPlaceById(placeId);
  
  if (!place) {
    throw new Error(`Place not found with id: ${placeId}`);
  }
  
  // Get all related entities
  const relatedEntities = await getEntityHistory('place', placeId);
  
  // Group related entities by type
  const groupedEntities = relatedEntities.reduce((acc, entity) => {
    if (!acc[entity.entityType]) {
      acc[entity.entityType] = [];
    }
    acc[entity.entityType].push(entity);
    return acc;
  }, {});
  
  // Return comprehensive place details
  return {
    ...place,
    related: groupedEntities
  };
}

/**
 * Find and merge duplicate places
 */
export async function findAndMergeDuplicatePlaces() {
  const places = await getAllPlaces();
  const processedPlaces = {};
  const duplicates = [];
  
  // Find potential duplicates by name similarity and proximity
  for (const place of places) {
    const placeName = place.name.toLowerCase().trim();
    
    if (!processedPlaces[placeName]) {
      processedPlaces[placeName] = [place];
    } else {
      processedPlaces[placeName].push(place);
      duplicates.push(placeName);
    }
  }
  
  // Process each set of duplicates
  for (const duplicateName of duplicates) {
    const dupes = processedPlaces[duplicateName];
    console.log(`Found ${dupes.length} duplicates for place: ${duplicateName}`);
    
    // Keep the first one as primary
    const primaryPlace = dupes[0];
    
    // Merge all relationships from other duplicates to the primary
    for (let i = 1; i < dupes.length; i++) {
      const duplicatePlace = dupes[i];
      
      // Get all relationships for the duplicate
      const duplicateRelationships = await relationshipsDB.getAllAsync(
        `SELECT * FROM entity_relationships 
         WHERE (source_type = 'place' AND source_id = ?) 
         OR (target_type = 'place' AND target_id = ?)`,
        [duplicatePlace.id, duplicatePlace.id]
      );
      
      // Transfer each relationship to the primary place
      for (const rel of duplicateRelationships) {
        if (rel.source_type === 'place' && rel.source_id === duplicatePlace.id) {
          // Update source ID to primary place
          await relationshipsDB.runAsync(
            `UPDATE entity_relationships 
             SET source_id = ? 
             WHERE id = ?`,
            [primaryPlace.id, rel.id]
          );
        } else if (rel.target_type === 'place' && rel.target_id === duplicatePlace.id) {
          // Update target ID to primary place
          await relationshipsDB.runAsync(
            `UPDATE entity_relationships 
             SET target_id = ? 
             WHERE id = ?`,
            [primaryPlace.id, rel.id]
          );
        }
      }
      
      // Set the duplicate as deleted or mark it somehow
      // For now, we'll just add a "merged" flag to the notes
      const updatedNotes = `[MERGED into ${primaryPlace.id}] ${duplicatePlace.notes || ''}`;
      await updatePlace({
        ...duplicatePlace,
        notes: updatedNotes
      });
      
      console.log(`Merged place ${duplicatePlace.id} into ${primaryPlace.id}`);
    }
  }
  
  return duplicates.length;
}

/**
 * Get food history for a mood
 */
export async function getFoodHistoryForMood(moodId) {
  await initRelationshipsDB();
  
  try {
    // Get all food entries related to this mood
    const relationships = await relationshipsDB.getAllAsync(
      `SELECT * FROM entity_relationships 
       WHERE (source_type = 'mood' AND source_id = ? AND target_type = 'food')
       OR (target_type = 'mood' AND target_id = ? AND source_type = 'food')`,
      [moodId, moodId]
    );
    
    // Extract food IDs
    const foodIds = relationships.map(rel => 
      rel.source_type === 'food' ? rel.source_id : rel.target_id
    );
    
    // Fetch all food entries
    const allFoodEntries = await getAllFoodEntries();
    
    // Filter to only include related foods
    return allFoodEntries.filter(food => foodIds.includes(food.id));
  } catch (error) {
    console.error('Error getting food history for mood:', error);
    return [];
  }
}

/**
 * Get mood history for a food entry
 */
export async function getMoodHistoryForFood(foodId) {
  await initRelationshipsDB();
  
  try {
    // Get all mood entries related to this food
    const relationships = await relationshipsDB.getAllAsync(
      `SELECT * FROM entity_relationships 
       WHERE (source_type = 'food' AND source_id = ? AND target_type = 'mood')
       OR (target_type = 'food' AND target_id = ? AND source_type = 'mood')`,
      [foodId, foodId]
    );
    
    // Extract mood IDs
    const moodIds = relationships.map(rel => 
      rel.source_type === 'mood' ? rel.source_id : rel.target_id
    );
    
    // Fetch mood entries
    const moodPromises = moodIds.map(id => getMoodEntryById(id));
    const moods = await Promise.all(moodPromises);
    
    // Filter out any nulls
    return moods.filter(mood => mood !== null);
  } catch (error) {
    console.error('Error getting mood history for food:', error);
    return [];
  }
} 
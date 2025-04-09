/**
 * GlossaryService.js
 * 
 * Service for retrieving and organizing data for the glossary view
 * Shows entity details with all related entities (moods, foods, places, etc.)
 */

import { getEntityHistory, getPlaceDetails } from '../database/UnifiedDB';
import { getAllPeople } from '../database/PeopleDB';
import { getAllPlaces } from '../database/PlacesDB';
import { getAllFoodEntriesWithRelated } from '../database/FoodDB';
import { getMoodEntriesWithRelated } from '../database/MoodsDB';
import { getAllMemories } from '../database/MemoriesDB';

/**
 * Get all places with their associated entities for the glossary
 */
export const getPlacesGlossary = async () => {
  try {
    const places = await getAllPlaces();
    
    // For each place, get detailed info with related entities
    const placesWithDetails = await Promise.all(
      places.map(async (place) => {
        try {
          return await getPlaceDetails(place.id);
        } catch (error) {
          console.error(`Error getting details for place ${place.id}:`, error);
          return {
            ...place,
            related: {}  // Empty related entities if there was an error
          };
        }
      })
    );
    
    return placesWithDetails;
  } catch (error) {
    console.error('Error getting places glossary:', error);
    throw error;
  }
};

/**
 * Get all people with their associated entities for the glossary
 */
export const getPeopleGlossary = async () => {
  try {
    const people = await getAllPeople();
    
    // For each person, get related entities
    const peopleWithRelated = await Promise.all(
      people.map(async (person) => {
        try {
          const relatedEntities = await getEntityHistory('person', person.id);
          
          // Group related entities by type
          const groupedEntities = relatedEntities.reduce((acc, entity) => {
            if (!acc[entity.entityType]) {
              acc[entity.entityType] = [];
            }
            acc[entity.entityType].push(entity);
            return acc;
          }, {});
          
          return {
            ...person,
            related: groupedEntities
          };
        } catch (error) {
          console.error(`Error getting related entities for person ${person.id}:`, error);
          return {
            ...person,
            related: {}  // Empty related entities if there was an error
          };
        }
      })
    );
    
    return peopleWithRelated;
  } catch (error) {
    console.error('Error getting people glossary:', error);
    throw error;
  }
};

/**
 * Get all moods with their associated entities for the glossary
 */
export const getMoodsGlossary = async () => {
  try {
    const moods = await getMoodEntriesWithRelated();
    
    // For each mood, get additional related entities beyond foods
    const moodsWithAllRelated = await Promise.all(
      moods.map(async (mood) => {
        try {
          const relatedEntities = await getEntityHistory('mood', mood.id);
          
          // Group related entities by type
          const groupedEntities = relatedEntities.reduce((acc, entity) => {
            if (!acc[entity.entityType]) {
              acc[entity.entityType] = [];
            }
            acc[entity.entityType].push(entity);
            return acc;
          }, {});
          
          return {
            ...mood,
            related: {
              ...groupedEntities,
              // Include already fetched food entries
              food: [...(groupedEntities.food || []), ...(mood.relatedFoods || []).map(food => ({
                entityType: 'food',
                entityData: food,
                relationship: 'associated_with_mood',
                direction: 'incoming'
              }))]
            }
          };
        } catch (error) {
          console.error(`Error getting related entities for mood ${mood.id}:`, error);
          return {
            ...mood,
            related: {
              food: (mood.relatedFoods || []).map(food => ({
                entityType: 'food',
                entityData: food,
                relationship: 'associated_with_mood',
                direction: 'incoming'
              }))
            }
          };
        }
      })
    );
    
    return moodsWithAllRelated;
  } catch (error) {
    console.error('Error getting moods glossary:', error);
    throw error;
  }
};

/**
 * Get all foods with their associated entities for the glossary
 */
export const getFoodsGlossary = async () => {
  try {
    const foods = await getAllFoodEntriesWithRelated();
    
    // For each food, get additional related entities beyond moods
    const foodsWithAllRelated = await Promise.all(
      foods.map(async (food) => {
        try {
          const relatedEntities = await getEntityHistory('food', food.id);
          
          // Group related entities by type
          const groupedEntities = relatedEntities.reduce((acc, entity) => {
            if (!acc[entity.entityType]) {
              acc[entity.entityType] = [];
            }
            acc[entity.entityType].push(entity);
            return acc;
          }, {});
          
          return {
            ...food,
            related: {
              ...groupedEntities,
              // Include already fetched mood entries
              mood: [...(groupedEntities.mood || []), ...(food.relatedMoods || []).map(mood => ({
                entityType: 'mood',
                entityData: mood,
                relationship: 'associated_with_food',
                direction: 'incoming'
              }))]
            }
          };
        } catch (error) {
          console.error(`Error getting related entities for food ${food.id}:`, error);
          return {
            ...food,
            related: {
              mood: (food.relatedMoods || []).map(mood => ({
                entityType: 'mood',
                entityData: mood,
                relationship: 'associated_with_food',
                direction: 'incoming'
              }))
            }
          };
        }
      })
    );
    
    return foodsWithAllRelated;
  } catch (error) {
    console.error('Error getting foods glossary:', error);
    throw error;
  }
};

/**
 * Get all memories with their associated entities for the glossary
 */
export const getMemoriesGlossary = async () => {
  try {
    const memories = await getAllMemories();
    
    // For each memory, get related entities
    const memoriesWithRelated = await Promise.all(
      memories.map(async (memory) => {
        try {
          const relatedEntities = await getEntityHistory('memory', memory.id);
          
          // Group related entities by type
          const groupedEntities = relatedEntities.reduce((acc, entity) => {
            if (!acc[entity.entityType]) {
              acc[entity.entityType] = [];
            }
            acc[entity.entityType].push(entity);
            return acc;
          }, {});
          
          return {
            ...memory,
            related: groupedEntities
          };
        } catch (error) {
          console.error(`Error getting related entities for memory ${memory.id}:`, error);
          return {
            ...memory,
            related: {}  // Empty related entities if there was an error
          };
        }
      })
    );
    
    return memoriesWithRelated;
  } catch (error) {
    console.error('Error getting memories glossary:', error);
    throw error;
  }
};

/**
 * Get all entities with their relationships for the glossary
 */
export const getFullGlossary = async () => {
  try {
    const [places, people, moods, foods, memories] = await Promise.all([
      getPlacesGlossary(),
      getPeopleGlossary(),
      getMoodsGlossary(),
      getFoodsGlossary(),
      getMemoriesGlossary()
    ]);
    
    return {
      places,
      people,
      moods,
      foods,
      memories
    };
  } catch (error) {
    console.error('Error getting full glossary:', error);
    throw error;
  }
}; 
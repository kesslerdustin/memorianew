import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getPlacesGlossary, 
  getPlaceDetails 
} from '../services/GlossaryService';
import {
  addPlace as dbAddPlace,
  cleanupDuplicatePlaces
} from '../services/DatabaseService';
import * as PlacesDB from '../database/PlacesDB';

const PlacesContext = createContext();

export const PlacesProvider = ({ children }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      // Use the enhanced function that fetches places with related entities
      const placesData = await getPlacesGlossary();
      setPlaces(placesData);
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load of places
    loadPlaces();
    
    // Clean up duplicate places when the provider mounts
    cleanupDuplicatePlaces().then(count => {
      console.log(`Merged ${count} duplicate places`);
      if (count > 0) {
        // Reload places if any duplicates were merged
        loadPlaces();
      }
    });
  }, []);

  const addPlace = async (place) => {
    try {
      // Ensure ID is generated if not provided
      const placeWithId = {
        ...place,
        id: place.id || Math.random().toString(36).substr(2, 9),
        created_at: place.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Use the enhanced function that maintains cross-database references
      await dbAddPlace(placeWithId);
      await loadPlaces();
    } catch (error) {
      console.error('Error adding place:', error);
      throw error;
    }
  };

  const updatePlace = async (place) => {
    try {
      // Ensure all fields are passed to the update function
      const updatedPlace = {
        ...place,
        updated_at: new Date().toISOString()
      };
      
      // Use the original PlacesDB update function for now
      await PlacesDB.updatePlace(updatedPlace);
      await loadPlaces();
    } catch (error) {
      console.error('Error updating place:', error);
      throw error;
    }
  };

  const deletePlace = async (placeId) => {
    try {
      // Use the original PlacesDB delete function for now
      await PlacesDB.deletePlace(placeId);
      await loadPlaces();
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  };

  const getPlaceById = async (placeId) => {
    try {
      // Use the enhanced function that fetches a place with all related entities
      return await getPlaceDetails(placeId);
    } catch (error) {
      console.error('Error getting place by id:', error);
      throw error;
    }
  };

  const addPlaceMood = async (placeId, moodId) => {
    try {
      await PlacesDB.addPlaceMood(placeId, moodId);
      await loadPlaces();
    } catch (error) {
      console.error('Error adding place mood:', error);
      throw error;
    }
  };

  const getPlaceMoods = async (placeId) => {
    try {
      return await PlacesDB.getPlaceMoods(placeId);
    } catch (error) {
      console.error('Error getting place moods:', error);
      throw error;
    }
  };

  return (
    <PlacesContext.Provider
      value={{
        places,
        loading,
        addPlace,
        updatePlace,
        deletePlace,
        getPlaceById,
        addPlaceMood,
        getPlaceMoods,
        refreshPlaces: loadPlaces
      }}
    >
      {children}
    </PlacesContext.Provider>
  );
};

export const usePlaces = () => {
  const context = useContext(PlacesContext);
  if (!context) {
    throw new Error('usePlaces must be used within a PlacesProvider');
  }
  return context;
}; 
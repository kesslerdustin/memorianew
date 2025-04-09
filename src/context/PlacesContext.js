import React, { createContext, useContext, useState, useEffect } from 'react';
import * as PlacesDB from '../database/PlacesDB';

const PlacesContext = createContext();

export const PlacesProvider = ({ children }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const placesData = await PlacesDB.getAllPlaces();
      setPlaces(placesData);
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaces();
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
      
      await PlacesDB.addPlace(placeWithId);
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
      
      await PlacesDB.updatePlace(updatedPlace);
      await loadPlaces();
    } catch (error) {
      console.error('Error updating place:', error);
      throw error;
    }
  };

  const deletePlace = async (placeId) => {
    try {
      await PlacesDB.deletePlace(placeId);
      await loadPlaces();
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  };

  const getPlaceById = async (placeId) => {
    try {
      return await PlacesDB.getPlaceById(placeId);
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
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initFoodDB, addFoodEntry as dbAddFoodEntry, updateFoodEntry as dbUpdateFoodEntry, 
  deleteFoodEntry as dbDeleteFoodEntry, getAllFoodEntries as dbGetAllFoodEntries, 
  getFoodEntriesByDate as dbGetFoodEntriesByDate } from '../database/FoodDB';

const FoodContext = createContext();

export const FoodProvider = ({ children }) => {
  const [foodEntries, setFoodEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize database when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        await initFoodDB();
        setIsInitialized(true);
        await loadFoodEntries();
      } catch (error) {
        console.error('Error initializing food context:', error);
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Load food entries from database
  const loadFoodEntries = async (refresh = false) => {
    if (refresh) {
      setIsLoading(true);
    }

    try {
      const entries = await dbGetAllFoodEntries();
      console.log(`Loaded ${entries.length} food entries from database`);
      setFoodEntries(entries);
    } catch (error) {
      console.error('Error loading food entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new food entry
  const addFoodEntry = async (entryData) => {
    try {
      const newEntry = {
        id: Math.random().toString(36).substr(2, 9),
        name: entryData.name,
        calories: entryData.calories || 0,
        protein: entryData.protein || 0,
        carbs: entryData.carbs || 0,
        fat: entryData.fat || 0,
        meal_type: entryData.meal_type,
        date: entryData.date,
        notes: entryData.notes || '',
        image_uri: entryData.image_uri || null,
        people: entryData.people || [],
        place: entryData.place || null,
        mood_rating: entryData.mood_rating || null,
        mood_emotion: entryData.mood_emotion || null,
        food_rating: entryData.food_rating || 0,
        is_restaurant: entryData.is_restaurant || false,
        restaurant_name: entryData.restaurant_name || null
      };

      await dbAddFoodEntry(newEntry);
      setFoodEntries(prevEntries => [newEntry, ...prevEntries]);
      return newEntry;
    } catch (error) {
      console.error('Error adding food entry:', error);
      throw error;
    }
  };

  // Update an existing food entry
  const updateFoodEntry = async (entryId, updatedData) => {
    try {
      const entryToUpdate = foodEntries.find(entry => entry.id === entryId);
      
      if (!entryToUpdate) {
        throw new Error(`Food entry with id ${entryId} not found`);
      }
      
      const updatedEntry = { 
        ...entryToUpdate,
        ...updatedData,
        image_uri: updatedData.image_uri !== undefined ? updatedData.image_uri : entryToUpdate.image_uri,
        people: updatedData.people !== undefined ? updatedData.people : entryToUpdate.people,
        place: updatedData.place !== undefined ? updatedData.place : entryToUpdate.place,
        mood_rating: updatedData.mood_rating !== undefined ? updatedData.mood_rating : entryToUpdate.mood_rating,
        mood_emotion: updatedData.mood_emotion !== undefined ? updatedData.mood_emotion : entryToUpdate.mood_emotion,
        food_rating: updatedData.food_rating !== undefined ? updatedData.food_rating : entryToUpdate.food_rating,
        is_restaurant: updatedData.is_restaurant !== undefined ? updatedData.is_restaurant : entryToUpdate.is_restaurant,
        restaurant_name: updatedData.restaurant_name !== undefined ? updatedData.restaurant_name : entryToUpdate.restaurant_name
      };
      
      await dbUpdateFoodEntry(updatedEntry);
      
      setFoodEntries(prevEntries => 
        prevEntries.map(item => item.id === entryId ? updatedEntry : item)
      );
      
      return updatedEntry;
    } catch (error) {
      console.error('Error updating food entry:', error);
      throw error;
    }
  };

  // Delete a food entry
  const deleteFoodEntry = async (entryId) => {
    try {
      await dbDeleteFoodEntry(entryId);
      setFoodEntries(prevEntries => 
        prevEntries.filter(item => item.id !== entryId)
      );
      return entryId;
    } catch (error) {
      console.error('Error deleting food entry:', error);
      throw error;
    }
  };

  // Get entries for a specific date range
  const getEntriesForDateRange = async (startDate, endDate) => {
    try {
      const entries = await dbGetFoodEntriesByDate(startDate, endDate);
      return entries;
    } catch (error) {
      console.error('Error getting entries by date range:', error);
      // Fall back to filtering the current state if DB query fails
      return foodEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }
  };

  // Calculate total calories for a day
  const calculateDailyCalories = async (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayEntries = await getEntriesForDateRange(dayStart, dayEnd);
    return dayEntries.reduce((total, entry) => total + (entry.calories || 0), 0);
  };

  // Calculate nutrition totals for a day
  const calculateDailyNutrition = async (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayEntries = await getEntriesForDateRange(dayStart, dayEnd);
    
    return dayEntries.reduce((totals, entry) => {
      return {
        calories: totals.calories + (entry.calories || 0),
        protein: totals.protein + (entry.protein || 0),
        carbs: totals.carbs + (entry.carbs || 0),
        fat: totals.fat + (entry.fat || 0),
      };
    }, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  };

  // Get a food entry by ID
  const getFoodEntry = (id) => {
    return foodEntries.find(entry => entry.id === id);
  };

  // Context value
  const contextValue = {
    foodEntries,
    isLoading,
    isInitialized,
    loadFoodEntries,
    addFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    getEntriesForDateRange,
    calculateDailyCalories,
    calculateDailyNutrition,
    getFoodEntry
  };

  return (
    <FoodContext.Provider value={contextValue}>
      {children}
    </FoodContext.Provider>
  );
};

// Custom hook to use the food context
export const useFood = () => useContext(FoodContext); 
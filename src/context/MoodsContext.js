import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { getMoodsWithRelated } from '../services/DatabaseService';

const MoodsContext = createContext();

export const MoodsProvider = ({ children }) => {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMoods();
  }, []);
  
  // Listen for database reset events
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('DATABASE_RESET', () => {
      console.log('MoodsContext: Received DATABASE_RESET event');
      // Clear state first
      setMoods([]);
      setLoading(true);
      
      // Add a delay before reloading to ensure database is ready
      setTimeout(() => {
        loadMoods();
      }, 1000);
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

  const loadMoods = async () => {
    try {
      // Get mood entries with higher limit to ensure we get all entries
      const loadedMoods = await getMoodsWithRelated(1000, 0, true);
      setMoods(loadedMoods);
    } catch (error) {
      console.error('Error loading moods:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    moods,
    loading,
    loadMoods
  };

  return (
    <MoodsContext.Provider value={value}>
      {children}
    </MoodsContext.Provider>
  );
};

export const useMoods = () => {
  const context = useContext(MoodsContext);
  if (!context) {
    throw new Error('useMoods must be used within a MoodsProvider');
  }
  return context;
}; 
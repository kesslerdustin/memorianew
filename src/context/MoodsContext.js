import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMoodEntries } from '../database/MoodsDB';

const MoodsContext = createContext();

export const MoodsProvider = ({ children }) => {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMoods();
  }, []);

  const loadMoods = async () => {
    try {
      // Get mood entries with higher limit to ensure we get all entries
      const loadedMoods = await getMoodEntries(1000, 0, true);
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
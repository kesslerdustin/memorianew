import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllMemories } from '../database/MemoriesDB';

const MemoriesContext = createContext();

export const MemoriesProvider = ({ children }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const loadedMemories = await getAllMemories();
      setMemories(loadedMemories);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    memories,
    loading,
    loadMemories
  };

  return (
    <MemoriesContext.Provider value={value}>
      {children}
    </MemoriesContext.Provider>
  );
};

export const useMemories = () => {
  const context = useContext(MemoriesContext);
  if (!context) {
    throw new Error('useMemories must be used within a MemoriesProvider');
  }
  return context;
}; 
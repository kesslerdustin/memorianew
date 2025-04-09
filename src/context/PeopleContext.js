import React, { createContext, useState, useContext, useEffect } from 'react';
import { initPeopleDB, addPerson, updatePerson, deletePerson, getAllPeople } from '../database/PeopleDB';

const PeopleContext = createContext();

export const PeopleProvider = ({ children }) => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initPeopleDB();
        const loadedPeople = await getAllPeople();
        setPeople(loadedPeople);
      } catch (error) {
        console.error('Error initializing people database:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeDB();
  }, []);

  const handleAddPerson = async (person) => {
    try {
      await addPerson(person);
      const updatedPeople = await getAllPeople();
      setPeople(updatedPeople);
    } catch (error) {
      console.error('Error adding person:', error);
      throw error;
    }
  };

  const handleUpdatePerson = async (person) => {
    try {
      await updatePerson(person);
      const updatedPeople = await getAllPeople();
      setPeople(updatedPeople);
    } catch (error) {
      console.error('Error updating person:', error);
      throw error;
    }
  };

  const handleDeletePerson = async (personId) => {
    try {
      await deletePerson(personId);
      const updatedPeople = await getAllPeople();
      setPeople(updatedPeople);
    } catch (error) {
      console.error('Error deleting person:', error);
      throw error;
    }
  };

  return (
    <PeopleContext.Provider value={{
      people,
      loading,
      addPerson: handleAddPerson,
      updatePerson: handleUpdatePerson,
      deletePerson: handleDeletePerson,
    }}>
      {children}
    </PeopleContext.Provider>
  );
};

export const usePeople = () => {
  const context = useContext(PeopleContext);
  if (!context) {
    throw new Error('usePeople must be used within a PeopleProvider');
  }
  return context;
}; 
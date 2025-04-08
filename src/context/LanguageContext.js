import React, { createContext, useState, useContext, useEffect } from 'react';
import { getTranslations, translate } from '../data/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
const LanguageContext = createContext();

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'memoria_language_preference';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('english');
  const [translations, setTranslations] = useState(getTranslations('english'));
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference when the app starts
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage) {
          changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, []);

  // Function to change the app's language
  const changeLanguage = async (newLanguage) => {
    try {
      // Save the language preference
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      
      // Update state
      setLanguage(newLanguage);
      setTranslations(getTranslations(newLanguage));
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Translate helper function
  const t = (key) => translate(key, language);

  return (
    <LanguageContext.Provider 
      value={{ 
        language,
        translations,
        changeLanguage,
        t,
        isLoading 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext; 
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
const VisualStyleContext = createContext();

// Storage key for persisting visual style preference
const STYLE_STORAGE_KEY = 'memoria_visual_style_preference';

// Available visual styles
export const VISUAL_STYLES = {
  SMILEYS: 'smileys',    // Default style with emoji smileys
  MINIMAL: 'minimal',    // Minimal style with color indicators
  ICONS: 'icons',        // Icons like arrows
  SLIDER: 'slider'       // Slider with decimal values
};

// Emoji sets for different visual styles
export const STYLE_SETS = {
  [VISUAL_STYLES.SMILEYS]: {
    1: '😢',  // Very sad
    2: '😔',  // Sad
    3: '😐',  // Neutral
    4: '🙂',  // Good
    5: '😊',  // Very good
  },
  [VISUAL_STYLES.MINIMAL]: {
    1: '🟥',  // Red square
    2: '🟧',  // Orange square
    3: '🟨',  // Yellow square
    4: '🟩',  // Light green square
    5: '🟩',  // Dark green square (using same color here, but could be different)
  },
  [VISUAL_STYLES.ICONS]: {
    1: '⬇️',  // Down arrow
    2: '↘️',  // Down-right arrow
    3: '➡️',  // Right arrow
    4: '↗️',  // Up-right arrow
    5: '⬆️',  // Up arrow
  },
  [VISUAL_STYLES.SLIDER]: {
    1: '1.0',
    1.1: '1.1',
    1.2: '1.2',
    1.3: '1.3',
    1.4: '1.4',
    1.5: '1.5',
    1.6: '1.6',
    1.7: '1.7',
    1.8: '1.8',
    1.9: '1.9',
    2: '2.0',
    2.1: '2.1',
    2.2: '2.2',
    2.3: '2.3',
    2.4: '2.4',
    2.5: '2.5',
    2.6: '2.6',
    2.7: '2.7',
    2.8: '2.8',
    2.9: '2.9',
    3: '3.0',
    3.1: '3.1',
    3.2: '3.2',
    3.3: '3.3',
    3.4: '3.4',
    3.5: '3.5',
    3.6: '3.6',
    3.7: '3.7',
    3.8: '3.8',
    3.9: '3.9',
    4: '4.0',
    4.1: '4.1',
    4.2: '4.2',
    4.3: '4.3',
    4.4: '4.4',
    4.5: '4.5',
    4.6: '4.6',
    4.7: '4.7',
    4.8: '4.8',
    4.9: '4.9',
    5: '5.0'
  }
};

// Get color based on rating (for consistent coloring across visual styles)
export const getRatingColor = (rating) => {
  // Convert to nearest integer if it's a decimal
  const nearestInteger = Math.min(Math.max(Math.round(rating), 1), 5);
  const colors = {
    1: '#E57373', // Red
    2: '#FFB74D', // Orange
    3: '#FFD54F', // Yellow
    4: '#81C784', // Light Green
    5: '#4CAF50', // Green
  };
  return colors[nearestInteger] || '#FFD54F';
};

export const VisualStyleProvider = ({ children }) => {
  const [visualStyle, setVisualStyle] = useState(VISUAL_STYLES.SMILEYS);
  const [styleSet, setStyleSet] = useState(STYLE_SETS[VISUAL_STYLES.SMILEYS]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved style preference when the app starts
  useEffect(() => {
    const loadStylePreference = async () => {
      try {
        const savedStyle = await AsyncStorage.getItem(STYLE_STORAGE_KEY);
        if (savedStyle && VISUAL_STYLES[savedStyle.toUpperCase()]) {
          changeVisualStyle(savedStyle);
        }
      } catch (error) {
        console.error('Error loading visual style preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStylePreference();
  }, []);

  // Function to change the app's visual style
  const changeVisualStyle = async (newStyle) => {
    if (!VISUAL_STYLES[newStyle.toUpperCase()]) {
      console.warn(`Invalid visual style: ${newStyle}`);
      return;
    }

    try {
      // Save the style preference
      await AsyncStorage.setItem(STYLE_STORAGE_KEY, newStyle);
      
      // Update state
      setVisualStyle(newStyle);
      setStyleSet(STYLE_SETS[newStyle]);
    } catch (error) {
      console.error('Error saving visual style preference:', error);
    }
  };

  // Get the mood emoji/icon for the current style
  const getMoodIcon = (rating) => {
    if (visualStyle === VISUAL_STYLES.SLIDER) {
      // For slider style, round to 1 decimal place
      const roundedRating = Math.min(Math.max(Math.round(rating * 10) / 10, 1), 5);
      return styleSet[roundedRating] || roundedRating.toFixed(1);
    }
    
    // For other styles, use the nearest integer
    const intRating = Math.min(Math.max(Math.round(rating), 1), 5);
    return styleSet[intRating] || '❓';
  };

  // Check if the current style supports decimal values
  const supportsDecimal = () => {
    return visualStyle === VISUAL_STYLES.SLIDER;
  };

  return (
    <VisualStyleContext.Provider 
      value={{ 
        visualStyle,
        styleSet,
        changeVisualStyle,
        getMoodIcon,
        supportsDecimal,
        getRatingColor,
        isLoading 
      }}
    >
      {children}
    </VisualStyleContext.Provider>
  );
};

// Custom hook to use the visual style context
export const useVisualStyle = () => {
  const context = useContext(VisualStyleContext);
  if (!context) {
    throw new Error('useVisualStyle must be used within a VisualStyleProvider');
  }
  return context;
};

export default VisualStyleContext; 
/**
 * Data models for the Memoria app
 */

/**
 * Mood entry model
 * 
 * @typedef {Object} MoodEntry
 * @property {string} id - Unique identifier
 * @property {Date} timestamp - When the mood was recorded
 * @property {number} rating - Mood rating (1-5, where 1 is very negative and 5 is very positive)
 * @property {string} emotion - Primary emotion (e.g., "happy", "sad", "anxious")
 * @property {string} notes - Additional notes about the mood
 * @property {string[]} [tags] - Optional tags associated with the mood
 * @property {Object} [activities] - Optional activities associated with the mood
 */

/**
 * Creates a new mood entry
 * 
 * @param {number} rating - Mood rating (1-5)
 * @param {string} emotion - Primary emotion
 * @param {string} [notes=""] - Additional notes
 * @param {string[]} [tags=[]] - Tags associated with the mood
 * @param {Object} [activities={}] - Activities associated with the mood
 * @returns {MoodEntry} New mood entry object
 */
export function createMoodEntry(rating, emotion, notes = "", tags = [], activities = {}) {
  const currentTime = Date.now();
  return {
    id: generateId(),
    entry_time: currentTime,
    timestamp: new Date(currentTime),
    rating,
    emotion,
    notes,
    tags,
    activities
  };
}

/**
 * Generates a unique ID for entries
 * 
 * @returns {string} Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * List of common emotions for the mood tracker
 */
export const EMOTIONS = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "excited", label: "Excited", emoji: "🤩" },
  { value: "content", label: "Content", emoji: "😌" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "sad", label: "Sad", emoji: "😔" },
  { value: "anxious", label: "Anxious", emoji: "😰" },
  { value: "stressed", label: "Stressed", emoji: "😫" },
  { value: "angry", label: "Angry", emoji: "😠" },
  { value: "tired", label: "Tired", emoji: "😴" },
];

/**
 * Common activity categories for mood tracking
 */
export const ACTIVITY_CATEGORIES = {
  SOCIAL: "Social",
  WORK: "Work",
  EXERCISE: "Exercise",
  ENTERTAINMENT: "Entertainment",
  SELF_CARE: "Self Care",
  FOOD: "Food & Drink",
  SLEEP: "Sleep",
}; 
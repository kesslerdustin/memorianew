/**
 * Weather utilities for Memoria
 * 
 * Provides utilities for fetching weather data from OpenWeatherMap
 */

// Replace with your actual OpenWeatherMap API key
// You should consider storing this in a .env file for production
const API_KEY = '19e7ddd23bbc39213f93dd8a8294f653';

/**
 * Fetch current weather data from OpenWeatherMap API
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @returns {Promise<Object>} - Weather data object with condition, temperature, and icon
 * @throws {Error} If there's a problem fetching the weather data
 */
export const fetchWeatherData = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      console.log(`Weather API error: ${response.status} - ${response.statusText}`);
      
      // If we get a 401 (unauthorized) error, likely an API key issue
      if (response.status === 401) {
        console.log('API key authentication error, using mock data');
        return getMockWeatherData();
      }
      
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      condition: data.weather[0].main,
      description: data.weather[0].description,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      icon: data.weather[0].icon,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      sunrise: data.sys.sunrise * 1000, // Convert to milliseconds
      sunset: data.sys.sunset * 1000, // Convert to milliseconds
      locationName: data.name,
      country: data.sys.country,
      isMockData: false
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Return mock data instead of throwing to prevent app crashes
    return { ...getMockWeatherData(), isMockData: true };
  }
};

/**
 * Fetch 5-day forecast from OpenWeatherMap API
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @returns {Promise<Array>} - Array of forecast data
 * @throws {Error} If there's a problem fetching the forecast data
 */
export async function fetchForecastData(latitude, longitude) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process the forecast data
    return data.list.map(item => ({
      time: item.dt * 1000, // Convert to milliseconds
      temperature: Math.round(item.main.temp),
      condition: item.weather[0].main,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      iconUrl: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
      humidity: item.main.humidity,
      windSpeed: item.wind.speed
    }));
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw error;
  }
}

/**
 * Get descriptive weather condition based on OpenWeatherMap code
 * @param {string} condition - Weather condition from API
 * @returns {string} - Human-readable weather description
 */
export function getWeatherDescription(condition) {
  const descriptions = {
    'Clear': 'Clear sky',
    'Clouds': 'Cloudy',
    'Rain': 'Rainy',
    'Drizzle': 'Drizzle',
    'Thunderstorm': 'Thunderstorm',
    'Snow': 'Snowy',
    'Mist': 'Misty',
    'Smoke': 'Smoky',
    'Haze': 'Hazy',
    'Dust': 'Dusty',
    'Fog': 'Foggy',
    'Sand': 'Sandy',
    'Ash': 'Volcanic ash',
    'Squall': 'Squall',
    'Tornado': 'Tornado'
  };
  
  return descriptions[condition] || condition;
}

/**
 * Determine if it's day or night at a location
 * @param {number} currentTime - Current time in milliseconds
 * @param {number} sunrise - Sunrise time in milliseconds
 * @param {number} sunset - Sunset time in milliseconds
 * @returns {boolean} - True if it's daytime, false if it's nighttime
 */
export function isDaytime(currentTime, sunrise, sunset) {
  return currentTime > sunrise && currentTime < sunset;
}

/**
 * Mock weather data for development without API key
 * @returns {Object} - Mock weather data
 */
export function getMockWeatherData() {
  return {
    condition: 'Clear',
    description: 'clear sky',
    temperature: 22,
    feelsLike: 23,
    humidity: 65,
    windSpeed: 3.5,
    icon: '01d',
    iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
    sunrise: Date.now() - 3600000, // 1 hour ago
    sunset: Date.now() + 3600000, // 1 hour from now
    locationName: 'Sample City',
    country: 'SC',
    isMockData: true
  };
} 
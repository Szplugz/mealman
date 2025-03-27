import axios from 'axios';

// API base URL - change this to your Railway deployment URL when it's deployed
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-railway-app-name.railway.app' 
  : 'http://localhost:3000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Detect if a URL contains a recipe
 * @param {Object} params - Request parameters
 * @param {string} params.url - URL to check for recipe
 */
export const detectRecipe = async ({ url }) => {
  try {
    const response = await api.post('/api/detect', { url });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 
      'Failed to detect recipe. Please try again.'
    );
  }
};

/**
 * Extract recipe details from a URL
 * @param {Object} params - Request parameters
 * @param {string} params.url - URL to extract recipe from
 */
export const extractRecipe = async ({ url }) => {
  try {
    const response = await api.post('/api/extract', { url });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 
      'Failed to extract recipe. Please try again.'
    );
  }
};

/**
 * Convert structured recipe data to markdown format
 * @param {Object} params - Request parameters
 * @param {Object} params.recipe - Structured recipe data
 */
export const convertToMarkdown = async ({ recipe }) => {
  try {
    const response = await api.post('/api/convert', { recipe });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 
      'Failed to convert recipe to markdown. Please try again.'
    );
  }
};

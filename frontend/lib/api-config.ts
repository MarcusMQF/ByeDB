/**
 * Centralized API configuration for the frontend
 * Manages backend URL and provides utility functions for API calls
 */

// Get the backend URL from environment variable or fallback to localhost
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Build a complete API endpoint URL
 * @param endpoint - The API endpoint path (e.g., '/api/sql-question')
 * @returns Complete URL string
 */
export const buildApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

/**
 * Build a complete API URL for image resources
 * @param imagePath - The image path (e.g., 'api/charts/chart.png')
 * @returns Complete URL string
 */
export const buildImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath; // Already a complete URL
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Check if the API is configured for production
 * @returns true if using production URL, false if using localhost
 */
export const isProduction = (): boolean => {
  return !API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1');
};

/**
 * Get environment-specific configuration
 */
export const getApiConfig = () => {
  return {
    baseUrl: API_BASE_URL,
    isProduction: isProduction(),
    endpoints: {
      sqlQuestion: buildApiUrl('/api/sql-question'),
      continueExecution: buildApiUrl('/api/continue-execution'),
      clearMemory: buildApiUrl('/api/clear-memory'),
      exportDb: buildApiUrl('/api/export-db'),
      uploadDb: buildApiUrl('/api/upload-db'),
      clearDatabase: buildApiUrl('/api/clear-database'),
    }
  };
}; 
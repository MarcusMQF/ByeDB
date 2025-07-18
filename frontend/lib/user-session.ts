/**
 * User session management utilities
 * Handles generating and persisting user IDs across browser sessions
 */

const USER_ID_KEY = 'byedb-user-id';

/**
 * Generate a unique user ID using timestamp + random component
 */
function generateUserId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${random}`;
}

/**
 * Get or create a persistent user ID
 * Stores in localStorage so it persists across browser sessions
 */
export function getUserId(): string {
  // Try to get existing user ID from localStorage
  if (typeof window !== 'undefined') {
    const existingUserId = localStorage.getItem(USER_ID_KEY);
    if (existingUserId) {
      return existingUserId;
    }
  }

  // Generate new user ID
  const newUserId = generateUserId();
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_ID_KEY, newUserId);
  }

  return newUserId;
}

/**
 * Clear the current user session (useful for logout/reset)
 */
export function clearUserSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_ID_KEY);
  }
}

/**
 * Get headers object with user ID for API calls
 */
export function getApiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'user-id': getUserId(),
  };
}

/**
 * Get headers for FormData requests (without Content-Type)
 */
export function getApiHeadersForFormData(): Record<string, string> {
  return {
    'user-id': getUserId(),
  };
}

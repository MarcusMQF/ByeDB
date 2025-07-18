// Local Storage Keys
export const CHAT_MESSAGES_KEY = 'byedb_chat_messages';
export const CHAT_MODE_KEY = 'byedb_chat_mode';
export const CHAT_INPUT_KEY = 'byedb_chat_input';

export type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  requiresConfirmation?: boolean;
  confirmationData?: any;
};

export type ChatMode = 'agent' | 'ask';

// Helper functions for localStorage with error handling
export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    const parsed = JSON.parse(item);
    
    // Convert timestamp strings back to Date objects for messages
    if (key === CHAT_MESSAGES_KEY && Array.isArray(parsed)) {
      return parsed.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) as T;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const saveToLocalStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const clearChatStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CHAT_MESSAGES_KEY);
    localStorage.removeItem(CHAT_INPUT_KEY);
  } catch (error) {
    console.error('Error clearing chat localStorage:', error);
  }
};

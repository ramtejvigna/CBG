/**
 * This utility helps with store migration issues by allowing a one-time reset 
 * of the persisted store data when needed during major structural changes.
 */

// Flag to check if a store was already reset in this session to avoid multiple resets
const resetFlags: Record<string, boolean> = {};

/**
 * Clear the localStorage data for a specific store if needed
 * This should be called before initializing the store
 */
export function ensureStorageMigration(storeName: string, forceReset = false): void {
  // Skip if we've already performed this check/reset in this session
  if (resetFlags[storeName]) return;
  
  try {
    // Get the current storage data
    const storageKey = `${storeName}`;
    
    if (forceReset) {
      // Force reset storage for this store
      localStorage.removeItem(storageKey);
      console.log(`Storage for ${storeName} has been reset.`);
    } else {
      // Check if the store data exists in localStorage
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        try {
          // Try parsing the data to see if it's valid JSON
          const parsedData = JSON.parse(storedData);
          
          // Check for specific migration issues
          // If the data structure doesn't match expected, reset it
          if (!parsedData || typeof parsedData !== 'object' || !parsedData.state || !parsedData.version) {
            localStorage.removeItem(storageKey);
            console.log(`Storage for ${storeName} was invalid and has been reset.`);
          }
        } catch {
          // If we can't parse the data, it's corrupt, so reset it
          localStorage.removeItem(storageKey);
          console.log(`Storage for ${storeName} was corrupt and has been reset.`);
        }
      }
    }
    
    // Mark this store as checked for this session
    resetFlags[storeName] = true;
  } catch (error) {
    console.error(`Error handling storage migration for ${storeName}:`, error);
  }
}

/**
 * Handle migration for all known stores in the application
 */
export function migrateAllStores(forceReset = false): void {
  ensureStorageMigration('auth-storage', forceReset);
  ensureStorageMigration('profile-storage', forceReset);
  // Add other stores as needed
}
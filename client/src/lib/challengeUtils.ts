// Challenge utility functions

/**
 * Generates a URL slug for a challenge based on title only
 * @param title - Challenge title
 * @returns URL slug in format "title-slug"
 */
export const generateSlug = (title: string): string => {
  const slugTitle = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
  
  return `${slugTitle}`;
};

/**
 * Generates a complete challenge URL using slug only
 * @param title - Challenge title
 * @returns Complete URL path
 */
export const generateChallengeUrl = (title: string): string => {
  return `/challenges/${generateSlug(title)}`;
};

/**
 * Normalizes a slug for consistent storage and retrieval
 * @param slug - URL slug
 * @returns Normalized slug
 */
export const normalizeSlug = (slug: string): string => {
  return slug
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Challenge data interface for type safety
 */
export interface ChallengeData {
  id: string | number;
  title: string;
  slug?: string;
  description?: string;
  difficulty?: string;
  points?: number;
  category?: string;
  likes?: number;
  dislikes?: number;
  submissions?: number;
  [key: string]: unknown;
}

/**
 * Stores challenge data in sessionStorage using slug as key
 * @param challengeData - Challenge data to store
 */
export const storeChallengeData = (challengeData: ChallengeData): void => {
  try {
    const slug = challengeData.slug || generateSlug(challengeData.title);
    const normalizedSlug = normalizeSlug(slug);
    sessionStorage.setItem(`challenge-slug-${normalizedSlug}`, JSON.stringify(challengeData));
  } catch (error) {
    console.warn('Failed to store challenge data:', error);
  }
};

/**
 * Clears stored challenge data
 * @param slug - Challenge slug to clear, or 'all' to clear all
 */
export const clearChallengeData = (slug: string | 'all' = 'all'): void => {
  try {
    if (slug === 'all') {
      // Clear all challenge data
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('challenge-slug-')) {
          sessionStorage.removeItem(key);
        }
      });
    } else {
      const normalizedSlug = normalizeSlug(slug);
      sessionStorage.removeItem(`challenge-slug-${normalizedSlug}`);
    }
  } catch (error) {
    console.warn('Failed to clear challenge data:', error);
  }
};
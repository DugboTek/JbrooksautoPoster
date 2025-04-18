/**
 * Represents a topic that users can select for generating LinkedIn posts
 */
export interface Topic {
  /**
   * Unique identifier for the topic, lowercase with hyphens, no spaces
   */
  id: string;
  
  /**
   * Display name for the topic, properly capitalized
   */
  label: string;
} 
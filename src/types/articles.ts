/**
 * Represents an article retrieved from Perplexity for generating LinkedIn posts
 */
export interface Article {
  /**
   * Unique identifier for the article
   */
  id: string;
  
  /**
   * Article title
   */
  title: string;
  
  /**
   * Article author, if available
   */
  author: string;
  
  /**
   * Publication or website where the article was published
   */
  publication: string;
  
  /**
   * Detailed summary of the article
   */
  summary: string;
  
  /**
   * URL to the source article
   */
  sourceUrl: string;
  
  /**
   * URL to an image related to the article
   */
  imageUrl: string;
} 
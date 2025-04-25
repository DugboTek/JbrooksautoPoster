import { Topic } from '@/types/topics';
import { Article } from '@/types/articles';
import {
  SYSTEM_MESSAGES,
  TOPIC_GENERATION_PROMPT,
  ARTICLE_SEARCH_PROMPT,
  POST_GENERATION_PROMPT
} from '@/config/prompts';

/**
 * Makes a request to the Perplexity API through our proxy
 * Supports both simple prompt strings and message arrays
 */
async function callPerplexityAPI(input: string | any[]): Promise<any> {
  // Construct the absolute URL for the API proxy route
  const isDevelopment = process.env.NODE_ENV === 'development';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                 (isDevelopment ? 'http://localhost:3000' : '');

  if (!baseUrl && typeof window === 'undefined') {
    console.error('Error: Base URL for API proxy is not configured. Set NEXT_PUBLIC_SITE_URL.');
    throw new Error('Application base URL is not configured.');
  }
  
  // Use absolute URL for server-side calls, relative URL for client-side
  const apiUrl = typeof window === 'undefined' ? `${baseUrl}/api/perplexity` : '/api/perplexity';
  
  let requestBody;
  
  // Check if input is a string prompt or messages array
  if (typeof input === 'string') {
    requestBody = { prompt: input };
  } else if (Array.isArray(input)) {
    requestBody = {
      model: 'sonar-pro',
      messages: input
    };
  } else {
    throw new Error('Invalid input to callPerplexityAPI: must be string or array');
  }
  
  console.log('Calling Perplexity API with:', typeof input === 'string' ? 'prompt string' : 'messages array');
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(`API request failed: ${response.status} - ${JSON.stringify(error)}`);
    } catch (parseError) {
      // If we can't parse the error as JSON, try to get it as text
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText.substring(0, 500)}`);
    }
  }

  const data = await response.json();
  
  // If response includes data.response, it's from the simple prompt format
  // Otherwise return the full data object from the messages format
  return data.response ? data.response : data;
}

/**
 * Updates prompts from Notion via API route
 */
async function refreshPrompts(): Promise<void> {
  try {
    // Construct the absolute URL for the API route
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (isDevelopment ? 'http://localhost:3000' : '');
    
    // Use absolute URL for server-side calls, relative URL for client-side
    const apiUrl = typeof window === 'undefined' ? `${baseUrl}/api/prompts/update` : '/api/prompts/update';
    
    const response = await fetch(apiUrl, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update prompts: ${error.message || 'Unknown error'}`);
    }
    
    // Clear require cache to force reload of prompts
    if (typeof window === 'undefined') {
      delete require.cache[require.resolve('@/config/prompts')];
    }
    
    // Re-import the prompts module
    const updatedPrompts = await import('@/config/prompts');
    Object.assign(SYSTEM_MESSAGES, updatedPrompts.SYSTEM_MESSAGES);
    Object.assign(TOPIC_GENERATION_PROMPT, updatedPrompts.TOPIC_GENERATION_PROMPT);
    Object.assign(ARTICLE_SEARCH_PROMPT, updatedPrompts.ARTICLE_SEARCH_PROMPT);
    Object.assign(POST_GENERATION_PROMPT, updatedPrompts.POST_GENERATION_PROMPT);
  } catch (error) {
    console.error('Error refreshing prompts:', error);
    // Continue with existing prompts if update fails
  }
}

/**
 * Fetches trending topics for a specific industry from Perplexity AI
 * 
 * @param industry - The industry to get trending topics for
 * @returns A Promise resolving to an array of Topic objects
 */
export async function fetchIndustryTopics(industry: string): Promise<Topic[]> {
  console.log(`Starting topic fetch for industry: "${industry}"`);
  const startTime = performance.now();
  
  // Refresh prompts before making the API call
  await refreshPrompts();
  const query = TOPIC_GENERATION_PROMPT(industry);

  try {
    console.log('Making API call with query:', query);
    
    // Create the messages array for the Perplexity API
    const messages = [
      {
        role: 'system',
        content: SYSTEM_MESSAGES.JSON_ASSISTANT
      },
      {
        role: 'user',
        content: query
      }
    ];
    
    // Call the Perplexity API
    const data = await callPerplexityAPI(messages);
    
    // Extract the content from the API response based on response format
    let content;
    if (typeof data === 'string') {
      content = data;
    } else if (data.choices && data.choices[0]?.message?.content) {
      content = data.choices[0].message.content;
    } else {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid response format from API');
    }
    
    if (!content) {
      console.error('No content in API response:', data);
      throw new Error('No content returned from API');
    }
    
    console.log('Raw content:', content);
    
    // Clean the content by removing markdown code block syntax
    const cleanedContent = content
      .replace(/^```json\s*/g, '')  // Remove opening ```json
      .replace(/\s*```$/g, '')      // Remove closing ```
      .trim();
      
    console.log('Cleaned content for parsing:', cleanedContent);
    
    // Parse the JSON content
    const topics = JSON.parse(cleanedContent);
    
    // Validate the topics array
    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error('Invalid topics format returned from API');
    }
    
    // Validate each topic object
    topics.forEach((topic: any) => {
      if (!topic.id || !topic.label) {
        throw new Error('Invalid topic object format returned from API');
      }
    });
    
    const endTime = performance.now();
    console.log(`Topic fetch completed in ${Math.round(endTime - startTime)}ms`);
    
    return topics;
  } catch (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }
}

/**
 * Fetches articles related to a specific topic from Perplexity AI
 * 
 * @param topic - The topic to get articles for
 * @returns A Promise resolving to an array of Article objects
 */
export async function fetchArticlesByTopic(topic: string): Promise<Article[]> {
  console.log(`Starting article fetch for topic: "${topic}"`);
  const startTime = performance.now();
  
  // Refresh prompts before making the API call
  await refreshPrompts();
  const query = ARTICLE_SEARCH_PROMPT(topic);

  try {
    console.log('Making API call with query:', query);
    
    // Create the messages array for the Perplexity API
    const messages = [
      {
        role: 'system',
        content: SYSTEM_MESSAGES.ARTICLE_RESEARCHER
      },
      {
        role: 'user',
        content: query
      }
    ];
    
    // Call the Perplexity API
    const data = await callPerplexityAPI(messages);
    
    // Extract the content from the API response based on response format
    let content;
    if (typeof data === 'string') {
      content = data;
    } else if (data.choices && data.choices[0]?.message?.content) {
      content = data.choices[0].message.content;
    } else {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid response format from API');
    }
    
    if (!content) {
      console.error('No content in API response:', data);
      throw new Error('No content returned from API');
    }
    
    console.log('Raw article content:', content);
    
    // Clean the content by removing markdown code block syntax
    const cleanedContent = content
      .replace(/^```json\s*/g, '')  // Remove opening ```json
      .replace(/\s*```$/g, '')      // Remove closing ```
      .trim();
      
    console.log('Cleaned article content for parsing:', cleanedContent);
    
    // Parse the JSON content
    const articles = JSON.parse(cleanedContent);
    
    // Validate the articles array
    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('Invalid articles format returned from API');
    }
    
    // Validate each article object
    articles.forEach((article: any) => {
      if (!article.id || !article.title || !article.summary || !article.sourceUrl) {
        throw new Error('Invalid article object format returned from API');
      }
    });
    
    const endTime = performance.now();
    console.log(`Article fetch completed in ${Math.round(endTime - startTime)}ms`);
    
    return articles;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
}

/**
 * Generates LinkedIn posts based on an article using Claude 3.7 Sonnet
 * 
 * @param article - The article to generate posts about
 * @param industry - The industry context
 * @param topic - The topic context
 * @returns A Promise resolving to an array of generated posts
 */
export async function generatePostsWithClaude(
  article: Article, 
  industry: string, 
  topic: string
): Promise<string[]> {
  console.log(`Generating posts for article: "${article.title}"`);
  console.log(`Industry context: ${industry}, Topic: ${topic}`);
  
  const startTime = performance.now();
  
  try {
    // Refresh prompts before making the API call
    await refreshPrompts();
    const prompt = POST_GENERATION_PROMPT(article, industry, topic);

    console.log('Making API call with prompt');
    
    // Create the messages array for the Perplexity API
    const messages = [
      {
        role: 'system',
        content: SYSTEM_MESSAGES.LINKEDIN_WRITER
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    // Call the Perplexity API
    const data = await callPerplexityAPI(messages);
    console.log('Received API response data type:', typeof data);

    // Extract the content from the API response
    // Different handling based on whether we get a direct response string or a structured message
    let content;
    if (typeof data === 'string') {
      content = data;
    } else if (data.choices && data.choices[0]?.message?.content) {
      content = data.choices[0].message.content;
    } else {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid response format from API');
    }
    
    if (!content) {
      console.error('No content in API response:', data);
      throw new Error('No content returned from API');
    }
    
    console.log('Raw content:', content);
    
    // Try to parse the content as JSON first
    try {
      // Clean the content by removing any markdown code block syntax if present
      const cleanedContent = content
        .replace(/```json\s*/g, '')  // Remove opening ```json
        .replace(/```\s*$/g, '')     // Remove closing ```
        .trim();
        
      console.log('Cleaned content for parsing:', cleanedContent);
      
      // Parse as JSON
      const parsedContent = JSON.parse(cleanedContent);
      console.log('Successfully parsed JSON content:', parsedContent);
      
      // Extract posts from the JSON structure
      const posts = [
        parsedContent.post1 || '',
        parsedContent.post2 || '',
        parsedContent.post3 || '',
        parsedContent.post4 || ''
      ].filter((post: string) => post.trim().length > 50);
      
      console.log(`Successfully extracted ${posts.length} posts`);
      
      if (posts.length === 0) {
        throw new Error('No valid posts were found in the JSON response');
      }
      
      const endTime = performance.now();
      console.log(`Post generation completed in ${Math.round(endTime - startTime)}ms`);
      
      return posts;
    } catch (jsonError) {
      console.error('Failed to parse content as JSON, trying fallback method:', jsonError);
      
      // Fallback to the previous splitting method
      const cleanContent = content
        .replace(/^(Here are|I've created|Below are|Here's|I've written)(.|\n)*(posts|variations)(.|\n)*:/i, '')
        .replace(/Variation \d+:?\s*/g, '')
        .replace(/Post \d+:?\s*/g, '');
      
      const posts = cleanContent
        .split(/\n{2,}|\n\s*\d+\.?\s*/g)
        .filter((post: string) => post.trim().length > 50)
        .map((post: string) => post.trim())
        .slice(0, 4);
      
      console.log(`Used fallback method to extract ${posts.length} posts`);
      
      if (posts.length === 0) {
        throw new Error('No valid posts were extracted from the response');
      }
      
      const endTime = performance.now();
      console.log(`Post generation completed in ${Math.round(endTime - startTime)}ms with fallback method`);
      
      return posts;
    }
  } catch (error) {
    console.error('Error generating posts:', error);
    throw error;
  }
} 
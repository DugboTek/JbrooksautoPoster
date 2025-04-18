import { getPromptByType, getPromptByName } from './notionService';

// Cache for prompts to reduce API calls
let promptsCache: { [key: string]: string } = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Gets a prompt from cache or Notion
 */
async function getPrompt(type: string): Promise<string> {
  const now = Date.now();
  
  // Check cache first
  if (promptsCache[type] && (now - lastCacheUpdate) < CACHE_DURATION) {
    return promptsCache[type];
  }
  
  // Fetch from Notion
  const prompt = await getPromptByType(type);
  if (!prompt) {
    throw new Error(`Prompt of type ${type} not found in Notion database`);
  }
  
  // Update cache
  promptsCache[type] = prompt.content;
  lastCacheUpdate = now;
  
  return prompt.content;
}

/**
 * Gets a system message prompt
 */
export async function getSystemMessage(type: 'JSON_ASSISTANT' | 'ARTICLE_RESEARCHER' | 'LINKEDIN_WRITER'): Promise<string> {
  return getPrompt(`System Message - ${type}`);
}

/**
 * Gets the topic generation prompt
 */
export async function getTopicGenerationPrompt(industry: string): Promise<string> {
  const template = await getPrompt('Topic Generation');
  return template.replace('${industry}', industry);
}

/**
 * Gets the article search prompt
 */
export async function getArticleSearchPrompt(topic: string): Promise<string> {
  const template = await getPrompt('Article Search');
  return template.replace('${topic}', topic);
}

/**
 * Gets the post generation prompt
 */
export async function getPostGenerationPrompt(article: any, industry: string, topic: string): Promise<string> {
  const template = await getPrompt('Post Generation');
  return template
    .replace('${industry}', industry)
    .replace('${topic}', topic)
    .replace('${article.title}', article.title)
    .replace('${article.author}', article.author)
    .replace('${article.publication}', article.publication)
    .replace('${article.summary}', article.summary)
    .replace('${article.sourceUrl}', article.sourceUrl);
}

/**
 * Clears the prompts cache
 */
export function clearPromptsCache(): void {
  promptsCache = {};
  lastCacheUpdate = 0;
} 
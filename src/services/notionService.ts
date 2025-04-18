import { Client } from '@notionhq/client';

// Initialize Notion client with error handling
const notion = new Client({
  auth: process.env.NOTION_API_KEY || '',
});

console.log('Notion client initialized');

// Notion database ID
const PROMPTS_DATABASE_ID = process.env.NOTION_PROMPTS_DATABASE_ID;

export interface NotionPrompt {
  id: string;
  name: string;
  type: string;
  content: string;
  variables: string[];
  lastUpdated: string;
}

/**
 * Fetches all prompts from the Notion database
 */
export async function fetchPrompts(): Promise<NotionPrompt[]> {
  console.log('Fetching prompts from Notion database...');
  
  // Validate environment variables
  if (!process.env.NOTION_API_KEY) {
    console.error('NOTION_API_KEY is not set in environment variables');
    throw new Error('NOTION_API_KEY is not set in environment variables');
  }

  if (!PROMPTS_DATABASE_ID) {
    console.error('NOTION_PROMPTS_DATABASE_ID is not set in environment variables');
    throw new Error('NOTION_PROMPTS_DATABASE_ID is not set in environment variables');
  }

  console.log(`Using database ID: ${PROMPTS_DATABASE_ID}`);

  try {
    console.log('Making Notion API request to query database...');
    const response = await notion.databases.query({
      database_id: PROMPTS_DATABASE_ID,
      sorts: [
        {
          property: 'Name',
          direction: 'ascending',
        },
      ],
    });

    console.log(`Received ${response.results.length} results from Notion database`);

    return response.results.map((page: any) => {
      console.log(`Processing page: ${page.id}`);
      
      // Extract the properties with null checks
      const name = page.properties.Name?.title?.[0]?.plain_text || '';
      const type = page.properties.Type?.select?.name || '';
      const content = page.properties.Content?.rich_text?.[0]?.plain_text || '';
      const variables = page.properties.Variables?.rich_text?.[0]?.plain_text?.split(',').map((v: string) => v.trim()) || [];
      const lastUpdated = page.properties['Last Updated']?.date?.start || new Date().toISOString();

      console.log(`Prompt data: name=${name}, type=${type}, contentLength=${content.length}, variables=${variables.length}`);

      // Validate required fields
      if (!name || !type || !content) {
        console.error('Invalid prompt data:', { name, type, content });
        throw new Error(`Invalid prompt data for page ${page.id}`);
      }

      return {
        id: page.id,
        name,
        type,
        content,
        variables,
        lastUpdated,
      };
    });
  } catch (error: any) {
    console.error('Error fetching prompts from Notion:', error);
    console.error('Error details:', error.stack);
    // Add more context to the error
    throw new Error(`Failed to fetch prompts from Notion: ${error.message}`);
  }
}

/**
 * Gets a specific prompt by type
 */
export async function getPromptByType(type: string): Promise<NotionPrompt | null> {
  console.log(`Getting prompt by type: ${type}`);
  const prompts = await fetchPrompts();
  const prompt = prompts.find(prompt => prompt.type === type) || null;
  console.log(prompt ? `Found prompt with type ${type}` : `No prompt found with type ${type}`);
  return prompt;
}

/**
 * Gets a specific prompt by name
 */
export async function getPromptByName(name: string): Promise<NotionPrompt | null> {
  console.log(`Getting prompt by name: ${name}`);
  const prompts = await fetchPrompts();
  const prompt = prompts.find(prompt => prompt.name === name) || null;
  console.log(prompt ? `Found prompt with name ${name}` : `No prompt found with name ${name}`);
  return prompt;
}

/**
 * Updates a prompt in the Notion database
 */
export async function updatePrompt(
  promptId: string,
  updates: Partial<NotionPrompt>
): Promise<void> {
  console.log(`Updating prompt with ID: ${promptId}`);
  console.log('Update data:', updates);
  
  try {
    console.log('Making Notion API request to update page...');
    await notion.pages.update({
      page_id: promptId,
      properties: {
        Name: {
          title: [
            {
              text: {
                content: updates.name || '',
              },
            },
          ],
        },
        Content: {
          rich_text: [
            {
              text: {
                content: updates.content || '',
              },
            },
          ],
        },
        Variables: {
          rich_text: [
            {
              text: {
                content: updates.variables?.join(',') || '',
              },
            },
          ],
        },
        'Last Updated': {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });
    console.log(`Successfully updated prompt: ${promptId}`);
  } catch (error) {
    console.error('Error updating prompt in Notion:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error');
    throw error;
  }
} 
import { NextResponse, NextRequest } from 'next/server';
import { SYSTEM_MESSAGES } from '@/config/prompts';

interface UrlSummary {
  title: string;
  summary: string;
}

/**
 * Summarizes content from a given URL using the /api/perplexity proxy.
 */
async function summarizeUrlContent(url: string): Promise<UrlSummary> {
  console.log(`Summarizing URL: ${url}`);
  const startTime = performance.now();

  const summarizationPrompt = `Please visit the following URL, read the content, and provide a concise summary suitable for generating LinkedIn posts. Also, extract or generate a suitable title for the content.\n\nURL: ${url}\n\nReturn the result as a JSON object with the keys "title" and "summary". Example:\n{\n  "title": "Extracted or Generated Title",\n  "summary": "A concise summary of the article content..."\n}`; 
  let response: Response | null = null;

  try {
    // Construct the absolute URL for the API proxy route
    const isDevelopment = process.env.NODE_ENV === 'development';
    // Use NEXT_PUBLIC_SITE_URL if available, otherwise fallback based on environment
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (isDevelopment ? 'http://localhost:3000' : '');

    if (!baseUrl) {
      console.error('Error: Base URL for API proxy is not configured. Set NEXT_PUBLIC_SITE_URL environment variable.');
      throw new Error('Application base URL is not configured.');
    }
    
    const proxyUrl = `${baseUrl}/api/perplexity`;
    console.log(`[summarizeUrlContent] Calling proxy URL for summarization: ${proxyUrl}`);

    response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar-pro', 
        messages: [
          {
            role: 'system',
            content: SYSTEM_MESSAGES.JSON_ASSISTANT 
          },
          {
            role: 'user',
            content: summarizationPrompt
          }
        ]
      })
    });

    console.log(`[summarizeUrlContent] Proxy response status: ${response.status}`);

    if (!response.ok) {
      let errorBody = 'Could not read error body';
      try {
        errorBody = await response.text();
        console.error(`[summarizeUrlContent] Proxy error response body (text): ${errorBody}`);
        const errorJson = JSON.parse(errorBody);
        console.error(`[summarizeUrlContent] Proxy error response body (parsed JSON):`, errorJson);
      } catch (parseError) {
        console.error(`[summarizeUrlContent] Failed to parse proxy error response as JSON.`);
      }
      throw new Error(`Perplexity API proxy request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[summarizeUrlContent] Perplexity Proxy Response Data (Parsed JSON):', JSON.stringify(data, null, 2));

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in message from summarization API via proxy');
    }
    
    console.log('[summarizeUrlContent] Raw summary content:', content);
    const cleanedContent = content
      .replace(/^```json\s*/, '')
      .replace(/\s*```$/, '')
      .trim();
      
    console.log('[summarizeUrlContent] Cleaned summary content:', cleanedContent);
    const summaryData = JSON.parse(cleanedContent);
    
    if (!summaryData.title || !summaryData.summary) {
      throw new Error('Invalid summary JSON format returned from API via proxy (missing title or summary)');
    }
    
    const endTime = performance.now();
    console.log(`[summarizeUrlContent] URL summarization completed successfully in ${Math.round(endTime - startTime)}ms`);
    return summaryData as UrlSummary;

  } catch (error) {
    console.error('[summarizeUrlContent] Error during summarization process:', error);
    // Ensure the specific error gets propagated
    if (error instanceof Error) {
      // Add status code if available from the response
      const status = response?.status || 500;
      throw new Error(`Failed to summarize URL content (Status: ${status}): ${error.message}`);
    } else {
      throw new Error('Failed to summarize URL content due to an unknown error.');
    }
  }
}

/**
 * POST handler for summarizing URL content
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL provided.' }, { status: 400 });
    }

    console.log(`Received request to summarize URL: ${url}`);
    const summaryData = await summarizeUrlContent(url);
    
    return NextResponse.json(summaryData);
  } catch (error: any) {
    console.error('[API /api/summarize-url] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to summarize URL.' }, { status: 500 });
  }
} 
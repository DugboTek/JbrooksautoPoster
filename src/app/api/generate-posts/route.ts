import { NextResponse, NextRequest } from 'next/server';
import { Article } from '@/types/articles';
import { generatePostsWithClaude } from '@/services/perplexityApi';
import { SYSTEM_MESSAGES, POST_GENERATION_PROMPT } from '@/config/prompts';

// Define a simple type for the summarization result
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
    let response: Response | null = null; // Define response variable here

    try {
        // Construct the absolute URL for the API proxy route
        const isDevelopment = process.env.NODE_ENV === 'development';
        // Use NEXT_PUBLIC_SITE_URL if available, otherwise fallback based on environment
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                        (isDevelopment ? 'http://localhost:3000' : ''); // Production URL needs to be set in env

        if (!baseUrl) {
            console.error('Error: Base URL for API proxy is not configured. Set NEXT_PUBLIC_SITE_URL environment variable.');
            throw new Error('Application base URL is not configured.');
        }
        
        const proxyUrl = `${baseUrl}/api/perplexity`;
        console.log(`[summarizeUrlContent] Calling proxy URL for summarization: ${proxyUrl}`);

        response = await fetch(proxyUrl, { // Assign to the outer response variable
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

        // Log status immediately
        console.log(`[summarizeUrlContent] Proxy response status: ${response.status}`);

        if (!response.ok) {
            let errorBody = 'Could not read error body';
            try {
                errorBody = await response.text(); // Try reading body as text first
                console.error(`[summarizeUrlContent] Proxy error response body (text): ${errorBody}`);
                // Attempt to parse as JSON for more detail, but catch if it's not JSON
                const errorJson = JSON.parse(errorBody);
                 console.error(`[summarizeUrlContent] Proxy error response body (parsed JSON):`, errorJson);
            } catch (parseError) {
                 console.error(`[summarizeUrlContent] Failed to parse proxy error response as JSON.`);
            }
            throw new Error(`Perplexity API proxy request failed: ${response.status}`);
        }

        // If response is OK, parse the JSON body
        const data = await response.json();
        console.log('[summarizeUrlContent] Perplexity Proxy Response Data (Parsed JSON):', JSON.stringify(data, null, 2)); // Log the successful data

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
 * POST handler for generating LinkedIn posts from either a selected article (topic) or a URL.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { input, inputType, industry = 'Professional', topicLabel = 'General' } = body;

        console.log(`Received request for inputType: ${inputType}`);

        let generatedPosts: string[] = [];

        if (inputType === 'topic') {
            // Validate input for topic type
            if (!input || typeof input !== 'object' || !input.id || !input.title || !input.summary || !input.sourceUrl) {
                return NextResponse.json({ error: 'Invalid article data provided for topic type.' }, { status: 400 });
            }
            const article = input as Article;
            console.log('Generating posts for selected article:', article.title);
            generatedPosts = await generatePostsWithClaude(article, industry, topicLabel);

        } else if (inputType === 'url') {
            // Validate input for url type
            if (typeof input !== 'string' || !input) {
                return NextResponse.json({ error: 'Invalid URL provided.' }, { status: 400 });
            }
            const url = input;
            
            // Step 1: Summarize the URL content
            const summaryData = await summarizeUrlContent(url);

            // Step 2: Create a pseudo-Article object from the summary
            // We need enough info for the POST_GENERATION_PROMPT
            const pseudoArticle: Article = {
                id: `url-${Date.now()}`,
                title: summaryData.title,
                summary: summaryData.summary,
                author: 'N/A', // Author/Publication might not be easily extractable
                publication: 'Web Article',
                sourceUrl: url,
                imageUrl: '' // No image fetched during summarization
            };

            // Step 3: Generate posts using the summary (via pseudo-article)
            console.log('Generating posts from URL summary:', pseudoArticle.title);
            generatedPosts = await generatePostsWithClaude(pseudoArticle, industry, 'Article from URL'); // Use generic topic

        } else {
            return NextResponse.json({ error: 'Invalid inputType specified.' }, { status: 400 });
        }

        // Return the generated posts
        if (!generatedPosts || generatedPosts.length === 0) {
            console.warn('Post generation resulted in zero posts.');
            // Consider returning a specific error or fallback here if needed
            // For now, returning empty array with success status
        }
        
        return NextResponse.json(generatedPosts);

    } catch (error: any) {
        console.error('[API /api/generate-posts] Error:', error);
        // Return the specific error message caught from summarizeUrlContent or generatePostsWithClaude
        return NextResponse.json({ error: error.message || 'Failed to generate posts.' }, { status: 500 });
    }
}

// Optional: Add Edge runtime configuration if needed (depends on deployment)
// export const runtime = 'edge'; 
import { NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

export async function POST(request: Request) {
  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: 'Perplexity API key is missing' },
      { status: 500 }
    );
  }

  try {
    const requestBody = await request.json();
    let perplexityRequestBody;

    // Check if we got a prompt string or messages array
    if (requestBody.prompt) {
      // Simple prompt format
      perplexityRequestBody = {
        model: 'sonar-pro',
        messages: [
          {
            role: 'user',
            content: requestBody.prompt
          }
        ]
      };
    } else {
      // Already formatted messages array
      perplexityRequestBody = {
        model: requestBody.model || 'sonar-pro',
        messages: requestBody.messages
      };
    }

    console.log('Sending request to Perplexity API:', JSON.stringify(perplexityRequestBody, null, 2));

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify(perplexityRequestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from Perplexity API:', errorText);
      try {
        const error = JSON.parse(errorText);
        return NextResponse.json(error, { status: response.status });
      } catch {
        return NextResponse.json(
          { error: `Perplexity API error: ${response.status} - ${errorText.substring(0, 500)}` },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error calling Perplexity API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to call Perplexity API' },
      { status: 500 }
    );
  }
} 
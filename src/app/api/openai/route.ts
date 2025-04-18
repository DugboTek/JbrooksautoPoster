import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is missing' },
      { status: 500 }
    );
  }

  try {
    const { postContent, editInstruction } = await request.json();

    if (!postContent || !editInstruction) {
      return NextResponse.json(
        { error: 'Post content and edit instruction are required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional editor specializing in LinkedIn posts. Your task is to edit LinkedIn posts according to specific instructions. Maintain the post\'s integrity while applying the requested changes. Return only the edited post text without any explanations or additional text.'
          },
          {
            role: 'user',
            content: `Edit the following LinkedIn post according to this instruction: "${editInstruction}"\n\nPost:\n${postContent}`
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    const editedPost = data.choices[0]?.message?.content?.trim();

    if (!editedPost) {
      return NextResponse.json(
        { error: 'No edited content returned from OpenAI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ editedPost });
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to call OpenAI API' },
      { status: 500 }
    );
  }
} 
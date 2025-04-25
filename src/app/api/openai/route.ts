import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Helper function to calculate text differences at word level
function calculateDiff(original: string, edited: string) {
  // Split texts into words for word-level diffing
  const originalWords = original.split(/(\s+)/).filter(word => word.length > 0);
  const editedWords = edited.split(/(\s+)/).filter(word => word.length > 0);
  
  // Calculate Levenshtein distance matrix
  const matrix: number[][] = Array(originalWords.length + 1).fill(null)
    .map(() => Array(editedWords.length + 1).fill(0));
  
  // Initialize the matrix
  for (let i = 0; i <= originalWords.length; i++) {
    matrix[i][0] = i;
  }
  
  for (let j = 0; j <= editedWords.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= originalWords.length; i++) {
    for (let j = 1; j <= editedWords.length; j++) {
      const cost = originalWords[i - 1] === editedWords[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  // Backtrack to find the changes
  const changes = [];
  let i = originalWords.length;
  let j = editedWords.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalWords[i - 1] === editedWords[j - 1]) {
      // No change
      changes.push({ type: 'keep', text: originalWords[i - 1] });
      i--;
      j--;
    } else {
      if (j > 0 && (i === 0 || matrix[i][j - 1] <= matrix[i - 1][j])) {
        // Addition
        changes.push({ type: 'add', text: editedWords[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || matrix[i - 1][j] <= matrix[i][j - 1])) {
        // Deletion
        changes.push({ type: 'remove', text: originalWords[i - 1] });
        i--;
      } else {
        // Substitution (treated as remove + add)
        changes.push({ type: 'remove', text: originalWords[i - 1] });
        changes.push({ type: 'add', text: editedWords[j - 1] });
        i--;
        j--;
      }
    }
  }
  
  // Reverse the changes to get them in the right order
  changes.reverse();
  
  // Convert to the expected format
  const added: {text: string, index: number}[] = [];
  const removed: {text: string, index: number}[] = [];
  
  let originalIndex = 0;
  let editedIndex = 0;
  
  for (const change of changes) {
    if (change.type === 'keep') {
      originalIndex += change.text.length;
      editedIndex += change.text.length;
    } else if (change.type === 'remove') {
      removed.push({
        text: change.text,
        index: originalIndex
      });
      originalIndex += change.text.length;
    } else if (change.type === 'add') {
      added.push({
        text: change.text,
        index: editedIndex
      });
      editedIndex += change.text.length;
    }
  }
  
  return { 
    added, 
    removed,
    changes // Include raw changes for more detailed animation
  };
}

// Default model options
const MODEL_OPTIONS = {
  default: 'gpt-3.5-turbo',
  fastest: 'gpt-3.5-turbo-16k',
  balanced: 'gpt-3.5-turbo',
  quality: 'gpt-4'
};

export async function POST(request: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is missing' },
      { status: 500 }
    );
  }

  try {
    const { postContent, editInstruction, modelPreference = 'fastest' } = await request.json();

    if (!postContent || !editInstruction) {
      return NextResponse.json(
        { error: 'Post content and edit instruction are required' },
        { status: 400 }
      );
    }
    
    // Get model based on preference or use fastest as default
    const modelToUse = MODEL_OPTIONS[modelPreference as keyof typeof MODEL_OPTIONS] || MODEL_OPTIONS.fastest;
    console.log(`Using model: ${modelToUse} based on preference: ${modelPreference}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: modelToUse,
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

    // Calculate differences between original and edited posts
    const diff = calculateDiff(postContent, editedPost);

    return NextResponse.json({ 
      editedPost,
      diff,
      model: modelToUse
    });
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to call OpenAI API' },
      { status: 500 }
    );
  }
} 
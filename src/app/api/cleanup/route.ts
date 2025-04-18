import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
  
  // Just return success - this helps verify API routes work
  return NextResponse.json({ 
    success: true, 
    message: 'API route working properly',
    timestamp: new Date().toISOString()
  });
} 
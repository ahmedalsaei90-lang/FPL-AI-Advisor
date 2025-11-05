import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Return a simple response to prevent next-auth errors
  // Since we're using Supabase auth, not next-auth
  return NextResponse.json({ 
    message: 'Using Supabase authentication instead of next-auth'
  });
}
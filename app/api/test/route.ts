import { NextResponse } from 'next/server';

// Simple test API endpoint
export async function GET() {
  return NextResponse.json({
    message: 'API is working'
  });
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the backend API URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Forward the request to the backend complete-onboarding endpoint
    const response = await fetch(`${backendUrl}/api/auth/complete-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Complete onboarding API route error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}
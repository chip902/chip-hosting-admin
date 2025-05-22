// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from "next/server";

// Set the microservice URL from environment variable or use default
const CALENDAR_API_URL = process.env.CALENDAR_MICROSERVICE_URL || "http://localhost:8008";

// Handle GET request to get Google auth URL
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const targetUrl = `${CALENDAR_API_URL}/api/auth/google${searchParams ? `?${searchParams}` : ''}`;

  try {
    // Forward request to the calendar microservice
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle response
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to get Google authentication URL' },
      { status: 500 }
    );
  }
}
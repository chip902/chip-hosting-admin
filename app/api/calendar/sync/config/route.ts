// app/api/calendar/sync/config/route.ts
import { NextRequest, NextResponse } from "next/server";

// Set the microservice URL from environment variable or use default
const CALENDAR_API_URL = process.env.CALENDAR_MICROSERVICE_URL || "http://localhost:8008";

// Handle GET request for sync configuration
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching sync configuration from:", `${CALENDAR_API_URL}/api/sync/config`);
    
    // Forward request to the calendar microservice
    const response = await fetch(`${CALENDAR_API_URL}/api/sync/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle response
    const data = await response.json();
    console.log("Received sync config response:", response.status);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error getting sync configuration:', error);
    return NextResponse.json(
      { error: 'Failed to get sync configuration' },
      { status: 500 }
    );
  }
}

// Handle POST request for sync configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Forward request to the calendar microservice
    const response = await fetch(`${CALENDAR_API_URL}/api/sync/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    // Handle response
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating sync configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update sync configuration' },
      { status: 500 }
    );
  }
}
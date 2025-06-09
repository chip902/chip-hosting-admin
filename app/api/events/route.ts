import { NextResponse } from "next/server";

const CALENDAR_SERVICE_URL = process.env.CALENDAR_SERVICE_URL;

if (!CALENDAR_SERVICE_URL) {
  throw new Error("CALENDAR_SERVICE_URL is not set in environment variables");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  try {
    const params = {
      credentials: searchParams.get('credentials'),
      calendars: searchParams.get('calendars'),
      sync_tokens: searchParams.get('sync_tokens'),
      start: searchParams.get('start'),
      end: searchParams.get('end'),
    };

    // Filter out undefined/null values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    );

    const queryString = new URLSearchParams(filteredParams as Record<string, string>).toString();
    const url = `${CALENDAR_SERVICE_URL}/api/events?${queryString}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

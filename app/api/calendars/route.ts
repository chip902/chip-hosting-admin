import { NextResponse } from "next/server";
import { CalendarProvider } from "@/lib/CalendarClient";

const CALENDAR_SERVICE_URL = process.env.CALENDAR_SERVICE_URL;

if (!CALENDAR_SERVICE_URL) {
  throw new Error("CALENDAR_SERVICE_URL is not set in environment variables");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const credentials = JSON.parse(searchParams.get('credentials') || '{}');
  
  try {
    const response = await fetch(`${CALENDAR_SERVICE_URL}/api/calendars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credentials })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendars: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching calendars:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendars' },
      { status: 500 }
    );
  }
}

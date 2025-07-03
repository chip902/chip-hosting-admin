import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';
import { CalendarProvider } from "@/lib/CalendarClient";

const CALENDAR_SERVICE_URL = process.env.CALENDAR_SERVICE_URL;

if (!CALENDAR_SERVICE_URL) {
  throw new Error("CALENDAR_SERVICE_URL is not set in environment variables");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const provider = providerParam.toUpperCase();
  
  // Validate provider
  if (!Object.values(CalendarProvider).includes(provider as CalendarProvider)) {
    return NextResponse.json(
      { error: `Unsupported provider: ${provider}` },
      { status: 400 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code) {
      // Handle OAuth callback
      const response = await fetch(
        `${CALENDAR_SERVICE_URL}/api/auth/${provider.toLowerCase()}/callback?code=${code}${state ? `&state=${state}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to authenticate with ${provider}: ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // Get auth URL
      const response = await fetch(
        `${CALENDAR_SERVICE_URL}/api/auth/${provider.toLowerCase()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get auth URL for ${provider}: ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error(`Error in ${provider} auth:`, error);
    return NextResponse.json(
      { error: error.message || `Failed to process ${provider} authentication` },
      { status: 500 }
    );
  }
}

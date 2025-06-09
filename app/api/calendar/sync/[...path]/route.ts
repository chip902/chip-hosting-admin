// app/api/calendar/sync/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

// Set the microservice URL from environment variable
const getCalendarApiUrl = (): string => {
  const url = process.env.CALENDAR_MICROSERVICE_URL;
  if (!url) {
    console.error('CALENDAR_MICROSERVICE_URL is not set in environment variables');
    throw new Error('Calendar microservice URL is not configured');
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const CALENDAR_API_URL = getCalendarApiUrl();

// Generic proxy function to forward requests to the calendar microservice
async function proxyRequest(request: NextRequest, path: string) {
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  
  // Join path segments without duplicating slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const targetUrl = new URL(`/api/sync/${cleanPath}`, CALENDAR_API_URL);
  
  // Add query parameters if they exist
  if (searchParams) {
    url.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });
  }
  
  console.log(`Proxying to: ${targetUrl.toString()}`);

  // Get request method, headers, and body
  const method = request.method;

  // Clone headers but exclude host
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("Content-Type", "application/json");

  // Get body if method is POST or PUT
  let body = null;
  if (method === "POST" || method === "PUT") {
    body = await request.text();
  }

  try {
    console.log(`Sending ${method} request to: ${targetUrl}`);
    console.log("Request headers:", Object.fromEntries(headers.entries()));

    // Forward request to the calendar microservice
    const response = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
    });

    // Log response status for debugging
    console.log(`Response status: ${response.status} ${response.statusText}`);

    // Handle response
    const data = await response.json().catch(async (e) => {
      console.error("Failed to parse JSON response:", e);
      const text = await response.text();
      console.error("Raw response:", text);
      throw new Error(`Failed to parse JSON response: ${text}`);
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying request to calendar microservice:", error);
    return NextResponse.json(
      {
        error: "Failed to communicate with calendar service",
        details: error instanceof Error ? error.message : String(error),
        targetUrl: targetUrl.toString(),
        method,
      },
      { status: 500 }
    );
  }
}

// Helper function to handle all methods
async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path ? resolvedParams.path.join("/") : "";
    const method = request.method;
    
    console.log(`[${method}] ${request.nextUrl.pathname} -> ${path}`);
    
    const response = await proxyRequest(request, path);
    
    // If the proxy request was successful, return the response
    if (response.status < 400) {
      return response;
    }
    
    // For error responses, add more context
    const error = await response.json().catch(() => ({}));
    return NextResponse.json(
      { 
        error: 'Calendar service error',
        details: error.message || 'Unknown error',
        status: response.status 
      },
      { status: response.status }
    );
  } catch (error) {
    console.error('Error in calendar sync proxy:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle all HTTP methods
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;

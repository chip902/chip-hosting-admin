// app/api/calendar/sync/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

// Set the microservice URL from environment variable or use default
const CALENDAR_API_URL = process.env.CALENDAR_MICROSERVICE_URL || "http://localhost:8008";

// Generic proxy function to forward requests to the calendar microservice
async function proxyRequest(request: NextRequest, path: string) {
	const url = new URL(request.url);
	const searchParams = url.searchParams.toString();
	const targetUrl = `${CALENDAR_API_URL}/api/sync/${path}${searchParams ? `?${searchParams}` : ""}`;

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
		// Forward request to the calendar microservice
		const response = await fetch(targetUrl, {
			method,
			headers,
			body,
		});

		// Handle response
		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error) {
		console.error("Error proxying request to calendar microservice:", error);
		return NextResponse.json({ error: "Failed to communicate with calendar service" }, { status: 500 });
	}
}

// Handle all GET requests
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
	const path = params.path.join("/");
	
	// Log the request for debugging
	console.log(`Proxying GET request to: ${CALENDAR_API_URL}/api/sync/${path}`);
	
	return proxyRequest(request, path);
}

// Handle all POST requests
export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
	const path = params.path.join("/");
	return proxyRequest(request, path);
}

// Handle all PUT requests
export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
	const path = params.path.join("/");
	return proxyRequest(request, path);
}

// Handle all DELETE requests
export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
	const path = params.path.join("/");
	return proxyRequest(request, path);
}

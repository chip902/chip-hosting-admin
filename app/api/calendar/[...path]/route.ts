import { NextRequest, NextResponse } from "next/server";

const CALENDAR_SERVICE_URL = "http://192.168.1.10:8008";

// List of endpoints that should be passed through to the microservice
const PROXIED_PATHS = [
	"/auth",
	"/calendars",
	"/events",
	"/sync",
	"/health",
	"/ping",
	"/api", // For any /api prefixed routes
	"/api/auth", // Handle auth routes with /api prefix
	"/api/calendars",
	"/api/events",
	"/api/sync",
	"/api/health",
	"/api/ping",
];

// Function to check if a path should be proxied
function shouldProxy(path: string): boolean {
	// Check if the path starts with any of the allowed paths
	return PROXIED_PATHS.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`));
}

// Debug logging function
function debugLog(...args: any[]) {
	if (process.env.NODE_ENV !== "production") {
		console.log("[Calendar Proxy]", ...args);
	}
}

// Create a single handler for all HTTP methods
export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
	return handleRequest("GET", request, context.params);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
	return handleRequest("POST", request, context.params);
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
	return handleRequest("PUT", request, context.params);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
	return handleRequest("DELETE", request, context.params);
}

async function handleRequest(method: string, request: NextRequest, params: { path: string[] }) {
	try {
		// Ensure params is an object and params.path is an array
		const pathSegments = Array.isArray(params?.path) ? params.path : [];

		// Log the incoming request
		debugLog("Incoming request:", {
			method,
			url: request.url,
			pathSegments,
			searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
		});

		// Remove the 'api' prefix if it exists in the path segments
		const filteredSegments = pathSegments[0] === "api" ? pathSegments.slice(1) : pathSegments;
		const path = `/${filteredSegments.join("/")}`;

		debugLog("Processed path:", { path, filteredSegments });

		// Check if the path should be proxied
		if (!shouldProxy(path)) {
			const error = {
				error: "Not Found",
				message: "The requested endpoint was not found",
				path,
				allowedPaths: PROXIED_PATHS,
			};
			debugLog("Path not allowed:", error);
			return NextResponse.json(error, { status: 404 });
		}

		// Create the target URL
		const targetUrl = new URL(path, CALENDAR_SERVICE_URL);

		// Forward query parameters
		request.nextUrl.searchParams.forEach((value, key) => {
			targetUrl.searchParams.append(key, value);
		});

		debugLog("Proxying request:", {
			method,
			from: request.url,
			to: targetUrl.toString(),
			path,
			searchParams: Object.fromEntries(targetUrl.searchParams.entries()),
		});

		// Log the final URL being called
		console.log(`[Calendar Proxy] Calling: ${method} ${targetUrl.toString()}`);

		// Create headers object
		const headers = new Headers();
		request.headers.forEach((value, key) => {
			// Skip some headers that are automatically set by fetch
			if (!["host", "content-length"].includes(key.toLowerCase())) {
				headers.set(key, value);
			}
		});

		// Ensure content type is set for non-GET requests
		if (method !== "GET" && method !== "HEAD" && !headers.has("Content-Type")) {
			headers.set("Content-Type", "application/json");
		}

		// Get the request body for non-GET requests
		let body: string | null = null;
		if (method !== "GET" && method !== "HEAD") {
			body = await request.text();
		}

		// Forward the request to the microservice
		const response = await fetch(targetUrl.toString(), {
			method,
			headers,
			body,
		});

		// Get the response data
		const responseData = await response.text().catch(() => null);

		// Create response headers
		const responseHeaders = new Headers();
		response.headers.forEach((value, key) => {
			responseHeaders.set(key, value);
		});

		// Create the response
		const responseObj = new NextResponse(responseData, {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(responseHeaders.entries()),
		});

		debugLog("Response from microservice:", {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(responseHeaders.entries()),
			body: responseData ? JSON.parse(responseData) : null,
		});

		return responseObj;
	} catch (error) {
		console.error("Proxy error:", error);
		const errorResponse = {
			error: "Failed to connect to calendar service",
			details: error instanceof Error ? error.message : String(error),
			path: request.nextUrl.pathname,
			method,
		};
		debugLog("Proxy error:", errorResponse);
		return NextResponse.json(errorResponse, { status: 502 });
	}
}

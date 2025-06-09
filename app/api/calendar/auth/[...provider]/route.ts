import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest, context: { params: { provider: string[] } }) {
	try {
		// Ensure we await the params properly for Next.js 15+
		const params = await context.params;
		const { provider } = params;
		const providerName = provider[0];
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get("code");
		const state = searchParams.get("state");

		// Get the master sync server URL from environment variables
		const masterSyncUrl = process.env.NEXT_PUBLIC_CALENDAR_MICROSERVICE_URL;
		if (!masterSyncUrl) {
			throw new Error("Master sync server URL not configured");
		}

		// Log the incoming request for debugging
		// Log the incoming request for debugging (only in development)
		if (process.env.NODE_ENV === "development") {
			console.log("Incoming request:", {
				provider: providerName,
				code: !!code,
				state,
				masterSyncUrl,
			});
		}

		let url: string;
		const baseUrl = masterSyncUrl.endsWith("/") ? masterSyncUrl.slice(0, -1) : masterSyncUrl;

		if (code) {
			// Handle OAuth callback - use the exact path that works with the server
			url = `${baseUrl}/api/auth/${providerName}/callback?code=${code}${state ? `&state=${state}` : ""}`;
		} else {
			// Handle initial auth request - use the exact path that works with the server
			// Use the same redirect_uri that was passed in the request
			const requestedRedirectUri = searchParams.get("redirect_uri");
			const redirectUri = requestedRedirectUri || new URL("/api/calendar/auth/callback", request.nextUrl.origin).toString();

			url = `${baseUrl}/api/auth/${providerName}`;

			// Add query parameters
			const urlObj = new URL(url);
			urlObj.searchParams.append("redirect_uri", redirectUri);
			if (state) urlObj.searchParams.append("state", state);
			url = urlObj.toString();
		}

		if (process.env.NODE_ENV === "development") {
			console.log("Forwarding request to:", url);
		}

		try {
			// Forward the request to the master sync server
			const response = await axios.get(url, {
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				maxRedirects: 0,
				validateStatus: (status) => status < 500, // Don't throw on 4xx errors
			});

			console.log("Response from server:", {
				status: response.status,
				headers: response.headers,
				data: response.data,
			});

			// If this is an OAuth redirect, follow it
			if (response.status >= 300 && response.status < 400 && response.headers.location) {
				console.log("Redirecting to:", response.headers.location);
				return NextResponse.redirect(response.headers.location);
			}

			// If the server returns an auth_url, redirect to it instead of returning JSON
			if (response.data && response.data.auth_url) {
				console.log("Redirecting to auth URL:", response.data.auth_url);
				return NextResponse.redirect(response.data.auth_url);
			}

			// Otherwise, return the JSON response
			return NextResponse.json(response.data);
		} catch (error: any) {
			console.error("Error forwarding request:", {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
				headers: error.response?.headers,
			});
			throw error;
		}
	} catch (error: any) {
		console.error("Auth proxy error:", error);
		return NextResponse.json({ error: error.message || "Authentication failed" }, { status: 500 });
	}
}

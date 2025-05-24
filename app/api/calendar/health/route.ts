import { NextRequest, NextResponse } from "next/server";

// Set the microservice URL from environment variable
const getCalendarApiUrl = (): string => {
	const url = process.env.CALENDAR_MICROSERVICE_URL;
	if (!url) {
		console.error("CALENDAR_MICROSERVICE_URL is not set in environment variables");
		throw new Error("Calendar microservice URL is not configured");
	}
	return url.endsWith("/") ? url.slice(0, -1) : url;
};

export async function GET(request: NextRequest) {
	const targetUrl = `${getCalendarApiUrl()}/health`;

	try {
		console.log(`Proxying health check to: ${targetUrl}`);
		const response = await fetch(targetUrl);

		if (!response.ok) {
			throw new Error(`Calendar service returned ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error) {
		console.error("Error checking calendar service health:", error);
		return NextResponse.json(
			{
				error: "Failed to connect to calendar service",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

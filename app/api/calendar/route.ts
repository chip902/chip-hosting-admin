import { NextResponse } from "next/server";

// Root endpoint for the calendar API
export async function GET() {
	return NextResponse.json({
		service: "Calendar API",
		status: "operational",
		endpoints: [
			{
				path: "/api/calendar/health",
				description: "Health check endpoint",
			},
			{
				path: "/api/calendar/sync/*",
				description: "Calendar sync endpoints",
			},
			{
				path: "/api/calendar/auth/*",
				description: "Authentication endpoints",
			},
			{
				path: "/api/calendar/events",
				description: "Calendar events endpoints",
			},
		],
		documentation: "https://your-calendar-service-docs.com",
	});
}

export async function POST() {
	return NextResponse.json(
		{
			error: "Method Not Allowed",
			message: "This endpoint only supports GET requests. Did you mean to use a specific endpoint like /api/calendar/sync?",
		},
		{ status: 405 }
	);
}

export async function PUT() {
	return NextResponse.json(
		{
			error: "Method Not Allowed",
			message: "This endpoint only supports GET requests. Did you mean to use a specific endpoint like /api/calendar/sync?",
		},
		{ status: 405 }
	);
}

export async function DELETE() {
	return NextResponse.json(
		{
			error: "Method Not Allowed",
			message: "This endpoint only supports GET requests. Did you mean to use a specific endpoint like /api/calendar/sync?",
		},
		{ status: 405 }
	);
}

import { NextResponse } from "next/server";

// This route handles incorrectly formatted API requests that include an extra /api segment
// e.g., /api/calendar/api/sync/config -> /api/calendar/sync/config
export function GET(request: Request, { params }: { params: { path: string[] } }) {
	const pathSegments = params.path || [];
	const newPath = `/api/calendar/${pathSegments.join("/")}`;
	const targetUrl = new URL(newPath, request.url);

	console.log(`Redirecting from ${request.url} to ${targetUrl.toString()}`);

	// Return a 308 Permanent Redirect to the correct path
	return NextResponse.redirect(targetUrl, 308);
}

// Handle other methods if needed
export async function POST() {
	return methodNotAllowed();
}
export async function PUT() {
	return methodNotAllowed();
}
export async function DELETE() {
	return methodNotAllowed();
}

function methodNotAllowed() {
	return new Response("Method Not Allowed", { status: 405 });
}

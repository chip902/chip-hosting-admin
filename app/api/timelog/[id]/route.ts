// app/api/timelog/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export async function PATCH(req: Request) {
	const url = new URL(req.url);
	const { pathname } = url;
	let id: number | null = null;

	// Extract ID from path segment
	const pathSegments = pathname.split("/");
	const idFromPath = pathSegments[pathSegments.length - 1]; // Get the last segment

	if (idFromPath && !isNaN(Number(idFromPath))) {
		// If the last segment is a valid number, use it as the ID
		id = parseInt(idFromPath, 10);
	} else {
		return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
	}

	try {
		// Parse the request body
		const data = await req.json();
		console.log("Update request received for time entry ID:", id, "with data:", data);

		// Get timezone from query params or use default
		const timezone = url.searchParams.get("timezone") || "America/New_York";

		// Create a clean object for updating
		let updateData: any = { ...data };

		// Validate and process date field with timezone conversion
		if (data.date) {
			try {
				const localDate = new Date(data.date);
				if (isNaN(localDate.getTime())) {
					return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
				}
				// Convert local time to UTC for database storage
				updateData.date = fromZonedTime(localDate, timezone);
			} catch (e) {
				return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
			}
		}

		// Validate and process endDate field if present with timezone conversion
		if (data.endDate) {
			try {
				const localEndDate = new Date(data.endDate);
				if (isNaN(localEndDate.getTime())) {
					return NextResponse.json({ error: "Invalid endDate format" }, { status: 400 });
				}
				// Convert local time to UTC for database storage
				updateData.endDate = fromZonedTime(localEndDate, timezone);
			} catch (e) {
				return NextResponse.json({ error: "Invalid endDate format" }, { status: 400 });
			}
		}

		// Update the time entry
		const updatedEntry = await prisma.timeEntry.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json(updatedEntry, { status: 200 });
	} catch (error) {
		console.error("Error updating time entry:", error);
		return NextResponse.json({ error: "Error updating time entry" }, { status: 500 });
	}
}

// Delete a time entry
export async function DELETE(req: Request) {
	const { pathname } = new URL(req.url);
	let id: number | null = null;

	// Extract ID from path segment
	const pathSegments = pathname.split("/");
	const idFromPath = pathSegments[pathSegments.length - 1]; // Get the last segment

	if (idFromPath && !isNaN(Number(idFromPath))) {
		// If the last segment is a valid number, use it as the ID
		id = parseInt(idFromPath, 10);
	} else {
		return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
	}

	try {
		// Check if the time entry exists before attempting deletion
		const existingEntry = await prisma.timeEntry.findUnique({
			where: { id },
		});

		if (!existingEntry) {
			return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
		}

		// Delete the time entry
		await prisma.timeEntry.delete({
			where: { id },
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error("Error deleting time entry:", error);
		return NextResponse.json({ error: error instanceof Error ? error.message : "Error deleting time entry" }, { status: 500 });
	}
}

// GET route to fetch a specific time entry
export async function GET(req: Request) {
	const { pathname } = new URL(req.url);
	let id: number | null = null;

	// Extract ID from path segment
	const pathSegments = pathname.split("/");
	const idFromPath = pathSegments[pathSegments.length - 1]; // Get the last segment

	if (idFromPath && !isNaN(Number(idFromPath))) {
		// If the last segment is a valid number, use it as the ID
		id = parseInt(idFromPath, 10);
	} else {
		return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
	}

	try {
		// Fetch the specific time entry
		const timeEntry = await prisma.timeEntry.findUnique({
			where: { id },
			include: {
				customer: true,
				project: true,
				task: true,
				user: true,
			},
		});

		if (!timeEntry) {
			return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
		}

		return NextResponse.json(timeEntry, { status: 200 });
	} catch (error) {
		console.error("Error fetching time entry:", error);
		return NextResponse.json({ error: "Error fetching time entry" }, { status: 500 });
	}
}

// app/api/timelog/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

export async function POST(req: Request) {
	const { searchParams } = new URL(req.url);
	const paramValue = searchParams.get("param");
	let id: number | null;

	if (paramValue) {
		id = parseInt(paramValue, 10);
		if (isNaN(id)) {
			throw new Error("Invalid ID provided.");
		}
	} else {
		// Handle the case where 'param' is not present
		return NextResponse.json({ error: "Missing parameter" }, { status: 400 });
	}
	try {
		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		// Parse the request body
		const data = await req.json();
		console.log("Update via POST received for time entry ID:", id, "with data:", data);

		// If date is provided, ensure it's properly formatted
		if (data.date) {
			try {
				const isoDate = new Date(data.date);
				if (isNaN(isoDate.getTime())) {
					return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
				}
				data.date = isoDate;
			} catch (error) {
				console.error("Error parsing date:", error);
				return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
			}
		}

		// Update the time entry
		const updatedEntry = await prisma.timeEntry.update({
			where: { id },
			data,
		});

		return NextResponse.json(updatedEntry, { status: 200 });
	} catch (error) {
		console.error("Error updating time entry via POST:", error);
		return NextResponse.json({ error: "Error updating time entry" }, { status: 500 });
	}
}
export async function PATCH(req: Request) {
	const { searchParams } = new URL(req.url);
	const paramValue = searchParams.get("param");
	let id: number | null;

	if (paramValue) {
		id = parseInt(paramValue, 10);
		if (isNaN(id)) {
			throw new Error("Invalid ID provided.");
		}
	} else {
		// Handle the case where 'param' is not present
		return NextResponse.json({ error: "Missing parameter" }, { status: 400 });
	}
	try {
		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		// Parse the request body
		const data = await req.json();
		console.log("Update request received for time entry ID:", id, "with data:", data);

		// If date is provided, ensure it's properly formatted
		let updateData: any = { ...data };

		if (data.date) {
			const isoDate = new Date(data.date);
			if (isNaN(isoDate.getTime())) {
				return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
			}
			updateData.date = isoDate;
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
	const { searchParams } = new URL(req.url);
	const paramValue = searchParams.get("param");
	let id: number | null;

	if (paramValue) {
		id = parseInt(paramValue, 10);
		if (isNaN(id)) {
			throw new Error("Invalid ID provided.");
		}
	} else {
		// Handle the case where 'param' is not present
		return NextResponse.json({ error: "Missing parameter" }, { status: 400 });
	}
	try {
		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
		}

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
		return NextResponse.json({ error: "Error deleting time entry" }, { status: 500 });
	}
}

// GET route to fetch a specific time entry or filter time entries
export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const paramValue = searchParams.get("param");
	let id: number | null;

	if (paramValue) {
		id = parseInt(paramValue, 10);
		if (isNaN(id)) {
			throw new Error("Invalid ID provided.");
		}
	} else {
		// Handle the case where 'param' is not present
		return NextResponse.json({ error: "Missing parameter" }, { status: 400 });
	}

	try {
		if (!isNaN(id)) {
			// If valid ID is provided, fetch that specific time entry
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
		} else {
			// Handle filters as an alternative
			const { searchParams } = new URL(req.url);
			// Add filtering logic here if needed

			return NextResponse.json({ error: "Invalid ID provided" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error fetching time entry:", error);
		return NextResponse.json({ error: "Error fetching time entry" }, { status: 500 });
	}
}

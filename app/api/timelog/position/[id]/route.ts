// /app/api/timelog/position/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";

/**
 * Special endpoint dedicated only to updating time entry positions
 * Uses POST to avoid PATCH issues
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		// Get ID from params
		const id = parseInt(params.id, 10);

		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		// Parse the request body
		const data = await request.json();
		console.log("Position update received for time entry ID:", id, "with data:", data);

		// Extract the position info
		const { date, startTime, endTime, duration } = data;

		// Validate all required fields
		if (!date || (!startTime && !duration)) {
			return NextResponse.json({ error: "Missing required fields for position update" }, { status: 400 });
		}

		// Prepare update data
		const updateData: any = {};

		// Add fields only if they're present
		if (date) {
			try {
				const isoDate = new Date(date);
				if (isNaN(isoDate.getTime())) {
					return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
				}
				updateData.date = isoDate;
			} catch (error) {
				console.error("Error parsing date:", error);
				return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
			}
		}

		if (startTime) updateData.startTime = startTime;
		if (endTime) updateData.endTime = endTime;
		if (duration) updateData.duration = duration;

		// Update the time entry with a focused update only for position-related fields
		const updatedEntry = await prisma.timeEntry.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json(updatedEntry, { status: 200 });
	} catch (error) {
		console.error("Error updating time entry position:", error);
		return NextResponse.json({ error: "Error updating time entry position" }, { status: 500 });
	}
}

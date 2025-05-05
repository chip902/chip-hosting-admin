// app/api/timelog/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { parseISO, isValid } from "date-fns";

interface TimeEntryRow {
	date: string; // YYYY-MM-DD
	startTime: string; // HH:MM
	endTime: string; // HH:MM
	description?: string;
	customerId: number;
	projectId: number;
	taskId: number;
	userId: number;
	duration?: number; // Optional, will be calculated if not provided
}

export async function POST(request: NextRequest) {
	try {
		const { entries } = await request.json();

		if (!entries || !Array.isArray(entries) || entries.length === 0) {
			return NextResponse.json({ message: "No valid entries provided" }, { status: 400 });
		}

		const results = {
			success: 0,
			failed: 0,
			errors: [] as string[],
		};

		// Process each entry
		for (const entry of entries) {
			try {
				// Validate the entry
				if (!entry.date || !entry.startTime || !entry.customerId || !entry.projectId || !entry.taskId || !entry.userId) {
					results.failed++;
					results.errors.push(`Missing required fields for entry`);
					continue;
				}

				// Extract the date part from the date string
				const dateOnly = entry.date.split("T")[0];

				// Construct valid ISO date-time strings
				const startDateTimeString = `${dateOnly}T${entry.startTime}`;
				const endDateTimeString = `${dateOnly}T${entry.endTime}`;

				// Parse the ISO date-time strings
				const startDateTime = parseISO(startDateTimeString);
				const endDateTime = parseISO(endDateTimeString);

				if (!isValid(startDateTime) || !isValid(endDateTime)) {
					results.failed++;
					results.errors.push(`Invalid start or end time for entry`);
					continue;
				}

				if (startDateTime >= endDateTime) {
					results.failed++;
					results.errors.push(`Start time must be before end time for entry`);
					continue;
				}

				// Calculate duration in minutes if not provided
				let duration = entry.duration;
				if (!duration) {
					duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
				}

				// Create the time entry
				await prisma.timeEntry.create({
					data: {
						date: startDateTime,
						duration,
						description: entry.description || "",
						customerId: Number(entry.customerId),
						projectId: Number(entry.projectId),
						taskId: Number(entry.taskId),
						userId: Number(entry.userId),
						isInvoiced: false,
					},
				});

				results.success++;
			} catch (error) {
				results.failed++;
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				results.errors.push(errorMessage);
			}
		}

		return NextResponse.json(
			{
				message: `Imported ${results.success} time entries. Failed: ${results.failed}`,
				results,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error importing time entries:", error);
		return NextResponse.json({ message: "Error importing time entries", error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
	}
}

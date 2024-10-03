// app/api/timelog/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { parseISO, isValid } from "date-fns";
import { timeLogSchema } from "@/app/validationSchemas";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const startDate = searchParams.get("startDate");
	const endDate = searchParams.get("endDate") || new Date().toISOString(); // Set default to current date if null
	const customerId = searchParams.get("customerId");
	const isInvoiced = searchParams.get("isInvoiced");
	const page = parseInt(searchParams.get("page") || "1", 10); // Default to page 1
	const pageSize = parseInt(searchParams.get("pageSize") || "10", 10); // Default to 10 entries per page

	try {
		let whereClause: {
			date?: {};
			customerId?: number;
			isInvoiced?: boolean;
		} = {};

		// Initialize additional fields in the 'where' clause with their respective types.

		if (startDate) {
			const parsedStartDate = parseISO(startDate);
			if (!isValid(parsedStartDate)) {
				throw new Error("Invalid start date");
			}
			whereClause.date = { ...whereClause.date, gte: parsedStartDate };
		}

		if (endDate) {
			let parsedEndDate;
			try {
				parsedEndDate = parseISO(endDate);
				const endOfDay = new Date(parsedEndDate.setUTCHours(23, 59, 59, 999));

				if (!isValid(endOfDay)) {
					throw new Error("Invalid end date");
				}
			} catch (error) {
				console.error("Error while parsing and setting the end date", error);
				parsedEndDate = new Date(); // You might want to handle this situation differently
			}
			whereClause.date = { ...whereClause.date, lte: parsedEndDate };
		} else {
			const nowDate = new Date(); // Using 'new' with 'Date' creates a new instance of the current date and time.
			whereClause.date = { ...whereClause.date, lte: nowDate };
		}

		if (customerId !== null && customerId !== undefined) whereClause.customerId = parseInt(customerId, 10);
		if (isInvoiced !== null && isInvoiced !== undefined) {
			if (isInvoiced === "true") {
				whereClause.isInvoiced = true;
			} else if (isInvoiced === "false") {
				whereClause.isInvoiced = false;
			}
		}
		const timeEntries = await prisma.timeEntry.findMany({
			where: whereClause,
			include: {
				Customer: true,
				Project: true,
				Task: true,
				User: true,
			},
			skip: (page - 1) * pageSize, // Offset for pagination
			take: pageSize, // Limit the number of results
			orderBy: {
				date: "desc", // Sort by date descending by default
			},
		});

		const totalEntries = await prisma.timeEntry.count({
			where: whereClause,
		});
		// console.log("CHIP DEBUG ", timeEntries);
		return NextResponse.json({ entries: timeEntries, totalEntries }, { status: 200 });
	} catch (error) {
		console.error("Error fetching time entries:", error);
		return NextResponse.json({ error: "Error fetching time entries" }, { status: 500 });
	}
}

// Create a new time entry
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Log the raw inputs before any parsing
		console.log("Raw inputs:", body);

		const validation = timeLogSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const { date, startTime, endTime, customerId, projectId, taskId, userId, ...rest } = body;

		// Parse and log the date
		const parsedDate = parseISO(date);
		console.log("Parsed date:", parsedDate);

		if (!isValid(parsedDate)) {
			throw new Error("Invalid date format");
		}

		// Combine date and time directly into a Date object
		const startDateTime = new Date(`${date.split("T")[0]}T${startTime}:00Z`);
		const endDateTime = new Date(`${date.split("T")[0]}T${endTime}:00Z`);

		// Log the directly combined DateTime values
		console.log("Direct Start DateTime:", startDateTime);
		console.log("Direct End DateTime:", endDateTime);

		if (!isValid(startDateTime) || !isValid(endDateTime)) {
			throw new Error("Invalid start or end time");
		}

		if (startDateTime >= endDateTime) {
			throw new Error("Start time must be before end time");
		}

		const newEntry = await prisma.timeEntry.create({
			data: {
				...rest,
				date: startDateTime,
				duration: (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60),
				Customer: {
					connect: { id: parseInt(customerId, 10) },
				},
				Project: {
					connect: { id: parseInt(projectId, 10) },
				},
				Task: {
					connect: { id: parseInt(taskId, 10) },
				},
				User: {
					connect: { id: parseInt(userId, 10) },
				},
			},
		});
		return NextResponse.json(newEntry, { status: 201 });
	} catch (error) {
		console.error("Error creating time entry:", error);
		return NextResponse.json({ error: "Error creating time entry" }, { status: 500 });
	}
}

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

	try {
		const whereClause: {
			date?: {
				gte?: Date;
				lte?: Date;
			};
			customerId?: number;
			isInvoiced: boolean;
		} = {
			isInvoiced: false,
		};

		// Only parse if startDate is not null
		const parsedStartDate = startDate ? parseISO(startDate) : new Date();
		if (isValid(parsedStartDate)) {
			whereClause.date = { gte: parsedStartDate };
		}

		// Parse endDate safely with default value
		const parsedEndDate = parseISO(endDate);
		// Adjust to include the entire day of endDate
		const endOfDay = new Date(parsedEndDate.setUTCHours(23, 59, 59, 999));
		if (isValid(parsedEndDate)) {
			if (whereClause.date) {
				whereClause.date.lte = endOfDay;
			} else {
				whereClause.date = { lte: endOfDay };
			}
		}

		if (customerId) whereClause.customerId = parseInt(customerId, 10);
		if (isInvoiced !== undefined) whereClause.isInvoiced = isInvoiced === "true";

		const timeEntries = await prisma.timeEntry.findMany({
			where: whereClause,
			include: {
				Customer: true,
				Project: true,
				Task: true,
				User: true,
			},
		});

		const totalEntries = await prisma.timeEntry.count({
			where: whereClause,
		});

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

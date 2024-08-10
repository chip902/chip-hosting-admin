// app/api/timelog/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { parseISO, formatISO, isValid } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { timeLogSchema } from "@/app/validationSchemas";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const startDate = searchParams.get("startDate");
	const endDate = searchParams.get("endDate");
	const customerId = searchParams.get("customerId");
	const isInvoiced = searchParams.get("isInvoiced");
	const page = parseInt(searchParams.get("page") || "1", 10);
	const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

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
		if (startDate) whereClause.date = { ...whereClause.date, gte: toZonedTime(startDate, "Etc/UTC") };
		if (endDate) whereClause.date = { ...whereClause.date, lte: toZonedTime(endDate, "Etc/UTC") };
		if (customerId) whereClause.customerId = parseInt(customerId, 10);
		if (isInvoiced !== undefined) whereClause.isInvoiced = isInvoiced === "true";

		const entries = await prisma.timeEntry.findMany({
			where: whereClause,
			include: {
				Customer: {
					select: {
						id: true,
						name: true,
						color: true,
						shortName: true,
					},
				},
				Project: {
					select: {
						id: true,
						name: true,
					},
				},
				Task: {
					select: {
						id: true,
						name: true,
					},
				},
				User: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			skip: (page - 1) * pageSize,
			take: pageSize,
		});
		const totalEntries = await prisma.timeEntry.count({
			where: whereClause,
		});

		// Adjust the dates to the user's timezone
		const timeZone = "America/New_York"; // Change to the relevant timezone
		const adjustedEntries = entries.map((entry) => ({
			...entry,
			date: toZonedTime(entry.date, timeZone),
		}));

		return NextResponse.json({ entries: adjustedEntries, totalEntries }, { status: 200 });
	} catch (error) {
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
					connect: {
						id: customerId,
					},
				},
				Project: {
					connect: {
						id: projectId,
					},
				},
				Task: {
					connect: {
						id: taskId,
					},
				},
				User: {
					connect: {
						id: userId,
					},
				},
			},
		});

		return NextResponse.json(newEntry, { status: 201 });
	} catch (error) {
		console.error("Error creating time entry:", error);
		return NextResponse.json({ error: "Error creating time entry" }, { status: 500 });
	}
}

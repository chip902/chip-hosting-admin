// app/api/timelog/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { timeLogSchema } from "@/app/validationSchemas";
import { format, isValid, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const startDate = searchParams.get("startDate");
	const endDate = searchParams.get("endDate");
	const customerId = searchParams.get("customerId");
	const isInvoiced = searchParams.get("isInvoiced");

	try {
		const whereClause: {
			date?: {
				gte?: Date;
				lte?: Date;
			};
			customerId?: number;
			isInvoiced?: boolean;
		} = {};
		if (startDate) whereClause.date = { ...whereClause.date, gte: parseISO(startDate) };
		if (endDate) whereClause.date = { ...whereClause.date, lte: parseISO(endDate) };
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
		});
		const totalEntries = await prisma.timeEntry.count({
			where: whereClause,
		});

		return NextResponse.json({ entries, totalEntries }, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching time entries" }, { status: 500 });
	}
}

// Create a new time entry
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = timeLogSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const { date, startTime, endTime, customerId, projectId, taskId, userId, ...rest } = body;

		// Parse and validate the date
		const parsedDate = parseISO(date);
		if (!isValid(parsedDate)) {
			throw new Error("Invalid date format");
		}

		const formattedDate = format(parsedDate, "yyyy-MM-dd");

		// Create DateTime strings for start and end times
		const startDateTime = new Date(`${formattedDate}T${startTime}:00`);
		const endDateTime = new Date(`${formattedDate}T${endTime}:00`);

		if (!isValid(startDateTime) || !isValid(endDateTime)) {
			throw new Error("Invalid start or end time");
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

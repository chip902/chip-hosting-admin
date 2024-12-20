import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { parseISO, isValid, startOfDay } from "date-fns";
import { timeLogSchema } from "@/app/validationSchemas";
import { ProcessedTimeEntry } from "@/types";
import { format } from "date-fns-tz";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const startDate = searchParams.get("startDate");
	const endDate = searchParams.get("endDate") || new Date().toISOString();
	const customerId = searchParams.get("customerId");
	const isInvoiced = searchParams.get("isInvoiced");
	const page = parseInt(searchParams.get("page") || "1", 10);
	const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

	try {
		let whereClause: {
			date?: {};
			customerId?: number;
			isInvoiced?: boolean;
		} = {};

		if (startDate) {
			const parsedStartDate = startOfDay(parseISO(startDate));
			whereClause.date = { ...whereClause.date, gte: parsedStartDate };
		}

		if (endDate) {
			let parsedEndDate;
			try {
				parsedEndDate = parseISO(endDate);
				const endOfDay = new Date(parsedEndDate.setHours(23, 59, 59, 999));
				if (!isValid(endOfDay)) {
					throw new Error("Invalid end date");
				}
				whereClause.date = { ...whereClause.date, lte: endOfDay };
			} catch (error) {
				console.error("Error while parsing and setting the end date", error);
				const nowDate = new Date();
				whereClause.date = { ...whereClause.date, lte: nowDate };
			}
		} else {
			const nowDate = new Date();
			whereClause.date = { ...whereClause.date, lte: nowDate };
		}

		if (customerId !== null && customerId !== undefined) {
			whereClause.customerId = parseInt(customerId, 10);
		}

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
				customer: true,
				project: true,
				task: true,
				user: true,
			},
			skip: (page - 1) * pageSize,
			take: pageSize,
			orderBy: {
				date: "desc",
			},
		});

		const formattedEntries: ProcessedTimeEntry[] = timeEntries.map((entry) => {
			const startTime = format(entry.date, "yyyy-MM-dd'T'HH:mm:ss'Z'");

			let actualEndDate: Date;
			if (entry.endDate) {
				// If endDate is in the DB, use it
				actualEndDate = entry.endDate;
			} else {
				// If no endDate, derive it from duration.
				// duration is stored in minutes, so add duration * 60,000ms to start date
				const durationMs = (entry.duration ?? 0) * 60_000;
				actualEndDate = new Date(entry.date.getTime() + durationMs);
			}

			const endTime = format(actualEndDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");

			// We trust 'entry.duration' from DB as minutes,
			// or you can re-calculate from startTime and endTime if needed.
			const duration = entry.duration ?? 0;

			return {
				id: entry.id,
				date: entry.date,
				startTime,
				endTime,
				customer: { name: entry.customer?.name || "" },
				project: { name: entry.project?.name || "" },
				task: { name: entry.task?.name || "" },
				isInvoiced: entry.isInvoiced,
				isClientInvoiced: entry.isInvoiced,
				isBillable: entry.isBillable,
				color: entry.customer.color!,
				name: entry.customer?.name || "",
				description: entry.description ?? "",
				duration,
				startSlot: entry.startSlot ?? undefined,
				endSlot: entry.endSlot ?? undefined,
			};
		});

		const totalEntries = await prisma.timeEntry.count({
			where: whereClause,
		});
		console.log("CHIP DEBUG ", timeEntries);
		return NextResponse.json({ entries: formattedEntries, totalEntries }, { status: 200 });
	} catch (error) {
		console.error("Error fetching time entries:", error);
		return NextResponse.json({ error: "Error fetching time entries" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		console.log("Raw inputs:", body);

		const validation = timeLogSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const { date, startTime, endTime, customerId, projectId, taskId, userId, ...rest } = body;

		// Extract the date part from the date string
		const dateOnly = date.split("T")[0];

		// Construct valid ISO date-time strings
		const startDateTimeString = `${dateOnly}T${startTime}`;
		const endDateTimeString = `${dateOnly}T${endTime}`;

		console.log("Start DateTime String:", startDateTimeString);
		console.log("End DateTime String:", endDateTimeString);

		// Parse the ISO date-time strings
		const startDateTime = parseISO(startDateTimeString);
		const endDateTime = parseISO(endDateTimeString);

		console.log("Start DateTime:", startDateTime);
		console.log("End DateTime:", endDateTime);

		if (!isValid(startDateTime) || !isValid(endDateTime)) {
			throw new Error("Invalid start or end time");
		}

		if (startDateTime >= endDateTime) {
			throw new Error("Start time must be before end time");
		}

		const duration = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);

		const newEntry = await prisma.timeEntry.create({
			data: {
				...rest,
				date: startDateTime,
				duration,
				customerId: parseInt(customerId, 10),
				projectId: parseInt(projectId, 10),
				taskId: parseInt(taskId, 10),
				userId: parseInt(userId, 10),
			},
		});

		return NextResponse.json(newEntry, { status: 201 });
	} catch (error) {
		console.error("Error creating time entry:", error);
		return NextResponse.json({ error: "Error creating time entry" }, { status: 500 });
	}
}

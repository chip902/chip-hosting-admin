// app/api/timelog/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { parseISO, isValid } from "date-fns";
import { timeLogSchema } from "@/app/validationSchemas";
import { ProcessedTimeEntry } from "@/types";
import { format } from "date-fns-tz";
import { Customer, Project, Task, TimeEntry } from "@prisma/client";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const startDate = searchParams.get("startDate");
	const endDate = searchParams.get("endDate") || new Date().toISOString();
	const customerId = searchParams.get("customerId");
	const invoiceStatus = searchParams.get("invoiceStatus");
	const page = parseInt(searchParams.get("page") || "1", 10);
	const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

	try {
		let whereClause: {
			date?: {};
			customerId?: number;
			invoiceStatus?: string;
			isInvoiced?: boolean;
		} = {};

		if (startDate) {
			// Handle both date-only and ISO string formats
			const date = startDate.includes("T") ? new Date(startDate) : new Date(`${startDate}T00:00:00.000Z`);

			console.log("Start Date received:", startDate);
			console.log("Adjusted Start Date:", date.toISOString());
			whereClause.date = { ...whereClause.date, gte: date };
		}

		if (endDate) {
			try {
				// Handle both date-only and ISO string formats
				const baseDate = endDate.includes("T") ? new Date(endDate) : new Date(`${endDate}T23:59:59.999Z`);

				console.log("End Date received:", endDate);
				console.log("Adjusted End Date:", baseDate.toISOString());
				whereClause.date = { ...whereClause.date, lte: baseDate };
			} catch (error) {
				console.error("Error while parsing and setting the end date", error);
				const nowDate = new Date();
				whereClause.date = { ...whereClause.date, lte: nowDate };
			}
		} else {
			const nowDate = new Date();
			whereClause.date = { ...whereClause.date, lte: nowDate };
		}

		if (customerId) {
			whereClause.customerId = parseInt(customerId, 10);
		}

		if (invoiceStatus && invoiceStatus !== "all") {
			whereClause.isInvoiced = invoiceStatus === "true";
		}

		console.log("Final where clause:", whereClause);

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

		const formattedEntries: ProcessedTimeEntry[] = timeEntries.map((entry: TimeEntry & { customer: Customer; project: Project; task: Task }) => {
			const startTime = format(entry.date, "yyyy-MM-dd'T'HH:mm:ss'Z'");
			let actualEndDate: Date;
			if (entry.endDate) {
				actualEndDate = entry.endDate;
			} else {
				const durationMs = (entry.duration ?? 0) * 60_000;
				actualEndDate = new Date(entry.date.getTime() + durationMs);
			}
			const endTime = format(actualEndDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
			const duration = entry.duration ?? 0;

			return {
				id: entry.id,
				date: new Date(entry.date),
				startTime: startTime,
				endTime: endTime,
				customer: { name: entry.customer.name },
				project: { name: entry.project.name },
				task: { name: entry.task.name },
				isInvoiced: entry.isInvoiced ?? false,
				invoiceStatus: entry.invoiceStatus ?? false,
				userId: entry.userId,
				isBillable: entry.isBillable || false,
				color: entry.color || "",
				name: entry.task.name || "",
			};
		});

		const totalEntries = await prisma.timeEntry.count({
			where: whereClause,
		});

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

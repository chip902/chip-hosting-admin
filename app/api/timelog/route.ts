// app/api/timelog/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { parseISO, isValid, startOfDay, addMinutes } from "date-fns";
import { timeLogSchema } from "@/app/validationSchemas";
import { TimeEntryData } from "@/types";
import { format, toZonedTime } from "date-fns-tz";

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
				const endOfDay = new Date(parsedEndDate.setHours(23, 59, 59, 999));

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
			skip: (page - 1) * pageSize,
			take: pageSize,
			orderBy: {
				date: "desc",
			},
		});

		const formattedEntries: TimeEntryData[] = timeEntries.map((entry) => {
			// Format dates in UTC and include 'Z' to indicate UTC time
			const startTime = format(entry.date, "yyyy-MM-dd'T'HH:mm:ss'Z'");
			const endTime = format(new Date(entry.date.getTime() + entry.duration * 60000), "yyyy-MM-dd'T'HH:mm:ss'Z'");

			return {
				...entry,
				date: format(entry.date, "yyyy-MM-dd"),
				startTime,
				endTime,
				Customer: entry.Customer
					? {
							...entry.Customer,
							dateCreated: format(entry.Customer.dateCreated, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
					  }
					: null,
				Project: entry.Project
					? {
							...entry.Project,
							dateCreated: format(entry.Project.dateCreated, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
					  }
					: null,
				Task: entry.Task
					? {
							...entry.Task,
							dateCreated: format(entry.Task.dateCreated, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
					  }
					: null,
				User: entry.User
					? {
							id: entry.User.id,
							firstName: entry.User.firstName,
							lastName: entry.User.lastName,
							email: entry.User.email,
					  }
					: null,
			};
		});

		const totalEntries = await prisma.timeEntry.count({
			where: whereClause,
		});
		// console.log("CHIP DEBUG ", timeEntries);
		return NextResponse.json({ entries: formattedEntries, totalEntries }, { status: 200 });
	} catch (error) {
		console.error("Error fetching time entries:", error);
		return NextResponse.json({ error: "Error fetching time entries" }, { status: 500 });
	}
}

// Create a new time entry
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

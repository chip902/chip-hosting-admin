// app/api/timelog/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { timeLogSchema } from "@/app/validationSchemas";

// Create a new time entry
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = timeLogSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const { date, startTime, endTime, customerId, projectId, taskId, userId, ...rest } = body;

		const startDateTime = new Date(`${date}T${startTime}:00`);
		const endDateTime = new Date(`${date}T${endTime}:00`);

		const newEntry = await prisma.timeEntry.create({
			data: {
				...rest,
				date: startDateTime,
				duration: (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60),
				customer: {
					connect: {
						id: customerId,
					},
				},
				project: {
					connect: {
						id: projectId,
					},
				},
				task: {
					connect: {
						id: taskId,
					},
				},
				user: {
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

// Fetch all time entries
export async function GET() {
	try {
		const entries = await prisma.timeEntry.findMany({
			include: {
				customer: true,
				project: true,
				task: true,
				user: true,
			},
		});
		return NextResponse.json(entries, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching time entries" }, { status: 500 });
	}
}

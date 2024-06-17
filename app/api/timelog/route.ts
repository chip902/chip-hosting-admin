import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { timeLogSchema } from "@/app/validationSchemas";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = timeLogSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const { date, startTime, endTime, ...rest } = body;

		const startDateTime = new Date(`${date}T${startTime}:00`);
		const endDateTime = new Date(`${date}T${endTime}:00`);

		const newEntry = await prisma.timeEntry.create({
			data: {
				...rest,
				date: startDateTime,
				duration: (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60), // duration in minutes
			},
		});

		return NextResponse.json(newEntry, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Error creating time entry" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const entries = await prisma.timeEntry.findMany();
		return NextResponse.json(entries, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching time entries" }, { status: 500 });
	}
}

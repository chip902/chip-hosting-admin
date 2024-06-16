// app/api/timelog/route.ts
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
		const newTimeLog = await prisma.timeEntry.create({
			data: {
				description: body.description,
				duration: body.duration,
				date: body.date,
				taskId: body.taskId,
				userId: body.userId,
			},
		});
		return NextResponse.json(newTimeLog, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Error logging time" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const timeLogs = await prisma.timeEntry.findMany();
		return NextResponse.json(timeLogs, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching time logs" }, { status: 500 });
	}
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { timeLogSchema } from "@/app/validationSchemas";

// Update a time entry
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const body = await request.json();
		const id = parseInt(params.id);
		console.log("Received payload:", body);
		const { date, startTime, endTime, customerId, projectId, taskId, userId, duration, ...rest } = body;
		if (!id) {
			return NextResponse.json({ error: "ID is required" }, { status: 400 });
		}
		const parsedDate = new Date(date);
		if (isNaN(parsedDate.getTime())) {
			return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
		}
		const validation = timeLogSchema.safeParse({ ...rest, date: parsedDate, startTime, endTime, customerId, projectId, taskId, userId, duration });
		if (!validation.success) {
			console.error("Validation failed:", validation.error.format());
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const startDateTime = new Date(`${date}T${startTime}:00`);
		const endDateTime = new Date(`${date}T${endTime}:00`);
		if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
			return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
		}
		const updatedEntry = await prisma.timeEntry.update({
			where: { id },
			data: {
				...rest,
				id: id,
				date: startDateTime,
				duration: parseInt(rest.duration),
				customer: customerId ? { connect: { id: customerId } } : undefined,
				project: projectId ? { connect: { id: projectId } } : undefined,
				task: taskId ? { connect: { id: taskId } } : undefined,
				user: { connect: { id: userId } },
			},
		});

		return NextResponse.json(updatedEntry, { status: 200 });
	} catch (error) {
		console.error("Error updating time entry:", error);
		return NextResponse.json({ error: "Error updating time entry" }, { status: 500 });
	}
}

// Delete a time entry
export async function DELETE(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const id = parseInt(url.pathname.split("/").pop() || "");

		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
		}

		await prisma.timeEntry.delete({
			where: { id },
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error("Error deleting time entry:", error);
		return NextResponse.json({ error: "Error deleting time entry" }, { status: 500 });
	}
}

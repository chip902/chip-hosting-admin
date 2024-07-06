import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { timeLogSchema } from "@/app/validationSchemas";

// Update a time entry
export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const { id, date, startTime, endTime, customerId, projectId, taskId, userId, ...rest } = body;

		const validation = timeLogSchema.safeParse({ date, startTime, endTime, customerId, projectId, taskId, userId, ...rest });
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const startDateTime = new Date(`${date}T${startTime}:00`);
		const endDateTime = new Date(`${date}T${endTime}:00`);

		const updatedEntry = await prisma.timeEntry.update({
			where: { id },
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

		return NextResponse.json(updatedEntry, { status: 200 });
	} catch (error) {
		console.error("Error updating time entry:", error);
		return NextResponse.json({ error: "Error updating time entry" }, { status: 500 });
	}
}

// Delete a time entry
export async function DELETE(request: NextRequest) {
	try {
		const { id } = await request.json();
		await prisma.timeEntry.delete({
			where: { id },
		});
		return NextResponse.json({ message: "Time entry deleted" }, { status: 204 });
	} catch (error) {
		console.error("Error deleting time entry:", error);
		return NextResponse.json({ error: "Error deleting time entry" }, { status: 500 });
	}
}

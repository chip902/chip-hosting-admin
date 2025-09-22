import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { z } from "zod";

const taskSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, "Task name is required"),
	description: z.string().optional(),
	rate: z.number().positive().optional(),
});

export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = taskSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const { id, ...data } = body;

		if (!id) {
			return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
		}

		const updatedTask = await prisma.task.update({
			where: { id: id },
			data: {
				name: data.name,
				description: data.description,
				rate: data.rate,
			},
		});

		return NextResponse.json(updatedTask, { status: 200 });
	} catch (error) {
		console.error("Error updating task:", error);
		return NextResponse.json({ error: "Error updating task" }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const pathSegments = url.pathname.split('/');
		const idString = pathSegments[pathSegments.length - 2]; // Get id from URL path
		const id = Number.parseInt(idString, 10);

		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
		}

		const task = await prisma.task.findUnique({
			where: { id },
		});
		if (!task) {
			return NextResponse.json({ error: "Task not found" }, { status: 404 });
		}

		await prisma.task.delete({
			where: { id },
		});
		return NextResponse.json({ message: "Task deleted." }, { status: 200 });
	} catch (error) {
		console.error("Error deleting task:", error);
		return NextResponse.json({ error: "Error deleting task" }, { status: 500 });
	}
}

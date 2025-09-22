import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { z } from "zod";

const taskSchema = z.object({
	name: z.string().min(1, "Task name is required"),
	description: z.string().optional(),
	rate: z.number().positive().optional(),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = taskSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const newTask = await prisma.task.create({
			data: {
				name: body.name,
				description: body.description,
				rate: body.rate,
			},
		});

		return NextResponse.json(newTask, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Error creating task" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const tasks = await prisma.task.findMany({
			include: {
				projects: {
					include: {
						customer: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});
		return NextResponse.json(tasks, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching tasks" }, { status: 500 });
	}
}

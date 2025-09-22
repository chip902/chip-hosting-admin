import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { z } from "zod";

const assignTaskSchema = z.object({
	taskIds: z.array(z.number()),
});

// Assign tasks to a project
export async function POST(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const pathSegments = url.pathname.split('/');
		const projectIdString = pathSegments[pathSegments.indexOf('projects') + 1];
		const projectId = Number.parseInt(projectIdString, 10);

		if (isNaN(projectId)) {
			return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
		}

		const body = await request.json();
		const validation = assignTaskSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		// First, remove all existing task assignments for this project
		await prisma.projectTasks.deleteMany({
			where: { projectId },
		});

		// Then create new assignments
		const assignments = body.taskIds.map((taskId: number) => ({
			projectId,
			taskId,
		}));

		if (assignments.length > 0) {
			await prisma.projectTasks.createMany({
				data: assignments,
			});
		}

		// Return the project with its assigned tasks
		const updatedProject = await prisma.project.findUnique({
			where: { id: projectId },
			include: {
				tasks: true,
				customer: {
					select: {
						name: true,
					},
				},
			},
		});

		return NextResponse.json(updatedProject, { status: 200 });
	} catch (error) {
		console.error("Error assigning tasks to project:", error);
		return NextResponse.json({ error: "Error assigning tasks to project" }, { status: 500 });
	}
}

// Get tasks assigned to a project
export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const pathSegments = url.pathname.split('/');
		const projectIdString = pathSegments[pathSegments.indexOf('projects') + 1];
		const projectId = Number.parseInt(projectIdString, 10);

		if (isNaN(projectId)) {
			return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
		}

		const project = await prisma.project.findUnique({
			where: { id: projectId },
			include: {
				tasks: true,
			},
		});

		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		return NextResponse.json(project.tasks, { status: 200 });
	} catch (error) {
		console.error("Error fetching project tasks:", error);
		return NextResponse.json({ error: "Error fetching project tasks" }, { status: 500 });
	}
}

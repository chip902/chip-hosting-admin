import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { z } from "zod";

const assignUserSchema = z.object({
	userIds: z.array(z.number()),
});

// Assign users to a project
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
		const validation = assignUserSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		// Update the project with assigned users
		const updatedProject = await prisma.project.update({
			where: { id: projectId },
			data: {
				users: {
					set: body.userIds.map((userId: number) => ({ id: userId })),
				},
			},
			include: {
				users: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
					},
				},
				customer: {
					select: {
						name: true,
					},
				},
			},
		});

		return NextResponse.json(updatedProject, { status: 200 });
	} catch (error) {
		console.error("Error assigning users to project:", error);
		return NextResponse.json({ error: "Error assigning users to project" }, { status: 500 });
	}
}

// Get users assigned to a project
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
				users: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
					},
				},
			},
		});

		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		return NextResponse.json(project.users, { status: 200 });
	} catch (error) {
		console.error("Error fetching project users:", error);
		return NextResponse.json({ error: "Error fetching project users" }, { status: 500 });
	}
}

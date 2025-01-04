// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { projectSchema } from "@/app/validationSchemas";
import { getParamsFromUrl } from "@/lib/utils";

// DELETE request to delete a project by ID
export async function DELETE(request: NextRequest) {
	try {
		const params = getParamsFromUrl(request.url);
		const idString = params.params.id;
		const id = Number.parseInt(idString, 10);
		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
		}

		const project = await prisma.project.findUnique({
			where: { id },
		});
		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		await prisma.project.delete({
			where: { id },
		});
		return NextResponse.json({ message: "Project deleted." }, { status: 200 });
	} catch (error) {
		console.error("Error deleting project:", error);
		return NextResponse.json({ error: "Error deleting project" }, { status: 500 });
	}
}

// POST request to create a new project
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = projectSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}
		const newProject = await prisma.project.create({
			data: {
				name: body.name,
				description: body.description,
				rate: body.rate,
				customerId: body.customerId,
			},
		});
		return NextResponse.json(newProject, { status: 201 });
	} catch (error) {
		console.error("Error creating project:", error);
		return NextResponse.json({ error: "Error creating project" }, { status: 500 });
	}
}

// GET request to fetch a project by ID
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const id = parseInt(searchParams.get("id") || "");
		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
		}

		const project = await prisma.project.findUnique({
			where: { id },
		});
		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		return NextResponse.json(project, { status: 200 });
	} catch (error) {
		console.error("Error fetching project:", error);
		return NextResponse.json({ error: "Error fetching project" }, { status: 500 });
	}
}

// PATCH request to update an existing project
export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		console.log("Received body:", body);

		const validation = projectSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const { id } = body;

		if (!id) {
			return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
		}

		// First, get the existing project
		const existingProject = await prisma.project.findUnique({
			where: { id },
			include: { customer: true },
		});

		if (!existingProject) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		console.log("Existing project:", existingProject);

		// Try updating just the archived status first
		const updatedProject = await prisma.project.update({
			where: {
				id,
			},
			data: {
				...body,
				rate: body.rate || 0,
				archived: body.archived,
			},
		});

		return NextResponse.json(updatedProject, { status: 200 });
	} catch (error) {
		console.error("Error updating project:", error);
		if (error instanceof Error) {
			console.error("Error details:", {
				name: error.name,
				message: error.message,
				stack: error.stack,
			});
			return NextResponse.json(
				{
					error: error.message,
					details: {
						name: error.name,
						message: error.message,
					},
				},
				{ status: 500 }
			);
		}
		return NextResponse.json({ error: "Error updating project" }, { status: 500 });
	}
}

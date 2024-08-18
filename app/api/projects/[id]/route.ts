// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { projectSchema } from "@/app/validationSchemas";

// DELETE request to delete a project by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const id = parseInt(params.id);
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
		const validation = projectSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const { id, ...data } = body;

		if (!id) {
			return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
		}

		const updatedProject = await prisma.project.update({
			where: { id: id },
			data: {
				name: data.name,
				description: data.description,
				rate: data.rate,
				customerId: data.customerId,
			},
		});

		return NextResponse.json(updatedProject, { status: 200 });
	} catch (error) {
		console.error("Error updating project:", error);
		return NextResponse.json({ error: "Error updating project" }, { status: 500 });
	}
}

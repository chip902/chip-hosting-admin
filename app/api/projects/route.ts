// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { projectSchema } from "@/app/validationSchemas";

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
		return NextResponse.json({ error: "Error creating project" }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = projectSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}
		const updatedProject = await prisma.customer.update({
			where: { id: body.id },
			data: {
				name: body.name,
				email: body.email,
				defaultRate: body.rate,
				color: body.color,
			},
		});
		return NextResponse.json(updatedProject, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error updating project" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const projects = await prisma.project.findMany();
		return NextResponse.json(projects, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching projects" }, { status: 500 });
	}
}

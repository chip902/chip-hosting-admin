import { prisma } from "@/prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		// Fetch customers with id and name
		const customers = await prisma.customer.findMany({
			select: {
				id: true,
				name: true,
			},
		});
		customers.sort((a, b) => a.name.localeCompare(b.name));

		// Fetch projects with id, name, and customerId
		const projects = await prisma.project.findMany({
			where: { archived: false },
			select: {
				id: true,
				name: true,
				customerId: true,
			},
		});
		projects.sort((a, b) => a.name.localeCompare(b.name));

		// Fetch tasks with id and name
		const tasks = await prisma.task.findMany({
			select: {
				id: true,
				name: true,
			},
		});
		tasks.sort((a, b) => a.name.localeCompare(b.name));

		// Fetch users with id and name
		const users = await prisma.user.findMany({
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
			},
		});

		return NextResponse.json({ customers, projects, tasks, users }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
	}
}

import { NextResponse } from "next/server";
import prisma from "@/prisma/client";

export async function GET() {
	try {
		const customers = await prisma.customer.findMany();
		customers.sort((a, b) => a.name.localeCompare(b.name));

		const projects = await prisma.project.findMany();
		projects.sort((a, b) => a.name.localeCompare(b.name));

		const tasks = await prisma.task.findMany();
		tasks.sort((a, b) => a.name.localeCompare(b.name));

		const users = await prisma.user.findMany();

		return NextResponse.json({ customers, projects, tasks, users }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
	}
}

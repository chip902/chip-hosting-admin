// app/api/timelog/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { parseISO } from "date-fns";

// Update a time entry
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const body = await request.json();
		const id = await parseInt(params.id);

		if (!id) {
			return NextResponse.json({ error: "ID is required" }, { status: 400 });
		}

		const { description, duration, date, ...rest } = body;

		const updatedEntry = await prisma.timeEntry.update({
			where: { id },
			data: {
				...rest,
				date,
				description,
				duration,
			},
		});

		return NextResponse.json(updatedEntry, { status: 200 });
	} catch (error) {
		console.error("Error updating time entry:", error);
		return NextResponse.json({ error: "Error updating time entry" }, { status: 500 });
	}
}

// Delete a time entry
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const id = await parseInt(params.id);

		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
		}

		await prisma.timeEntry.delete({
			where: { id },
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error("Error deleting time entry:", error);
		return NextResponse.json({ error: "Error deleting time entry" }, { status: 500 });
	}
}
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const startDate = searchParams.get("startDate");
	const endDate = searchParams.get("endDate");
	const customerId = searchParams.get("customerId");
	const isInvoiced = searchParams.get("isInvoiced");

	try {
		const whereClause: any = {};
		if (startDate) whereClause.date = { gte: parseISO(startDate) };
		if (endDate) whereClause.date = { ...whereClause.date, lte: parseISO(endDate) };
		if (customerId) whereClause.customerId = parseInt(customerId);
		if (isInvoiced !== undefined) whereClause.isInvoiced = isInvoiced === "true";

		const entries = await prisma.timeEntry.findMany({
			where: whereClause,
			include: {
				Customer: true,
				Project: true,
				Task: true,
				User: true,
			},
		});

		return NextResponse.json(entries, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching time entries" }, { status: 500 });
	}
}

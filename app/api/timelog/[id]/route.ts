// app/api/timelog/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { parseISO } from "date-fns";
import { getParamsFromUrl } from "@/lib/utils";

export async function PATCH(request: NextRequest) {
	try {
		const { description, duration, date } = await request.json();
		console.log("Received Date:", date);

		// Assuming date is in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
		let startDate;
		try {
			startDate = parseISO(date); // Using date-fns parseISO for consistency
		} catch (error) {
			return NextResponse.json({ error: "Invalid date format. Use ISO 8601." }, { status: 400 });
		}

		if (isNaN(startDate.getTime())) {
			return NextResponse.json({ error: "Failed to parse date." }, { status: 400 });
		}

		const params = getParamsFromUrl(request.url);
		const idString = params.params.id;
		const id = Number.parseInt(idString, 10);
		if (isNaN(id)) {
			return NextResponse.json({ error: "ID is required" }, { status: 400 });
		}

		const updatedEntry = await prisma.timeEntry.update({
			where: { id },
			data: {
				description,
				duration,
				date: `${date}Z`,
			},
		});

		return NextResponse.json(updatedEntry, { status: 200 });
	} catch (error) {
		console.error("Error updating time entry:", error);
		return NextResponse.json({ error: "Error updating time entry" }, { status: 500 });
	}
}

// Delete a time entry
export async function DELETE(request: NextRequest) {
	try {
		const params = getParamsFromUrl(request.url);
		const idString = params.params.id;
		const id = Number.parseInt(idString, 10);

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
				customer: true,
				project: true,
				task: true,
				user: true,
			},
		});

		return NextResponse.json(entries, { status: 200 }); // Corrected from 201 to 200
	} catch (error) {
		return NextResponse.json({ error: "Error fetching time entries" }, { status: 500 });
	}
}

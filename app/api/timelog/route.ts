import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { parseISO, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const startDate = searchParams.get("startDate");
	const endDate = searchParams.get("endDate");
	const customerId = searchParams.get("customerId");
	const isInvoiced = searchParams.get("isInvoiced");
	const page = parseInt(searchParams.get("page") || "1", 10);
	const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

	const userTimeZone = "UTC"; // Replace with actual user timezone if available

	try {
		let whereClause: any = {};

		if (startDate) {
			const parsedStartDate = startOfDay(parseISO(startDate));
			whereClause.date = { ...whereClause.date, gte: parsedStartDate };
		}

		if (endDate) {
			const parsedEndDate = endOfDay(parseISO(endDate));
			whereClause.date = { ...whereClause.date, lte: parsedEndDate };
		}

		if (customerId) whereClause.customerId = parseInt(customerId, 10);
		if (isInvoiced === "true") whereClause.isInvoiced = true;
		if (isInvoiced === "false") whereClause.isInvoiced = false;

		const timeEntries = await prisma.timeEntry.findMany({
			where: whereClause,
			include: {
				Customer: true,
				Project: true,
				Task: true,
				User: true,
			},
			skip: (page - 1) * pageSize,
			take: pageSize,
			orderBy: { date: "desc" },
		});

		const totalEntries = await prisma.timeEntry.count({ where: whereClause });

		// Convert dates to user timezone for response
		const convertedEntries = timeEntries.map((entry) => ({
			...entry,
			date: toZonedTime(entry.date, userTimeZone),
		}));

		return NextResponse.json({ entries: convertedEntries, totalEntries }, { status: 200 });
	} catch (error) {
		console.error("Error fetching time entries:", error);
		return NextResponse.json({ error: "Error fetching time entries" }, { status: 500 });
	}
}

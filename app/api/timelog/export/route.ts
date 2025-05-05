// app/api/timelog/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
	try {
		const { entries, format: exportFormat = "xlsx" } = await request.json();

		if (!entries || !Array.isArray(entries) || entries.length === 0) {
			return NextResponse.json({ message: "No entries provided for export" }, { status: 400 });
		}

		// Only handle XLSX exports for now as we handle CSV and JSON in the frontend
		if (exportFormat !== "xlsx") {
			return NextResponse.json({ message: "Unsupported export format" }, { status: 400 });
		}

		// Create a new workbook
		const workbook = XLSX.utils.book_new();

		// Format data for the worksheet
		const worksheetData = entries.map((entry: any) => ({
			Date: entry.date,
			"Start Time": entry.startTime,
			"End Time": entry.endTime,
			Duration: typeof entry.duration === "number" ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m` : entry.duration,
			Description: entry.description || "",
			Customer: entry.customerName,
			Project: entry.projectName,
			Task: entry.taskName,
			Invoiced: entry.isInvoiced ? "Yes" : "No",
		}));

		// Create a worksheet with the data
		const worksheet = XLSX.utils.json_to_sheet(worksheetData);

		// Set column widths
		const colWidths = [
			{ wch: 12 }, // Date
			{ wch: 10 }, // Start Time
			{ wch: 10 }, // End Time
			{ wch: 12 }, // Duration
			{ wch: 40 }, // Description
			{ wch: 20 }, // Customer
			{ wch: 20 }, // Project
			{ wch: 20 }, // Task
			{ wch: 10 }, // Invoiced
		];

		worksheet["!cols"] = colWidths;

		// Add the worksheet to the workbook
		XLSX.utils.book_append_sheet(workbook, worksheet, "Time Log");

		// Generate a filename with current date
		const fileName = `TimeLog_Export_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

		// Write the workbook to a buffer
		const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

		// Return the Excel file
		return new NextResponse(buffer, {
			status: 200,
			headers: {
				"Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"Content-Disposition": `attachment; filename="${fileName}"`,
				"Content-Length": buffer.length.toString(),
			},
		});
	} catch (error: any) {
		console.error("Error exporting time log:", error);
		return NextResponse.json({ message: "Error exporting time log", error: error.message }, { status: 500 });
	}
}

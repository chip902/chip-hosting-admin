// app/api/timelog/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import ExcelJS from "exceljs";
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
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Time Log");

		// Define headers
		const headers = [
			"Date",
			"Start Time",
			"End Time",
			"Duration",
			"Description",
			"Customer",
			"Project",
			"Task",
			"Invoiced",
		];

		// Add header row with styling
		worksheet.addRow(headers);
		const headerRow = worksheet.getRow(1);
		headerRow.font = { bold: true };
		headerRow.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFE0E0E0" },
		};

		// Add data rows
		entries.forEach((entry: any) => {
			const row = [
				entry.date,
				entry.startTime,
				entry.endTime,
				typeof entry.duration === "number" ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m` : entry.duration,
				entry.description || "",
				entry.customerName,
				entry.projectName,
				entry.taskName,
				entry.isInvoiced ? "Yes" : "No",
			];
			worksheet.addRow(row);
		});

		// Set column widths
		worksheet.columns = [
			{ width: 12 }, // Date
			{ width: 10 }, // Start Time
			{ width: 10 }, // End Time
			{ width: 12 }, // Duration
			{ width: 40 }, // Description
			{ width: 20 }, // Customer
			{ width: 20 }, // Project
			{ width: 20 }, // Task
			{ width: 10 }, // Invoiced
		];

		// Generate a filename with current date
		const fileName = `TimeLog_Export_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

		// Write the workbook to a buffer
		const buffer = await workbook.xlsx.writeBuffer();
		const uint8Array = new Uint8Array(buffer);

		// Return the Excel file
		return new NextResponse(uint8Array, {
			status: 200,
			headers: {
				"Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"Content-Disposition": `attachment; filename="${fileName}"`,
				"Content-Length": uint8Array.length.toString(),
			},
		});
	} catch (error: any) {
		console.error("Error exporting time log:", error);
		return NextResponse.json({ message: "Error exporting time log", error: error.message }, { status: 500 });
	}
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { generateInvoicePdf } from "@/app/utils/PdfService";
import fs from "fs/promises";
import path from "path";
import { TimeEntryData } from "@/types";
import { Customer, Project, Task, TimeEntry, User } from "@/prisma/app/generated/prisma/client";

function logError(step: string, error: any) {
	console.error(`Error in ${step}:`, error.message);
	if (error.stack) {
		console.error(error.stack.split("\n").slice(0, 3).join("\n"));
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { timeEntryIds, selectAll, filters } = body;
		
		let timeEntries;
		
		if (selectAll && filters) {
			// Handle select all with filters
			console.log("Processing all entries with filters:", filters);
			
			let whereClause: any = {};
			
			if (filters.startDate) {
				whereClause.date = { ...whereClause.date, gte: new Date(filters.startDate) };
			}
			
			if (filters.endDate) {
				whereClause.date = { ...whereClause.date, lte: new Date(filters.endDate) };
			}
			
			if (filters.customerId) {
				whereClause.customerId = filters.customerId;
			}
			
			if (filters.invoiceStatus && filters.invoiceStatus !== "all") {
				whereClause.isInvoiced = filters.invoiceStatus === "true";
			}
			
			try {
				timeEntries = await prisma.timeEntry.findMany({
					where: whereClause,
					include: { customer: true, task: true, user: true, project: true },
				});
				console.log(`Retrieved ${timeEntries.length} time entries using filters`);
			} catch (dbError) {
				logError("fetching time entries with filters", dbError);
				return NextResponse.json({ error: "Database error when fetching time entries" }, { status: 500 });
			}
		} else if (timeEntryIds && timeEntryIds.length > 0) {
			// Handle specific IDs
			console.log(`Processing ${timeEntryIds.length} time entries`);
			
			try {
				timeEntries = await prisma.timeEntry.findMany({
					where: { id: { in: timeEntryIds } },
					include: { customer: true, task: true, user: true, project: true },
				});
				console.log(`Retrieved ${timeEntries.length} time entries`);
			} catch (dbError) {
				logError("fetching time entries", dbError);
				return NextResponse.json({ error: "Database error when fetching time entries" }, { status: 500 });
			}
		} else {
			return NextResponse.json({ error: "No time entries specified" }, { status: 400 });
		}

		if (timeEntries.length === 0) {
			console.log("No time entries found");
			return NextResponse.json({ error: "No time entries found" }, { status: 400 });
		}

		// Group time entries by customer
		const entriesByCustomer = timeEntries.reduce((acc: any, entry: any) => {
			const customerId = entry.customerId;
			if (!acc[customerId]) {
				acc[customerId] = [];
			}
			acc[customerId].push(entry);
			return acc;
		}, {});

		// Check if all entries belong to the same customer
		const customerIds = Object.keys(entriesByCustomer);
		if (customerIds.length > 1) {
			return NextResponse.json({ 
				error: "Selected time entries belong to multiple customers. Please select entries from a single customer only." 
			}, { status: 400 });
		}

		const customer = timeEntries[0].customer;
		const totalAmount = timeEntries.reduce(
			(total: number, entry: TimeEntry & { project: Project }) => total + (entry.duration * (entry.project.rate ?? 0)) / 60,
			0
		);

		let invoice;
		try {
			// Extract the IDs from the fetched time entries
			const entryIds = timeEntries.map((entry: any) => entry.id);
			
			invoice = await prisma.invoice.create({
				data: {
					customerId: customer.id,
					totalAmount,
					timeEntries: { connect: entryIds.map((id: number) => ({ id })) },
				},
			});
			console.log(`Created invoice: ${invoice.id}`);
		} catch (invoiceError) {
			logError("creating invoice in database", invoiceError);
			return NextResponse.json({ error: "Error creating invoice in database" }, { status: 500 });
		}

		const timeEntryDataArray: TimeEntryData[] = timeEntries.map((entry: TimeEntry & { user: User; customer: Customer; project: Project; task: Task }) => {
			const userName = [entry.user?.firstName, entry.user?.lastName].filter(Boolean).join(" ");
			const customerName = entry.customer.name;
			const startDate = new Date(entry.date);
			const startDateIso = startDate.toISOString();
			const endDate = entry.endDate ? new Date(entry.endDate) : new Date(startDate.getTime() + entry.duration * 60_000);

			return {
				duration: entry.duration,
				name: userName || "No Name",
				start: startDateIso,
				end: endDate.toISOString(),
				id: entry.id,
				date: startDateIso,
				startTime: startDateIso,
				endTime: endDate.toISOString(),
				customerName,
				customer: { name: entry.customer?.name, defaultRate: entry.customer.defaultRate },
				project: { name: entry.project?.name || "Unknown Project", rate: entry.project.rate ?? 0 },
				task: { name: entry.task?.name || "Unknown Task" },
				user: {
					name: userName,
					id: entry.user.id,
				},
				isClientInvoiced: entry.isInvoiced ?? false,
				description: entry.description ?? "",
			};
		});

		// Now create pdfData using timeEntryDataArray
		const pdfData = {
			invoiceNumber: `${customer.shortName}-${invoice.id}`,
			paymentTerms: customer.paymentTerms || "30",
			timeEntries: timeEntryDataArray,
		};

		let pdfBytes;
		try {
			pdfBytes = await generateInvoicePdf(pdfData);
			console.log("PDF generated successfully");
		} catch (pdfError) {
			console.error("Error generating PDF:", pdfError);
			return NextResponse.json({ error: "Error generating PDF" }, { status: 500 });
		}

		const pdfFileName = `invoice_${invoice.id}.pdf`;
		const pdfDirectory = path.join(process.cwd(), "public", "invoices");
		const pdfPath = path.join(pdfDirectory, pdfFileName);

		try {
			await fs.mkdir(pdfDirectory, { recursive: true });
			// Convert ArrayBuffer to Buffer before writing
			await fs.writeFile(pdfPath, Buffer.from(pdfBytes));
			console.log(`PDF saved at: ${pdfPath}`);
		} catch (fileError) {
			console.error("Error saving PDF file:", fileError);
			return NextResponse.json({ error: "Error saving PDF file" }, { status: 500 });
		}

		try {
			await prisma.invoice.update({
				where: { id: invoice.id },
				data: { pdfPath: `/invoices/${pdfFileName}` },
			});
			console.log("Invoice updated with PDF path");
		} catch (updateError) {
			logError("updating invoice with PDF path", updateError);
			return NextResponse.json({ error: "Error updating invoice with PDF path" }, { status: 500 });
		}

		try {
			const entryIds = timeEntries.map((entry: any) => entry.id);
			const updateResult = await prisma.timeEntry.updateMany({
				where: { id: { in: entryIds } },
				data: { isInvoiced: true },
			});
			console.log(`${updateResult.count} time entries marked as invoiced`);
		} catch (markError) {
			logError("marking time entries as invoiced", markError);
			return NextResponse.json({ error: "Error marking time entries as invoiced" }, { status: 500 });
		}

		return NextResponse.json({ ...invoice, pdfUrl: `/invoices/${pdfFileName}` }, { status: 201 });
	} catch (error) {
		logError("unexpected error in invoice creation", error);
		return NextResponse.json({ error: "Unexpected error in invoice creation" }, { status: 500 });
	}
}

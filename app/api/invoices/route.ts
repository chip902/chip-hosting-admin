import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { generateInvoicePdf, savePdf } from "@/app/utils/PdfService";

export async function POST(request: NextRequest) {
	try {
		const { timeEntryIds } = await request.json();
		console.log("Received timeEntryIds:", timeEntryIds);

		const timeEntries = await prisma.timeEntry.findMany({
			where: {
				id: { in: timeEntryIds },
			},
			select: {
				id: true,
				description: true,
				duration: true,
				date: true,
				userId: true,
				taskId: true,
				customerId: true,
				projectId: true,
				invoiceId: true,
				Customer: {
					select: {
						id: true,
						name: true,
						email: true,
						defaultRate: true,
						color: true,
					},
				},
				Task: {
					select: {
						id: true,
						name: true,
					},
				},
				User: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				Project: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (timeEntries.length === 0) {
			console.log("No time entries found.");
			return NextResponse.json({ error: "No time entries found" }, { status: 400 });
		}

		const customer = timeEntries[0].Customer;
		const totalAmount = timeEntries.reduce((total, entry) => total + (entry.duration * (entry.Customer?.defaultRate || 0)) / 60, 0);

		const invoice = await prisma.invoice.create({
			data: {
				customerId: customer.id,
				totalAmount,
				timeEntries: {
					connect: timeEntryIds.map((id: number) => ({ id })),
				},
			},
		});

		console.log("Created invoice:", invoice);

		const transformedTimeEntries = timeEntries.map((entry) => ({
			id: entry.id,
			description: entry.description,
			duration: entry.duration,
			date: entry.date,
			userId: entry.userId,
			taskId: entry.taskId,
			customerId: entry.customerId,
			projectId: entry.projectId,
			customer: {
				id: entry.Customer.id,
				name: entry.Customer.name,
				email: entry.Customer.email,
				defaultRate: entry.Customer.defaultRate,
				color: entry.Customer.color,
			},
			task: {
				id: entry.Task.id,
				name: entry.Task.name,
			},
			user: {
				id: entry.User.id,
				name: entry.User.name || "", // Ensure it's a string
				email: entry.User.email,
			},
			project: {
				id: entry.Project.id,
				name: entry.Project.name,
			},
		}));

		const pdfData = {
			id: invoice.id,
			customer,
			totalAmount,
			timeEntries: transformedTimeEntries,
		};

		console.log("Generating PDF with data:", pdfData);

		const pdfBytes = await generateInvoicePdf(pdfData);

		console.log("Saving PDF...");

		const pdfPath = await savePdf(pdfBytes, invoice.id);

		console.log("PDF saved at:", pdfPath);

		await prisma.invoice.update({
			where: { id: invoice.id },
			data: { pdfPath },
		});

		// Mark time entries as invoiced
		const updateResult = await prisma.timeEntry.updateMany({
			where: { id: { in: timeEntryIds } },
			data: { isInvoiced: true },
		});

		console.log("Time entries marked as invoiced:", updateResult);

		return NextResponse.json(invoice, { status: 201 });
	} catch (error) {
		console.error("Error creating invoice:", error);
		return NextResponse.json({ error: "Error creating invoice" }, { status: 500 });
	}
}

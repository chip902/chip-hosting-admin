import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { generateInvoicePdf, savePdf } from "@/app/utils/PdfService";

export async function POST(request: NextRequest) {
	try {
		const { timeEntryIds } = await request.json();

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
			return NextResponse.json({ error: "No time entries found" }, { status: 400 });
		}

		const customerId = timeEntries[0].customerId;
		const totalAmount = timeEntries.reduce((total, entry) => total + (entry.duration * (entry.Customer?.defaultRate || 0)) / 60, 0);

		const invoice = await prisma.invoice.create({
			data: {
				customerId,
				totalAmount,
				timeEntries: {
					connect: timeEntryIds.map((id: number) => ({ id })),
				},
			},
		});

		// Generate PDF
		const pdfBytes = await generateInvoicePdf({
			id: invoice.id,
			customer: timeEntries[0].customerId,
			totalAmount,
			timeEntries,
		});

		// Save PDF
		const pdfPath = await savePdf(pdfBytes, invoice.id);

		// Save PDF path to the database
		await prisma.invoice.update({
			where: { id: invoice.id },
			data: { pdfPath },
		});

		return NextResponse.json(invoice, { status: 201 });
	} catch (error) {
		console.error("Error creating invoice:", error);
		return NextResponse.json({ error: "Error creating invoice" }, { status: 500 });
	}
}

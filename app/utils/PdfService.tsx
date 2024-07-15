import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function generateInvoicePdf(invoiceData: any): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([600, 400]);
	const { width, height } = page.getSize();

	page.drawText(`Invoice ID: ${invoiceData.id}`, {
		x: 50,
		y: height - 50,
		size: 15,
		color: rgb(0, 0, 0),
	});

	page.drawText(`Customer: ${invoiceData.customer.name}`, {
		x: 50,
		y: height - 80,
		size: 12,
		color: rgb(0, 0, 0),
	});

	page.drawText(`Total Amount: $${invoiceData.totalAmount}`, {
		x: 50,
		y: height - 110,
		size: 12,
		color: rgb(0, 0, 0),
	});

	invoiceData.timeEntries.forEach((entry: any, index: number) => {
		page.drawText(`Entry ${index + 1}: ${entry.description} - ${entry.duration} mins`, {
			x: 50,
			y: height - 140 - index * 20,
			size: 10,
			color: rgb(0, 0, 0),
		});
	});

	const pdfBytes = await pdfDoc.save();
	return pdfBytes;
}

export async function savePdf(pdfBytes: Uint8Array, invoiceId: number) {
	const filePath = path.join(__dirname, "invoices", `invoice_${invoiceId}.pdf`);
	fs.writeFileSync(filePath, pdfBytes);
	return filePath;
}

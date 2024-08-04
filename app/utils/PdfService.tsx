// app/utils/PdfService.tsx
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

interface PdfData {
	id: number;
	customer: {
		id: number;
		name: string;
		shortName: string;
		email: string;
		defaultRate: number;
		color: string | null;
	};
	totalAmount: number;
	timeEntries: {
		id: number;
		description: string | null;
		duration: number;
		date: Date;
		userId: number;
		taskId: number;
		customerId: number;
		projectId: number;
		customer: {
			id: number;
			name: string;
			shortName: string | null;
			email: string;
			defaultRate: number;
			color: string | null;
		};
		task: {
			id: number;
			name: string;
		};
		user: {
			id: number;
			name: string;
			email: string;
		};
		project: {
			id: number;
			name: string;
		};
	}[];
}

const wrapText = (text: string, maxWidth: number, fontSize: number, font: any) => {
	const lines = [];
	let line = "";
	const words = text.split(" ");

	for (let i = 0; i < words.length; i++) {
		const testLine = line + words[i] + " ";
		const width = font.widthOfTextAtSize(testLine.replace(/\n/g, ""), fontSize); // Remove newlines

		if (width > maxWidth && i > 0) {
			lines.push(line.trim());
			line = words[i] + " ";
		} else {
			line = testLine;
		}
	}

	lines.push(line.trim());
	return lines;
};

export async function generateInvoicePdf(data: PdfData): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

	// Embed the logo image
	const logoPath = path.resolve(process.cwd(), "public", "CHS_Logo.png");
	const logoBytes = fs.readFileSync(logoPath);
	const logoImage = await pdfDoc.embedPng(logoBytes);
	const logoDims = logoImage.scale(0.5); // Adjust the scale as needed

	const createPage = (isFirstPage = false) => {
		const page = pdfDoc.addPage([600, 750]);
		const { width, height } = page.getSize();

		if (isFirstPage) {
			// Draw the logo image on the first page
			page.drawImage(logoImage, {
				x: 50,
				y: height - 100, // Adjust the Y position as needed
				width: logoDims.width,
				height: logoDims.height,
			});

			page.drawText("Chip Hosting Solutions, LLC", {
				x: 50,
				y: height - 150,
				size: 12,
				font: font,
				color: rgb(0, 0, 0),
			});
			page.drawText("PO Box 397", {
				x: 50,
				y: height - 165,
				size: 12,
				font: font,
				color: rgb(0, 0, 0),
			});
			page.drawText("Pound Ridge, NY 10576", {
				x: 50,
				y: height - 180,
				size: 12,
				font: font,
				color: rgb(0, 0, 0),
			});
			page.drawText("Payment Terms: Net 30 days", {
				x: 50,
				y: height - 195,
				size: 12,
				font: font,
				color: rgb(0, 0, 0),
			});

			page.drawText(`Invoice No. ${data.customer.shortName}-${data.id}`, {
				x: 50,
				y: height - 220,
				size: 15,
				font: font,
				color: rgb(0, 0, 0),
			});

			page.drawText(`Bill To: ${data.customer.name}`, {
				x: 50,
				y: height - 240,
				size: 12,
				font: font,
				color: rgb(0, 0, 0),
			});

			page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
				x: 50,
				y: height - 260,
				size: 12,
				font: font,
				color: rgb(0, 0, 0),
			});

			page.drawText(`Project: ${data.timeEntries[0].project.name}`, {
				x: 50,
				y: height - 280,
				size: 12,
				font: font,
				color: rgb(0, 0, 0),
			});
		}

		// Table Headers
		const tableTopY = isFirstPage ? height - 310 : height - 70;
		const tableX = 50;
		const columnWidths = [250, 80, 80, 80];

		page.drawText("Serviced Item Description", {
			x: tableX,
			y: tableTopY,
			size: 12,
			font: font,
			color: rgb(0, 0, 0),
		});

		page.drawText("Hours", {
			x: tableX + columnWidths[0],
			y: tableTopY,
			size: 12,
			font: font,
			color: rgb(0, 0, 0),
		});

		page.drawText("Rate", {
			x: tableX + columnWidths[0] + columnWidths[1],
			y: tableTopY,
			size: 12,
			font: font,
			color: rgb(0, 0, 0),
		});

		page.drawText("Amount", {
			x: tableX + columnWidths[0] + columnWidths[1] + columnWidths[2],
			y: tableTopY,
			size: 12,
			font: font,
			color: rgb(0, 0, 0),
		});

		return { page, tableTopY: tableTopY - 20 };
	};

	const { page: firstPage, tableTopY: firstTableTopY } = createPage(true);

	let currentY = firstTableTopY;
	let currentPage = firstPage;

	const fontSize = 10;
	const maxWidth = 250; // Adjust maxWidth for the description column

	data.timeEntries.forEach((entry, index) => {
		const lines = wrapText(entry.description || "", maxWidth, fontSize, font);

		lines.forEach((line) => {
			if (currentY - fontSize < 0) {
				const { page, tableTopY } = createPage();
				currentPage = page;
				currentY = tableTopY;
			}

			currentPage.drawText(line, {
				x: 50,
				y: currentY,
				size: fontSize,
				font,
				color: rgb(0, 0, 0),
			});

			currentY -= fontSize;
		});

		// Draw other columns: Hours, Rate, Amount
		currentPage.drawText(`${(entry.duration / 60).toFixed(2)}`, {
			x: 300,
			y: currentY + fontSize * lines.length, // Align with the first line of the description
			size: fontSize,
			font,
			color: rgb(0, 0, 0),
		});

		currentPage.drawText(`$${data.customer.defaultRate.toFixed(2)}`, {
			x: 380,
			y: currentY + fontSize * lines.length, // Align with the first line of the description
			size: fontSize,
			font,
			color: rgb(0, 0, 0),
		});

		const amount = (entry.duration / 60) * data.customer.defaultRate;
		currentPage.drawText(`$${amount.toFixed(2)}`, {
			x: 460,
			y: currentY + fontSize * lines.length, // Align with the first line of the description
			size: fontSize,
			font,
			color: rgb(0, 0, 0),
		});

		currentY -= fontSize; // Add some space between entries
	});

	// Total Amount on the last page
	if (currentY - 20 < 0) {
		const { page, tableTopY } = createPage();
		currentPage = page;
		currentY = tableTopY;
	}

	const totalY = currentY - 20;
	currentPage.drawText(`Total: $${data.totalAmount.toFixed(2)}`, {
		x: 380,
		y: totalY,
		size: 12,
		font: font,
		color: rgb(0, 0, 0),
	});

	const pdfBytes = await pdfDoc.save();
	return pdfBytes;
}

export const ensureDirectoryExistence = (filePath: string) => {
	const dirname = path.dirname(filePath);
	if (fs.existsSync(dirname)) {
		return true;
	}
	ensureDirectoryExistence(dirname);
	fs.mkdirSync(dirname);
};

export const savePdf = async (pdfBytes: Uint8Array, invoiceId: number) => {
	const pdfPath = path.join(process.cwd(), "public", "invoices", `invoice_${invoiceId}.pdf`);
	ensureDirectoryExistence(pdfPath);
	fs.writeFileSync(pdfPath, pdfBytes);
	return pdfPath;
};

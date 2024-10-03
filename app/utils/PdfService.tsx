import fs from "fs";
import path from "path";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PdfData, TableRow, TimeEntry } from "@/types";

export async function generateInvoicePdf(pdfData: PdfData): Promise<Uint8Array> {
	const doc = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "letter",
	});
	// Helper function to round to nearest quarter hour
	function roundToQuarterHour(hours: number): number {
		return Math.round(hours * 4) / 4;
	}
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	}
	function wrapText(text: string, maxWidth: number): string[] {
		const words = text.split(" ");
		const lines: string[] = [];
		let currentLine = "";

		words.forEach((word) => {
			const testLine = currentLine ? `${currentLine} ${word}` : word;
			const testWidth = doc.getTextWidth(testLine);

			if (testWidth > maxWidth) {
				lines.push(currentLine);
				currentLine = word;
			} else {
				currentLine = testLine;
			}
		});

		if (currentLine) {
			lines.push(currentLine);
		}

		return lines;
	}

	// Sort timeEntries by date in ascending order
	pdfData.timeEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	// Load logo
	try {
		const logoPath = path.resolve(process.cwd(), "public", "CHS_Logo.png");
		const logoData = fs.readFileSync(logoPath, { encoding: "base64" });
		doc.addImage(`data:image/png;base64,${logoData}`, "PNG", 10, 10, 30, 30);
	} catch (error) {
		console.error("Error loading logo:", error);
		// Continue without the logo if there's an error
	}

	// Prepare table data
	const tableData: TableRow[] = pdfData.timeEntries.map((entry: TimeEntry) => {
		const rate = entry.Project.rate ?? entry.Customer.defaultRate ?? 0;
		const hours = roundToQuarterHour(entry.duration / 60);
		const amount = hours * rate;

		return {
			date: new Date(entry.date).toLocaleDateString(),
			projectName: entry.Project.name,
			description: entry.description,
			hours: hours,
			rate: rate,
			amount: amount,
		};
	});

	// Load and add custom font
	try {
		// Use an absolute path to the font file
		const fontPath = path.resolve(process.cwd(), "public", "fonts", "Poppins-Regular.ttf");
		const fontData = fs.readFileSync(fontPath);

		doc.addFileToVFS("Poppins-Regular.ttf", fontData.toString("base64"));
		doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
		doc.setFont("Poppins");
	} catch (error) {
		console.error("Error loading custom font:", error);
		// Fall back to a default font if there's an error
		doc.setFont("helvetica");
	}

	// Add invoice details
	doc.setFontSize(12);
	doc.text("Chip Hosting Solutions, LLC", 10, 50);
	doc.setFontSize(10);
	doc.text("PO Box 397", 10, 55);
	doc.text("Pound Ridge, NY 10576", 10, 60);
	doc.text("Payment Terms: Net 30 days", 10, 65);

	const customer = pdfData.timeEntries[0].Customer;
	doc.text(`Invoice No. ${pdfData.invoiceNumber || "N/A"}`, 140, 50);
	doc.text(`Bill To: ${customer.name}`, 140, 55);
	doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 60);
	doc.text(`Project: ${Array.from(new Set(pdfData.timeEntries.map((e) => e.Project.name))).join(", ")}`, 140, 65);

	const projectsText = `Project: ${Array.from(new Set(pdfData.timeEntries.map((e) => e.Project.name))).join(", ")}`;
	const wrappedProjects = wrapText(projectsText, 60);
	wrappedProjects.forEach((line, index) => {
		doc.text(line, 140, 65 + index * 5);
	});

	// Add table
	autoTable(doc, {
		head: [["Date", "Project", "Description", "Hours", "Rate", "Amount"]],
		body: tableData.map((row) => [row.date, row.projectName, row.description, row.hours.toFixed(2), formatCurrency(row.rate), formatCurrency(row.amount)]),
		startY: 80 + wrappedProjects.length * 5,
		styles: { cellPadding: 1.5, fontSize: 8 },
		columnStyles: {
			0: { cellWidth: 20 },
			1: { cellWidth: 30 },
			2: { cellWidth: "auto" },
			3: { cellWidth: 15, halign: "right" },
			4: { cellWidth: 20, halign: "right" },
			5: { cellWidth: 25, halign: "right" },
		},
	});

	// Calculate and format total
	const totalAmount = tableData.reduce((acc, row) => acc + row.amount, 0);
	const formattedTotal = formatCurrency(totalAmount);
	const finalY = (doc as any).lastAutoTable.finalY || 0;
	doc.text(`Total: ${formattedTotal}`, 170, finalY + 10, { align: "right" });

	// Generate PDF
	return doc.output("arraybuffer");
}

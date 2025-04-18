import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/prisma/client";
import { Transaction } from "@prisma/client";

export async function POST(request: Request) {
	try {
		// Get the file data as text
		const formData = await request.formData();
		const file = formData.get("file");

		if (!file || !(file instanceof File)) {
			throw new Error("No file uploaded");
		}

		const fileText = await file.text();

		// Parse CSV with Promise wrapper
		const parseResult = await new Promise<Transaction[]>((resolve, reject) => {
			Papa.parse(fileText, {
				header: true,
				complete: (results) => {
					// Transform the parsed data to match Transaction interface
					const transformedData = results.data.map((row: any) => ({
						id: row.id,
						accountId: row.accountId,
						amount: Number(row.amount),
						date: new Date(row.date),
						name: row.name,
						paymentChannel: row.paymentChannel || "",
						pending: Boolean(row.pending),
						category: row.category || "Uncategorized",
						bankId: Number(row.bankId),
						userId: row.userId,
					}));
					resolve(transformedData as Transaction[]);
				},
				error: (error: any) => {
					reject(error);
				},
			});
		});

		// Process the parsed data
		await processParsedData(parseResult);

		return NextResponse.json({ message: "File processed successfully" });
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
	}
}

async function processParsedData(data: Transaction[]) {
	try {
		// Use createMany with skipDuplicates for bulk insert
		await prisma.transaction.createMany({
			data: data.map((transaction) => ({
				id: transaction.id,
				accountId: transaction.accountId,
				amount: transaction.amount,
				date: transaction.date,
				name: transaction.name,
				paymentChannel: transaction.paymentChannel,
				pending: transaction.pending,
				category: transaction.category,
				bankId: transaction.bankId,
				userId: transaction.userId,
			})),
			skipDuplicates: true,
		});
	} catch (error) {
		console.error("Error in processParsedData:", error);
		throw error; // Re-throw to be caught by the main try-catch
	}
}

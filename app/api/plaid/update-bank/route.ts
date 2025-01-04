// app/api/plaid/update-bank/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";

export async function POST(request: NextRequest) {
	try {
		const { bankId, accountId } = await request.json();

		const updatedBank = await prisma.bank.update({
			where: {
				id: bankId,
			},
			data: {
				accountId,
			},
		});

		return NextResponse.json(updatedBank);
	} catch (error) {
		console.error("Error updating bank:", error);
		return NextResponse.json({ error: "Error updating bank" }, { status: 500 });
	}
}

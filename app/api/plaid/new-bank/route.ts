// /app/api/plaid/new-bank/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const { userId, bankId, accountId, accessToken, fundingSourceUrl, sharableId, institutionName } = body;

		// Validate required fields
		if (!userId || !bankId || !accountId || !accessToken || !fundingSourceUrl || !sharableId) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const newBank = await prisma.bank.create({
			data: {
				userId: userId,
				bankId: bankId,
				accountId: accountId,
				accessToken: accessToken,
				institutionName: institutionName,
				User: {
					connect: { userId: userId },
				},
			},
		});

		return NextResponse.json(newBank, { status: 201 });
	} catch (error) {
		console.error("Error creating Bank:", error);
		return NextResponse.json({ error: "Error creating Bank" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const banks = await prisma.bank.findMany();
		return NextResponse.json(banks, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching banks..." }, { status: 500 });
	}
}

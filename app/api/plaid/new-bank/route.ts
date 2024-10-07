// /app/api/plaid/new-bank/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const { userId, bankId, accountId, accessToken, fundingSourceUrl, sharableId } = body;

		const newBank = await prisma.bank.create({
			data: {
				userId: userId,
				bankId: bankId,
				accountId: accountId,
				accessToken: accessToken,
				fundingSourceUrl: fundingSourceUrl,
				sharableId: sharableId,
			},
		});
		return NextResponse.json(newBank, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Error creating Bank" }, { status: 500 });
	}
}

// export async function PATCH(request: NextRequest) {
// 	try {
// 		const body = await request.json();
// 		const validation = authFormSchema(body.type).safeParse(body);
// 		if (!validation.success) {
// 			return NextResponse.json(validation.error.format(), { status: 400 });
// 		}
// 		const { email, password } = body;

// 		if (!email || !password) {
// 			return NextResponse.json({ message: "Missing fields" }, { status: 400 });
// 		}

// 		const hashedPassword = await bcrypt.hash(password, 10);
// 		const updatedUser = await prisma.user.update({
// 			where: { id: body.id },
// 			data: {
// 				firstName: body.firstname,
// 				lastName: body.lastName,
// 				email: body.email,
// 				address: body.address,
// 				city: body.city,
// 				postalCode: body.postalCode,
// 				dob: body.dob,
// 				ssn: body.ssn,
// 				password: hashedPassword,
// 			},
// 		});
// 		return NextResponse.json(updatedUser, { status: 200 });
// 	} catch (error) {
// 		return NextResponse.json({ error: "Error updating user" }, { status: 500 });
// 	}
// }

export async function GET() {
	try {
		const banks = await prisma.bank.findMany();
		return NextResponse.json(banks, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching banks..." }, { status: 500 });
	}
}

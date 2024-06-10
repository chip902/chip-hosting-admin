import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { customerSchema } from "../../validationSchemas";

export async function POST(request: NextRequest) {
	const body = await request.json();
	const validation = customerSchema.safeParse(body);
	if (!validation.success) return NextResponse.json(validation.error.format(), { status: 400 });
	const newCustomer = await prisma.customer.create({
		data: {
			name: body.name,
			email: body.email,
			defaultRate: body.defaultRate,
		},
	});
	return NextResponse.json(newCustomer, { status: 201 });
}
export async function GET() {
	try {
		const customers = await prisma.customer.findMany();
		return NextResponse.json(customers, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching customers" }, { status: 500 });
	}
}

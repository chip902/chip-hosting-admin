import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { customerSchema } from "@/app/validationSchemas";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = customerSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}
		const newCustomer = await prisma.customer.create({
			data: {
				name: body.name,
				email: body.email,
				defaultRate: body.rate,
				color: body.color,
			},
		});
		return NextResponse.json(newCustomer, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Error creating customer" }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = customerSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}
		const updatedCustomer = await prisma.customer.update({
			where: { id: body.id },
			data: {
				name: body.name,
				email: body.email,
				defaultRate: body.rate,
				color: body.color,
			},
		});
		return NextResponse.json(updatedCustomer, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error updating customer" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const customers = await prisma.customer.findMany();
		return NextResponse.json(customers, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: "Error fetching customers" }, { status: 500 });
	}
}

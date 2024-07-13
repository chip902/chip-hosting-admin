import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { customerSchema } from "@/app/validationSchemas";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	const customer = await prisma.customer.findUnique({
		where: { id: parseInt(params.id) },
	});
	if (!customer) return NextResponse.json({ error: "Invalid customer..." }, { status: 404 });
	await prisma.customer.delete({
		where: { id: parseInt(params.id) },
	});
	return NextResponse.json({ message: "Customer deleted." }, { status: 201 });
}
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
				color: body.color, // Add color field here
			},
		});
		return NextResponse.json(newCustomer, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Error creating customer" }, { status: 500 });
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
export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = customerSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}

		const { id, ...data } = body;

		if (!id) {
			return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
		}

		const updatedCustomer = await prisma.customer.update({
			where: { id: id },
			data: {
				name: data.name,
				email: data.email,
				defaultRate: data.defaultRate,
				color: data.color,
			},
		});

		return NextResponse.json(updatedCustomer, { status: 201 });
	} catch (error) {
		console.error("Error updating customer:", error);
		return NextResponse.json({ error: "Error updating customer" }, { status: 500 });
	}
}

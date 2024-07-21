import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { customerSchema } from "@/app/validationSchemas";

// DELETE request to delete a customer by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const id = parseInt(params.id);
		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
		}

		const customer = await prisma.customer.findUnique({
			where: { id },
		});
		if (!customer) {
			return NextResponse.json({ error: "Customer not found" }, { status: 404 });
		}

		await prisma.customer.delete({
			where: { id },
		});
		return NextResponse.json({ message: "Customer deleted." }, { status: 200 });
	} catch (error) {
		console.error("Error deleting customer:", error);
		return NextResponse.json({ error: "Error deleting customer" }, { status: 500 });
	}
}

// POST request to create a new customer
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
				shortName: body.shortName,
				email: body.email,
				defaultRate: body.defaultRate,
				color: body.color,
			},
		});
		return NextResponse.json(newCustomer, { status: 201 });
	} catch (error) {
		console.error("Error creating customer:", error);
		return NextResponse.json({ error: "Error creating customer" }, { status: 500 });
	}
}

// GET request to fetch a customer by ID
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const id = parseInt(searchParams.get("id") || "");
		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
		}

		const customer = await prisma.customer.findUnique({
			where: { id },
		});
		if (!customer) {
			return NextResponse.json({ error: "Customer not found" }, { status: 404 });
		}

		return NextResponse.json(customer, { status: 200 });
	} catch (error) {
		console.error("Error fetching customer:", error);
		return NextResponse.json({ error: "Error fetching customer" }, { status: 500 });
	}
}

// PATCH request to update an existing customer
export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		console.log("Received body:", body); // Log received body
		const validation = customerSchema.safeParse(body);
		console.log("Validation result:", validation);
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
				shortName: data.shortName,
				email: data.email,
				defaultRate: data.defaultRate,
				color: data.color,
			},
		});

		return NextResponse.json(updatedCustomer, { status: 200 });
	} catch (error) {
		console.error("Error updating customer:", error);
		return NextResponse.json({ error: "Error updating customer" }, { status: 500 });
	}
}

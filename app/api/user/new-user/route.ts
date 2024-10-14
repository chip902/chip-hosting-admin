// /app/api/user/new-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { authFormSchema } from "@/app/validationSchemas";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = authFormSchema(body.type).safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json({ message: "Missing fields" }, { status: 400 });
		}

		// Check if the email already exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});
		if (existingUser) {
			return NextResponse.json({ message: "Email already registered" }, { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		// Generate a unique userId
		const userId = uuidv4();

		const newUser = await prisma.user.create({
			data: {
				userId, // Assign the generated UUID to userId
				firstName: body.firstName,
				lastName: body.lastName,
				email: body.email,
				address: body.address,
				city: body.city,
				postalCode: body.postalCode,
				dob: body.dob,
				ssn: body.ssn,
				password: hashedPassword,
			},
		});
		return NextResponse.json(newUser, { status: 201 });
	} catch (error) {
		console.error("Error creating user:", error);
		return NextResponse.json({ error: "Error creating user" }, { status: 500 });
	}
}

// Existing PATCH method for updating users
export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const validation = authFormSchema(body.type).safeParse(body);
		if (!validation.success) {
			return NextResponse.json(validation.error.format(), { status: 400 });
		}
		const { id, email, password } = body;

		if (!id || !email || !password) {
			return NextResponse.json({ message: "Missing fields" }, { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const updatedUser = await prisma.user.update({
			where: { id },
			data: {
				firstName: body.firstName,
				lastName: body.lastName,
				email: body.email,
				address: body.address,
				city: body.city,
				postalCode: body.postalCode,
				dob: body.dob,
				ssn: body.ssn,
				password: hashedPassword,
			},
		});
		return NextResponse.json(updatedUser, { status: 200 });
	} catch (error) {
		console.error("Error updating user:", error);
		return NextResponse.json({ error: "Error updating user" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const users = await prisma.user.findMany();
		return NextResponse.json(users, { status: 200 });
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json({ error: "Error fetching users..." }, { status: 500 });
	}
}
